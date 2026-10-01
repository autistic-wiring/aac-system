package cc.nexvision.aac;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.TextView;

/**
 * Kiosk shell for the AAC board.
 *
 * Two levels of lockdown, because the stronger one is not always available:
 *
 *  - Lock task (true kiosk). When this app is the device owner,
 *    startLockTask() pins the tablet to it: no home button, no recents, no
 *    status bar, hardware back does nothing. Needs one-time provisioning.
 *  - Immersive sticky (fallback). System bars are hidden and any tap brings
 *    them back transiently. Survives a factory reset, which lock task does not.
 *
 * Screen wake, orientation, and the web app's own kiosk lock are handled in
 * the browser; this layer is what the browser cannot reach.
 */
public class MainActivity extends Activity {

    private WebView web;
    private FrameLayout root;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#6C63FF"));

        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);

        // Long-press on a word card must speak, not open the WebView text menu.
        web.setLongClickable(false);
        web.setOnLongClickListener(v -> true);
        web.setHapticFeedbackEnabled(false);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
                // The board never navigates. Anything else would be an exit
                // attempt, so keep it in the shell instead of the browser.
                return !isBoardUrl(req.getUrl());
            }

            @Override
            public void onReceivedError(WebView v, WebResourceRequest req, WebResourceError err) {
                if (req.isForMainFrame()) showLoadError();
            }
        });

        if (savedInstanceState == null) {
            web.loadUrl(getString(R.string.board_url));
        } else {
            web.restoreState(savedInstanceState);
        }

        root.addView(web, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(root);

        applyImmersive();
        startLockTaskIfAllowed();
    }

    private boolean isBoardUrl(android.net.Uri uri) {
        String host = uri.getHost();
        return host != null && host.endsWith("nexvision.cc");
    }

    private void showLoadError() {
        TextView msg = new TextView(this);
        msg.setText(R.string.load_error);
        msg.setTextColor(Color.WHITE);
        msg.setTextSize(20);
        msg.setGravity(android.view.Gravity.CENTER);
        msg.setPadding(48, 48, 48, 48);
        msg.setOnClickListener(v -> web.reload());
        root.addView(msg, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));
    }

    /**
     * Lock task is the real thing, but it is only permitted for the device
     * owner. Silently skip otherwise and stay in immersive mode.
     */
    private void startLockTaskIfAllowed() {
        DevicePolicyManager dpm = (DevicePolicyManager) getSystemService(Context.DEVICE_POLICY_SERVICE);
        if (dpm == null || !dpm.isAdminActive(new ComponentName(this, KioskDeviceAdminReceiver.class))) {
            return;
        }
        if (!dpm.isLockTaskPermitted(getPackageName())) return;
        startLockTask();
    }

    /**
     * Immersive sticky. The system bars come back on a swipe but hide again
     * on their own, so a user cannot park the tablet on the home screen.
     */
    private void applyImmersive() {
        View decor = getWindow().getDecorView();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
            android.view.WindowInsetsController c = decor.getWindowInsetsController();
            if (c != null) {
                c.hide(android.view.WindowInsets.Type.systemBars());
                c.setSystemBarsBehavior(
                        android.view.WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            decor.setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        // A swipe or a notification can restore the bars; re-hide on regaining focus.
        if (hasFocus) applyImmersive();
    }

    @Override
    public void onResume() {
        super.onResume();
        web.onResume();
        applyImmersive();
    }

    @Override
    public void onPause() {
        web.onPause();
        super.onPause();
    }

    /** Swallow hardware back. The board handles navigation in-page. */
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK) return true;
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    protected void onDestroy() {
        web.destroy();
        super.onDestroy();
    }
}

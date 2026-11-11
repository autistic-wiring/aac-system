package cc.nexvision.aac;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ResolveInfo;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.KeyEvent;
import android.view.MotionEvent;
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

    // Caregiver exit, top-left corner (top-right belongs to the web layer's
    // own 3s unlock). Either tap 5x within 3s or slide inward from the
    // corner. Touches pass through to the page untouched.
    private static final int EXIT_CORNER_DP = 96;
    private static final int EXIT_TAPS = 5;
    private static final long EXIT_WINDOW_MS = 3000;
    private static final int EXIT_SLIDE_DP = 200;
    private final java.util.ArrayList<Long> cornerTaps = new java.util.ArrayList<>();
    private float slideStartX = -1;
    private float slideStartY = -1;

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

        // Caregiver exit watcher. Returns false so every touch still reaches
        // the page (a tap here may also hit the sentence strip — harmless).
        web.setOnTouchListener((v, e) -> {
            watchExitGesture(e);
            return false;
        });

        // Debug builds only: lets a dev machine attach DevTools to the WebView
        // over `adb forward localabstract:webview_devtools_remote_<pid>`.
        // Exposes page internals, so it must never ship in a release build.
        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        web.addJavascriptInterface(new NativeBridge(this), "AACNative");

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
     * owner. Self-whitelist when we are the owner (the `dpm`/`device_policy`
     * CLIs no longer expose set-locktask-packages on Android 15), then pin.
     * Silently skip otherwise and stay in immersive mode.
     */
    private void startLockTaskIfAllowed() {
        DevicePolicyManager dpm = (DevicePolicyManager) getSystemService(Context.DEVICE_POLICY_SERVICE);
        ComponentName admin = new ComponentName(this, KioskDeviceAdminReceiver.class);
        if (dpm == null || !dpm.isAdminActive(admin)) {
            return;
        }
        if (dpm.isDeviceOwnerApp(getPackageName())) {
            try {
                dpm.setLockTaskPackages(admin, new String[]{getPackageName()});
            } catch (Exception ignored) {
            }
            // LOCK_TASK_FEATURE_NONE hides notifications, home, recents,
            // keyguard and global actions inside lock task, so the system
            // bars have nothing to show. Needs API 28+.
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                try {
                    dpm.setLockTaskFeatures(admin, DevicePolicyManager.LOCK_TASK_FEATURE_NONE);
                } catch (Exception ignored) {
                }
            }
        }
        if (!dpm.isLockTaskPermitted(getPackageName())) return;
        try {
            startLockTask();
        } catch (Exception ignored) {
        }
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
        // Re-pin on every return (launcher icon tap, Home press), not just
        // first launch, so no ADB is needed to re-enter kiosk.
        startLockTaskIfAllowed();
    }

    @Override
    public void onPause() {
        web.onPause();
        super.onPause();
    }

    /** Top-left tap-x5 or slide-inward exits kiosk to the real launcher. */
    private void watchExitGesture(MotionEvent e) {
        float density = getResources().getDisplayMetrics().density;
        float corner = EXIT_CORNER_DP * density;
        switch (e.getActionMasked()) {
            case MotionEvent.ACTION_DOWN:
                if (e.getX() < corner && e.getY() < corner) {
                    slideStartX = e.getX();
                    slideStartY = e.getY();
                    long now = SystemClock.uptimeMillis();
                    cornerTaps.add(now);
                    while (!cornerTaps.isEmpty() && now - cornerTaps.get(0) > EXIT_WINDOW_MS) {
                        cornerTaps.remove(0);
                    }
                    if (cornerTaps.size() >= EXIT_TAPS) {
                        cornerTaps.clear();
                        slideStartX = -1;
                        exitKioskToLauncher();
                    }
                } else {
                    slideStartX = -1;
                }
                break;
            case MotionEvent.ACTION_MOVE:
                if (slideStartX >= 0) {
                    float dx = e.getX() - slideStartX;
                    float dy = e.getY() - slideStartY;
                    if (Math.hypot(dx, dy) > EXIT_SLIDE_DP * density) {
                        slideStartX = -1;
                        cornerTaps.clear();
                        exitKioskToLauncher();
                    }
                }
                break;
            case MotionEvent.ACTION_UP:
            case MotionEvent.ACTION_CANCEL:
                slideStartX = -1;
                break;
            default:
                break;
        }
    }

    /**
     * Caregiver exit: drop the pin and open the real launcher. Launches it
     * explicitly — a generic HOME intent would resolve back to us (we are the
     * default home) and re-pin on resume. Tapping the AAC icon re-enters
     * kiosk. Falls back to Settings if no other launcher is found.
     */
    private void exitKioskToLauncher() {
        try {
            stopLockTask();
        } catch (Exception ignored) {
        }
        String self = getPackageName();
        String targetPkg = null;
        String targetCls = null;
        try {
            Intent query = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME);
            java.util.List<ResolveInfo> candidates =
                    getPackageManager().queryIntentActivities(query, 0);
            // Prefer a real launcher; some OEMs expose game/child modes as
            // HOME too (e.g. com.blackview.gamemode is NOT home).
            for (int pass = 0; pass < 2 && targetCls == null; pass++) {
                for (ResolveInfo ri : candidates) {
                    String pkg = ri.activityInfo.packageName;
                    if (self.equals(pkg)) continue;
                    if (pass == 0 && !pkg.toLowerCase().contains("launcher")) continue;
                    targetPkg = pkg;
                    targetCls = ri.activityInfo.name;
                    break;
                }
            }
        } catch (Exception ignored) {
        }
        try {
            Intent i;
            if (targetCls != null) {
                i = new Intent(Intent.ACTION_MAIN);
                i.setClassName(targetPkg, targetCls);
            } else {
                i = new Intent(android.provider.Settings.ACTION_SETTINGS);
            }
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(i);
        } catch (Exception ignored) {
        }
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

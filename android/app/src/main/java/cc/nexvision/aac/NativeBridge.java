package cc.nexvision.aac;

import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.BatteryManager;
import android.webkit.JavascriptInterface;

/**
 * Exposes the device's charging state to the web app.
 *
 * Android WebView does not implement the Battery Status API, so
 * `navigator.getBattery` is undefined inside this shell and the board would
 * dim itself even while parked on its charger. The web layer prefers this
 * bridge and falls back to the Battery Status API when it is absent.
 *
 * Read-only and side-effect free. Registered on the WebView before any page
 * loads; the board is served from a fixed HTTPS origin, so there is no
 * untrusted content to expose this to.
 */
public class NativeBridge {

    private final Context context;

    NativeBridge(Context context) {
        this.context = context.getApplicationContext();
    }

    /**
     * True when the device is on external power. Reports true for
     * BATTERY_STATUS_FULL too: a full battery is still docked, and the
     * stand is the reason the screen should stay lit.
     */
    @JavascriptInterface
    public boolean isCharging() {
        Intent status = context.registerReceiver(null,
                new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
        if (status == null) return false;
        int value = status.getIntExtra("status", -1);
        return value == BatteryManager.BATTERY_STATUS_CHARGING
                || value == BatteryManager.BATTERY_STATUS_FULL;
    }

    /**
     * Battery percent and charging state as "level,charging", e.g. "87,true".
     * Empty string when unknown. Lets the board show a battery gauge that
     * works fully offline (WebView has no Battery Status API at all).
     */
    @JavascriptInterface
    public String getBattery() {
        Intent status = context.registerReceiver(null,
                new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
        if (status == null) return "";
        int level = status.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
        int scale = status.getIntExtra(BatteryManager.EXTRA_SCALE, 100);
        if (level < 0) return "";
        int value = status.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
        boolean charging = value == BatteryManager.BATTERY_STATUS_CHARGING
                || value == BatteryManager.BATTERY_STATUS_FULL;
        return Math.round(level * 100f / scale) + "," + charging;
    }
}

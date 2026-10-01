package cc.nexvision.aac;

import android.app.admin.DeviceAdminReceiver;
import android.content.Context;
import android.content.Intent;

/** Device-admin receiver. Only force-lock is declared, so there is nothing to enforce here. */
public class KioskDeviceAdminReceiver extends DeviceAdminReceiver {
    @Override
    public void onEnabled(Context context, Intent intent) {
        // Lock task is started by MainActivity once it sees the active admin.
    }
}

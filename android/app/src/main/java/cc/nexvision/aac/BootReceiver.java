package cc.nexvision.aac;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Auto-start the kiosk after a reboot so the board is always on. */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            Intent launch = new Intent(context, MainActivity.class);
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(launch);
        }
    }
}

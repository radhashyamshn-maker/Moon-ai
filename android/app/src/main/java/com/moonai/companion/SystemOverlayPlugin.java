package com.moonai.companion;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * SystemOverlayPlugin
 * Bridges JavaScript/React calls with Android native SystemOverlayService
 * Controls WindowManager overlay, permission checking, and automatic redirection to Settings.
 */
@CapacitorPlugin(name = "SystemOverlay")
public class SystemOverlayPlugin extends Plugin {

    @PluginMethod
    public void checkOverlayPermission(PluginCall call) {
        Context context = getContext();
        boolean granted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            granted = Settings.canDrawOverlays(context);
        }
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        Context context = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(context)) {
                Intent intent = new Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + context.getPackageName())
                );
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);

                JSObject ret = new JSObject();
                ret.put("openedSettings", true);
                call.resolve(ret);
                return;
            }
        }
        JSObject ret = new JSObject();
        ret.put("openedSettings", false);
        ret.put("alreadyGranted", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void startOverlay(PluginCall call) {
        Context context = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(context)) {
            call.reject("OVERLAY_PERMISSION_DENIED", "SYSTEM_ALERT_WINDOW permission is not granted");
            return;
        }

        String badgeText = call.getString("badgeText", "JARVIS Active");

        Intent intent = new Intent(context, SystemOverlayService.class);
        intent.setAction(SystemOverlayService.ACTION_START_OVERLAY);
        intent.putExtra(SystemOverlayService.EXTRA_BADGE_TEXT, badgeText);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }

        JSObject ret = new JSObject();
        ret.put("status", "started");
        call.resolve(ret);
    }

    @PluginMethod
    public void stopOverlay(PluginCall call) {
        Context context = getContext();
        Intent intent = new Intent(context, SystemOverlayService.class);
        intent.setAction(SystemOverlayService.ACTION_STOP_OVERLAY);
        context.startService(intent);

        JSObject ret = new JSObject();
        ret.put("status", "stopped");
        call.resolve(ret);
    }
}

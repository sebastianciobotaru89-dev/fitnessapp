package com.portia.app;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Hands the day's figures to the home screen widgets: one small JSON snapshot, kept in the app's
 * private preferences. Nothing leaves the phone.
 */
@CapacitorPlugin(name = "PortiaWidget")
public class WidgetBridgePlugin extends Plugin {

    @PluginMethod
    public void update(PluginCall call) {
        String data = call.getString("data", "");
        if (data == null || data.isEmpty() || data.length() > 16000) {
            call.reject("Lipsesc datele pentru widget");
            return;
        }
        Context ctx = getContext();
        SharedPreferences prefs = ctx.getSharedPreferences(PortiaWidgets.PREFS, Context.MODE_PRIVATE);
        if (!data.equals(prefs.getString(PortiaWidgets.KEY, null))) {
            prefs.edit().putString(PortiaWidgets.KEY, data).apply();
            PortiaWidgets.updateAll(ctx);
        }
        call.resolve();
    }
}

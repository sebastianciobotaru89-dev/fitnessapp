package com.portia.app;

import android.graphics.Color;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Paints the window behind the web view in the app's background colour. On phones whose
 * Android System WebView is older, Capacitor keeps the page clear of the status and
 * navigation bars, and this colour is what shows behind those bars.
 */
@CapacitorPlugin(name = "PortiaWindow")
public class WindowColorPlugin extends Plugin {

    @PluginMethod
    public void setBackground(PluginCall call) {
        final int color;
        try {
            color = Color.parseColor(call.getString("color", ""));
        } catch (IllegalArgumentException e) {
            call.reject("Culoare invalidă");
            return;
        }
        getActivity().runOnUiThread(() -> {
            getActivity().getWindow().getDecorView().setBackgroundColor(color);
            call.resolve();
        });
    }
}

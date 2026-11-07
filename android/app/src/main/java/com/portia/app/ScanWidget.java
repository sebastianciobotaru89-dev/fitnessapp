package com.portia.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;

/** Home screen shortcut, 1×1: opens Porția on the barcode scanner. */
public class ScanWidget extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        PortiaWidgets.updateAll(context);
    }
}

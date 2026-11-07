package com.portia.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;

/** Home screen widget, 2×2: the dial with what's left of the day. */
public class DayWidgetSmall extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        PortiaWidgets.updateAll(context);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (PortiaWidgets.ACTION_MIDNIGHT.equals(intent.getAction())) {
            PortiaWidgets.updateAll(context);
            return;
        }
        super.onReceive(context, intent);
    }
}

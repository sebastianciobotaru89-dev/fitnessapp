package com.portia.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;

/** Home screen widget, 4×2: the dial plus protein, carbs and fat. */
public class DayWidgetMedium extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        PortiaWidgets.updateAll(context);
    }
}

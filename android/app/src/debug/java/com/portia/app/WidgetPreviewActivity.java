package com.portia.app;

import android.app.Activity;
import android.content.Context;
import android.content.res.Configuration;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;

/**
 * Test build only. Draws the three home screen widgets, light and dark, from the snapshot the app
 * has written, so the emulator check can photograph them (a launcher can't be scripted to add widgets).
 */
public class WidgetPreviewActivity extends Activity {
    private float dp;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        dp = getResources().getDisplayMetrics().density;
        LinearLayout col = new LinearLayout(this);
        col.setOrientation(LinearLayout.VERTICAL);
        col.setPadding(px(18), px(56), px(18), px(18));
        GradientDrawable wall = new GradientDrawable(GradientDrawable.Orientation.TL_BR, new int[] {0xFF9FB8C9, 0xFFD9C7E8, 0xFF2A3346});
        col.setBackground(wall);
        for (boolean night : new boolean[] {false, true}) {
            Configuration c = new Configuration(getResources().getConfiguration());
            c.uiMode = (c.uiMode & ~Configuration.UI_MODE_NIGHT_MASK) | (night ? Configuration.UI_MODE_NIGHT_YES : Configuration.UI_MODE_NIGHT_NO);
            Context ctx = createConfigurationContext(c);
            PortiaWidgets.Day d = PortiaWidgets.read(ctx);
            LinearLayout row = new LinearLayout(this);
            row.setOrientation(LinearLayout.HORIZONTAL);
            row.addView(sized(PortiaWidgets.small(ctx, d).apply(ctx, row), 150, 150));
            row.addView(sized(PortiaWidgets.scan(ctx, d).apply(ctx, row), 64, 64));
            col.addView(row);
            col.addView(sized(PortiaWidgets.medium(ctx, d).apply(ctx, col), 330, 150));
        }
        setContentView(col);
    }

    private View sized(View v, int w, int h) {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(px(w), px(h));
        lp.setMargins(0, 0, px(14), px(14));
        v.setLayoutParams(lp);
        return v;
    }

    private int px(float v) { return Math.round(v * dp); }
}

package com.portia.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.SweepGradient;
import android.net.Uri;
import android.widget.RemoteViews;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

/** Draws all three widgets from the snapshot the app keeps in its preferences. */
public final class PortiaWidgets {
    static final String PREFS = "portia_widget";
    static final String KEY = "snapshot";
    static final String ACTION_MIDNIGHT = "com.portia.app.WIDGET_MIDNIGHT";

    private PortiaWidgets() {}

    /** The colours of one appearance (light or dark) of the chosen theme. */
    static final class Pal {
        int surface = 0xFFFFFFFF, ink = 0xFF14201A, muted = 0xFF646F69, track = 0xFFE9EBE6, kcal = 0xFF0F9D58, over = 0xFFE8590C;
        int prot = 0xFFE5484D, carb = 0xFFE9A100, fat = 0xFF4F6BED, dot = 0xFFF0603A, act = 0xFFFF6A4D;

        static Pal dark() {
            Pal p = new Pal();
            p.surface = 0xFF161A18; p.ink = 0xFFEEF3EF; p.muted = 0xFF94A19A; p.track = 0xFF232A26; p.kcal = 0xFF4ADE8E; p.over = 0xFFFF8A3D;
            p.prot = 0xFFFF6B78; p.carb = 0xFFFFC54D; p.fat = 0xFF8296FF;
            return p;
        }

        static Pal from(JSONObject o, Pal base) {
            if (o == null) return base;
            base.surface = col(o, "surface", base.surface); base.ink = col(o, "ink", base.ink); base.muted = col(o, "muted", base.muted);
            base.track = col(o, "track", base.track); base.kcal = col(o, "kcal", base.kcal); base.over = col(o, "over", base.over);
            base.prot = col(o, "prot", base.prot); base.carb = col(o, "carb", base.carb); base.fat = col(o, "fat", base.fat);
            base.dot = col(o, "dot", base.dot); base.act = col(o, "act", base.act);
            return base;
        }

        private static int col(JSONObject o, String k, int fallback) {
            try { return Color.parseColor(o.optString(k, "")); } catch (Exception e) { return fallback; }
        }
    }

    /** What the widgets show right now: today's figures, or an empty new day after midnight. */
    static final class Day {
        boolean setup;
        double eaten, target, p, pT, c, cT, f, fT;
        Pal pal;

        double remaining() { return Math.max(0, target - eaten); }
        boolean over() { return target > 0 && eaten > target * 1.02; }
        double fraction() { return target > 0 ? eaten / target : 0; }
    }

    static Day read(Context ctx) {
        boolean night = (ctx.getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
        Day d = new Day();
        d.pal = night ? Pal.dark() : new Pal();
        String raw = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null);
        if (raw == null) return d;
        try {
            JSONObject s = new JSONObject(raw);
            d.pal = Pal.from(s.optJSONObject(night ? "dark" : "light"), d.pal);
            if (!s.optBoolean("setup", false) || s.optDouble("target", 0) <= 0) return d;
            d.setup = true;
            String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
            JSONObject next = s.optJSONObject("next");
            if (today.equals(s.optString("day"))) {
                d.eaten = s.optDouble("eaten", 0); d.target = s.optDouble("target", 0);
                d.p = at(s, "p", 0); d.pT = at(s, "p", 1); d.c = at(s, "c", 0); d.cT = at(s, "c", 1); d.f = at(s, "f", 0); d.fT = at(s, "f", 1);
            } else if (next != null && today.equals(next.optString("day"))) {
                d.target = next.optDouble("target", 0); d.pT = next.optDouble("p", 0); d.cT = next.optDouble("c", 0); d.fT = next.optDouble("f", 0);
            } else {
                d.target = s.optDouble("target", 0); d.pT = at(s, "p", 1); d.cT = at(s, "c", 1); d.fT = at(s, "f", 1);
            }
        } catch (Exception e) {
            d.setup = false;
        }
        return d;
    }

    private static double at(JSONObject s, String k, int i) {
        JSONArray a = s.optJSONArray(k);
        return a != null && a.length() > i ? a.optDouble(i, 0) : 0;
    }

    static String num(double v) {
        return NumberFormat.getIntegerInstance(new Locale("ro", "RO")).format(Math.round(v));
    }

    /** The ring: the track, the eaten share as a gradient arc, and the theme's dot riding its end. */
    static Bitmap dial(Day d, int size) {
        Bitmap b = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas cv = new Canvas(b);
        float line = size * 0.085f, r = size / 2f - line * 0.75f, c = size / 2f;
        RectF box = new RectF(c - r, c - r, c + r, c + r);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setStyle(Paint.Style.STROKE);
        p.setStrokeWidth(line);
        p.setStrokeCap(Paint.Cap.ROUND);
        p.setColor(d.pal.track);
        cv.drawCircle(c, c, r, p);
        float frac = (float) Math.min(1, Math.max(0, d.fraction()));
        int ring = d.over() ? d.pal.over : d.pal.kcal;
        if (frac > 0.002f) {
            SweepGradient g = new SweepGradient(c, c, new int[] {withAlpha(ring, 0.45f), ring, ring}, new float[] {0f, Math.max(0.01f, frac), 1f});
            Matrix m = new Matrix();
            m.setRotate(-90, c, c);
            g.setLocalMatrix(m);
            p.setShader(g);
            cv.drawArc(box, -90, 360 * frac, false, p);
            p.setShader(null);
        }
        double a = Math.toRadians(-90 + 360 * frac);
        float kx = c + (float) (r * Math.cos(a)), ky = c + (float) (r * Math.sin(a));
        Paint k = new Paint(Paint.ANTI_ALIAS_FLAG);
        k.setColor(0x33000000);
        cv.drawCircle(kx, ky + line * 0.08f, line * 0.66f, k);
        k.setColor(d.pal.dot);
        cv.drawCircle(kx, ky, line * 0.62f, k);
        k.setColor(Color.WHITE);
        cv.drawCircle(kx, ky, line * 0.24f, k);
        return b;
    }

    static Bitmap bar(double value, double target, int color, int track, int w, int h) {
        Bitmap b = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas cv = new Canvas(b);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setColor(track);
        cv.drawRoundRect(new RectF(0, 0, w, h), h / 2f, h / 2f, p);
        float fw = (float) Math.max(h, w * Math.min(1, value / Math.max(1, target)));
        p.setColor(color);
        cv.drawRoundRect(new RectF(0, 0, fw, h), h / 2f, h / 2f, p);
        return b;
    }

    private static int withAlpha(int color, float a) {
        return Color.argb(Math.round(255 * a), Color.red(color), Color.green(color), Color.blue(color));
    }

    static PendingIntent link(Context ctx, String url, int code) {
        Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        i.setClass(ctx, MainActivity.class);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(ctx, code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static void fillDial(RemoteViews v, Day d) {
        v.setInt(R.id.w_bg, "setColorFilter", d.pal.surface);
        if (!d.setup) {
            v.setImageViewBitmap(R.id.w_dial, Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888));
            v.setTextViewText(R.id.w_label, "Porția");
            v.setTextColor(R.id.w_label, d.pal.ink);
            v.setTextViewText(R.id.w_num, "–");
            v.setTextColor(R.id.w_num, d.pal.muted);
            v.setTextViewText(R.id.w_of, "Deschide aplicația");
            v.setTextColor(R.id.w_of, d.pal.muted);
            return;
        }
        v.setImageViewBitmap(R.id.w_dial, dial(d, 360));
        v.setTextViewText(R.id.w_label, d.over() ? "peste" : "rămase");
        v.setTextColor(R.id.w_label, d.pal.muted);
        v.setTextViewText(R.id.w_num, num(d.over() ? d.eaten - d.target : d.remaining()));
        v.setTextColor(R.id.w_num, d.over() ? d.pal.over : d.pal.ink);
        v.setTextViewText(R.id.w_of, "din " + num(d.target));
        v.setTextColor(R.id.w_of, d.pal.muted);
    }

    private static void fillMacro(RemoteViews v, int dot, int label, int value, int barId, String name, double val, double tgt, int color, Day d) {
        v.setTextColor(dot, color);
        v.setTextViewText(label, name);
        v.setTextColor(label, d.pal.ink);
        v.setTextViewText(value, num(val) + " / " + num(tgt) + " g");
        v.setTextColor(value, d.pal.muted);
        v.setImageViewBitmap(barId, bar(val, tgt, color, d.pal.track, 420, 14));
    }

    static RemoteViews small(Context ctx, Day d) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_day_small);
        fillDial(v, d);
        v.setOnClickPendingIntent(R.id.w_root, link(ctx, "portia://azi", 21));
        return v;
    }

    static RemoteViews medium(Context ctx, Day d) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_day_medium);
        fillDial(v, d);
        fillMacro(v, R.id.w_p_dot, R.id.w_p_label, R.id.w_p_val, R.id.w_p_bar, "Proteine", d.p, d.pT, d.pal.prot, d);
        fillMacro(v, R.id.w_c_dot, R.id.w_c_label, R.id.w_c_val, R.id.w_c_bar, "Glucide", d.c, d.cT, d.pal.carb, d);
        fillMacro(v, R.id.w_f_dot, R.id.w_f_label, R.id.w_f_val, R.id.w_f_bar, "Grăsimi", d.f, d.fT, d.pal.fat, d);
        v.setOnClickPendingIntent(R.id.w_root, link(ctx, "portia://azi", 22));
        return v;
    }

    static RemoteViews scan(Context ctx, Day d) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_scan);
        v.setInt(R.id.w_bg, "setColorFilter", d.pal.act);
        v.setOnClickPendingIntent(R.id.w_root, link(ctx, "portia://scan", 23));
        return v;
    }

    /** Redraws every Porția widget on the home screen, and wakes them again just after midnight. */
    static void updateAll(Context ctx) {
        AppWidgetManager m = AppWidgetManager.getInstance(ctx);
        Day d = read(ctx);
        for (int id : m.getAppWidgetIds(new ComponentName(ctx, DayWidgetSmall.class))) m.updateAppWidget(id, small(ctx, d));
        for (int id : m.getAppWidgetIds(new ComponentName(ctx, DayWidgetMedium.class))) m.updateAppWidget(id, medium(ctx, d));
        for (int id : m.getAppWidgetIds(new ComponentName(ctx, ScanWidget.class))) m.updateAppWidget(id, scan(ctx, d));
        scheduleMidnight(ctx);
    }

    private static void scheduleMidnight(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Calendar c = Calendar.getInstance();
        c.add(Calendar.DAY_OF_YEAR, 1);
        c.set(Calendar.HOUR_OF_DAY, 0);
        c.set(Calendar.MINUTE, 1);
        c.set(Calendar.SECOND, 0);
        Intent i = new Intent(ctx, DayWidgetSmall.class).setAction(ACTION_MIDNIGHT);
        PendingIntent pi = PendingIntent.getBroadcast(ctx, 31, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        am.set(AlarmManager.RTC, c.getTimeInMillis(), pi);
    }
}

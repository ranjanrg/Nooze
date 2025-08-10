package com.nooze;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.os.Build;
import android.util.Log;

import java.util.Calendar;

/**
 * Handles BOOT_COMPLETED without starting restricted foreground services on Android 15+.
 * Reschedules the next exact alarm inline.
 */
public class BootCompletedReceiver extends BroadcastReceiver {
    private static final String TAG = "BootCompletedReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent != null && Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            Log.d(TAG, "BOOT_COMPLETED received - rescheduling next alarm inline");
            final PendingResult result = goAsync();
            new Thread(() -> {
                try {
                    rescheduleInline(context);
                } catch (Exception e) {
                    Log.e(TAG, "Error rescheduling after boot: " + e.getMessage());
                } finally {
                    result.finish();
                }
            }).start();
        }
    }

    private void rescheduleInline(Context context) {
        SharedPreferences prefs = context.getSharedPreferences("NoozePrefs", Context.MODE_PRIVATE);
        int hour = prefs.getInt("dailyWakeHour", -1);
        int minute = prefs.getInt("dailyWakeMinute", -1);
        if (hour < 0 || minute < 0) {
            Log.d(TAG, "No persisted daily time; nothing to reschedule");
            return;
        }

        long triggerTime = computeNextTrigger(hour, minute);
        int alarmId = prefs.getInt("lastAlarmId", 1001);

        Intent nextIntent = new Intent(context, AlarmBroadcastReceiver.class);
        nextIntent.putExtra("ALARM_ID", alarmId);
        nextIntent.putExtra("TITLE", "Alarm " + alarmId);
        nextIntent.putExtra("RECURRING", false);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pi = PendingIntent.getBroadcast(context, alarmId, nextIntent, flags);

        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            am.setAlarmClock(new AlarmManager.AlarmClockInfo(triggerTime, pi), pi);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pi);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            am.setAlarmClock(new AlarmManager.AlarmClockInfo(triggerTime, pi), pi);
        } else {
            am.setExact(AlarmManager.RTC_WAKEUP, triggerTime, pi);
        }

        prefs.edit().putLong("lastTriggerTime", triggerTime).apply();
        Log.d(TAG, "Inline boot reschedule complete for: " + new java.util.Date(triggerTime));
    }

    private long computeNextTrigger(int hour, int minute) {
        Calendar cal = Calendar.getInstance();
        Calendar now = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, hour);
        cal.set(Calendar.MINUTE, minute);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        if (cal.getTimeInMillis() <= now.getTimeInMillis()) {
            cal.add(Calendar.DAY_OF_YEAR, 1);
        }
        return cal.getTimeInMillis();
    }
}




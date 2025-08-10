package com.nooze;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import java.util.Calendar;
import java.util.List;

public class AlarmBroadcastReceiver extends BroadcastReceiver {
    private static final String TAG = "AlarmBroadcastReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent.getAction() == null || !intent.getAction().equals(Intent.ACTION_BOOT_COMPLETED)) {
            Log.d(TAG, "Alarm received - starting alarm service");
            startAlarmService(context, intent);
            // Immediately queue tomorrow's alarm to ensure daily continuity even if math isn't completed
            try {
                scheduleNextDailyAlarm(context);
            } catch (Exception e) {
                Log.e(TAG, "Failed to schedule next daily alarm on trigger: " + e.getMessage());
            }
        }
    }

    private void startAlarmService(Context context, Intent intent) {
        Intent intentService = new Intent(context, AlarmService.class);
        intentService.putExtra("ALARM_ID", intent.getIntExtra("ALARM_ID", -1));
        intentService.putExtra("TITLE", intent.getStringExtra("TITLE"));
        intentService.putExtra("RECURRING", intent.getBooleanExtra("RECURRING", false));
        intentService.putExtra("MONDAY", intent.getBooleanExtra("MONDAY", false));
        intentService.putExtra("TUESDAY", intent.getBooleanExtra("TUESDAY", false));
        intentService.putExtra("WEDNESDAY", intent.getBooleanExtra("WEDNESDAY", false));
        intentService.putExtra("THURSDAY", intent.getBooleanExtra("THURSDAY", false));
        intentService.putExtra("FRIDAY", intent.getBooleanExtra("FRIDAY", false));
        intentService.putExtra("SATURDAY", intent.getBooleanExtra("SATURDAY", false));
        intentService.putExtra("SUNDAY", intent.getBooleanExtra("SUNDAY", false));

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intentService);
        } else {
            context.startService(intentService);
        }
    }

    private void scheduleNextDailyAlarm(Context context) {
        android.content.SharedPreferences prefs = context.getSharedPreferences("NoozePrefs", Context.MODE_PRIVATE);
        int hour = prefs.getInt("dailyWakeHour", -1);
        int minute = prefs.getInt("dailyWakeMinute", -1);
        if (hour < 0 || minute < 0) {
            Log.d(TAG, "No persisted daily time; skip auto-queue");
            return;
        }

        java.util.Calendar cal = java.util.Calendar.getInstance();
        cal.set(java.util.Calendar.HOUR_OF_DAY, hour);
        cal.set(java.util.Calendar.MINUTE, minute);
        cal.set(java.util.Calendar.SECOND, 0);
        cal.set(java.util.Calendar.MILLISECOND, 0);
        // Always move to next day because we are executing at today's trigger time
        cal.add(java.util.Calendar.DAY_OF_YEAR, 1);
        long triggerTime = cal.getTimeInMillis();

        int alarmId = prefs.getInt("lastAlarmId", 1001);
        android.content.Intent nextIntent = new android.content.Intent(context, AlarmBroadcastReceiver.class);
        nextIntent.putExtra("ALARM_ID", alarmId);
        nextIntent.putExtra("TITLE", "Alarm " + alarmId);
        nextIntent.putExtra("RECURRING", false);

        int flags = android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE;
        android.app.PendingIntent pi = android.app.PendingIntent.getBroadcast(context, alarmId, nextIntent, flags);

        android.app.AlarmManager am = (android.app.AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            am.setAlarmClock(new android.app.AlarmManager.AlarmClockInfo(triggerTime, pi), pi);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            am.setExactAndAllowWhileIdle(android.app.AlarmManager.RTC_WAKEUP, triggerTime, pi);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            am.setAlarmClock(new android.app.AlarmManager.AlarmClockInfo(triggerTime, pi), pi);
        } else {
            am.setExact(android.app.AlarmManager.RTC_WAKEUP, triggerTime, pi);
        }

        prefs.edit().putLong("lastTriggerTime", triggerTime).apply();
        Log.d(TAG, "Auto-queued next daily alarm for: " + new java.util.Date(triggerTime));
    }
} 
package com.nooze;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import java.util.Calendar;

public class RescheduleAlarmsService extends Service {
    private static final String TAG = "RescheduleAlarmsService";
    private static final String CHANNEL_ID = "RescheduleChannel";
    private static final int NOTIFICATION_ID = 2;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "RescheduleAlarmsService created");
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "RescheduleAlarmsService started");
        
        // Create notification for foreground service
        Notification notification = createNotification();
        startForeground(NOTIFICATION_ID, notification);
        
        // Reschedule alarms
        rescheduleAlarms();
        
        // Stop service after rescheduling
        stopForeground(true);
        stopSelf();
        
        return START_NOT_STICKY;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Reschedule Alarms",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Channel for rescheduling alarms");
            
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
        }
    }

    private Notification createNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Rescheduling Alarms")
            .setContentText("Restoring your alarms after device restart")
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }

    private void rescheduleAlarms() {
        try {
            SharedPreferences prefs = getSharedPreferences("NoozePrefs", Context.MODE_PRIVATE);
            int hour = prefs.getInt("dailyWakeHour", -1);
            int minute = prefs.getInt("dailyWakeMinute", -1);
            if (hour >= 0 && minute >= 0) {
                long triggerTime = computeNextTrigger(hour, minute);
                Log.d(TAG, "Rescheduling single daily alarm at " + hour + ":" + minute + " -> " + triggerTime);
                // Reuse AlarmModule’s scheduling logic via AlarmManager directly
                android.app.AlarmManager alarmManager = (android.app.AlarmManager) getSystemService(Context.ALARM_SERVICE);
                android.content.Intent intent = new android.content.Intent(this, AlarmBroadcastReceiver.class);
                int alarmId = prefs.getInt("lastAlarmId", 1001);
                android.app.PendingIntent pendingIntent = android.app.PendingIntent.getBroadcast(this, alarmId, intent, android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    alarmManager.setAlarmClock(new android.app.AlarmManager.AlarmClockInfo(triggerTime, pendingIntent), pendingIntent);
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(android.app.AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent);
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    alarmManager.setAlarmClock(new android.app.AlarmManager.AlarmClockInfo(triggerTime, pendingIntent), pendingIntent);
                } else {
                    alarmManager.setExact(android.app.AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent);
                }
            } else {
                Log.d(TAG, "No persisted daily time; nothing to reschedule");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error rescheduling alarms: " + e.getMessage());
        }
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

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "RescheduleAlarmsService destroyed");
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
} 
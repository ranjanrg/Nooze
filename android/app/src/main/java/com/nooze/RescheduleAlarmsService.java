package com.nooze;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import java.util.List;

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
            // Get repository and reschedule all started alarms
            AlarmRepository repository = new AlarmRepository(getApplication());
            List<Alarm> startedAlarms = repository.getStartedAlarms();
            
            Log.d(TAG, "Found " + startedAlarms.size() + " alarms to reschedule");
            
            for (Alarm alarm : startedAlarms) {
                if (alarm.isStarted()) {
                    alarm.schedule(this);
                    Log.d(TAG, "Rescheduled alarm: " + alarm.getTitle());
                }
            }
            
            Log.d(TAG, "Successfully rescheduled " + startedAlarms.size() + " alarms");
            
        } catch (Exception e) {
            Log.e(TAG, "Error rescheduling alarms: " + e.getMessage());
        }
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
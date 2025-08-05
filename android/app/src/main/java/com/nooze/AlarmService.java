package com.nooze;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.IBinder;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;
import androidx.core.app.NotificationCompat;

public class AlarmService extends Service {
    private static final String TAG = "AlarmService";
    private static final String CHANNEL_ID = "AlarmChannel";
    private static final int NOTIFICATION_ID = 1;
    
    private MediaPlayer mediaPlayer;
    private Vibrator vibrator;
    private boolean isVibrating = false;
    private AudioManager audioManager;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "AlarmService created");
        
        // Initialize audio manager
        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        
        // Initialize media player with proper audio attributes
        mediaPlayer = MediaPlayer.create(this, android.provider.Settings.System.DEFAULT_ALARM_ALERT_URI);
        if (mediaPlayer != null) {
            mediaPlayer.setLooping(true);
            
            // Set audio attributes for alarm
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();
                mediaPlayer.setAudioAttributes(audioAttributes);
            }
            
            // Set volume to maximum
            mediaPlayer.setVolume(1.0f, 1.0f);
        }
        
        // Initialize vibrator
        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "AlarmService started");
        
        String title = intent.getStringExtra("TITLE");
        if (title == null || title.isEmpty()) {
            title = "Alarm";
        }
        
        // Create notification
        Notification notification = createNotification(title);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
        
        // Start alarm sound and vibration
        startAlarm();
        
        // Automatically launch RingActivity
        Intent ringIntent = new Intent(this, RingActivity.class);
        ringIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NO_USER_ACTION);
        ringIntent.putExtra("TITLE", title);
        Log.d(TAG, "Attempting to launch RingActivity with title: " + title);
        startActivity(ringIntent);
        Log.d(TAG, "RingActivity launch intent sent");
        
        return START_NOT_STICKY;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Alarm Notifications",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Channel for alarm notifications");
            
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
        }
    }

    private Notification createNotification(String title) {
        Intent intent = new Intent(this, RingActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText("Tap to dismiss or snooze")
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build();
    }

    private void startAlarm() {
        Log.d(TAG, "startAlarm called");
        
        // Request audio focus for alarm
        if (audioManager != null) {
            int result = audioManager.requestAudioFocus(
                new AudioManager.OnAudioFocusChangeListener() {
                    @Override
                    public void onAudioFocusChange(int focusChange) {
                        // Handle audio focus changes if needed
                    }
                },
                AudioManager.STREAM_ALARM,
                AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
            );
            Log.d(TAG, "Audio focus request result: " + result);
        }
        
        // Start media player
        if (mediaPlayer != null && !mediaPlayer.isPlaying()) {
            mediaPlayer.start();
            Log.d(TAG, "Media player started");
        } else {
            Log.d(TAG, "Media player is null or already playing");
        }
        
        // Start vibration
        startVibration();
        Log.d(TAG, "Alarm started - sound and vibration");
    }

    private void startVibration() {
        Log.d(TAG, "startVibration called, vibrator: " + (vibrator != null) + ", isVibrating: " + isVibrating);
        if (vibrator != null && !isVibrating) {
            isVibrating = true;
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createWaveform(
                    new long[]{0, 100, 100, 1000}, // Pattern: wait, vibrate, wait, pause
                    0 // Repeat indefinitely
                ));
                Log.d(TAG, "Vibration started (Android O+)");
            } else {
                vibrator.vibrate(new long[]{0, 100, 100, 1000}, 0);
                Log.d(TAG, "Vibration started (Legacy Android)");
            }
        } else {
            Log.d(TAG, "Vibration not started - vibrator null or already vibrating");
        }
    }

    private void stopAlarm() {
        // Stop media player
        if (mediaPlayer != null && mediaPlayer.isPlaying()) {
            mediaPlayer.stop();
            mediaPlayer.release();
            mediaPlayer = null;
        }
        
        // Stop vibration
        if (vibrator != null && isVibrating) {
            vibrator.cancel();
            isVibrating = false;
        }
        
        // Stop service
        stopForeground(true);
        stopSelf();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "AlarmService destroyed");
        stopAlarm();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    // Public method to stop alarm from RingActivity
    public static void stopAlarm(Context context) {
        Intent intent = new Intent(context, AlarmService.class);
        context.stopService(intent);
    }
} 
package com.nooze;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
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
    private android.os.Handler reassertHandler;
    private android.os.Handler vibrationHandler;
    private int vibrationPhase = 0; // 0: none, 1: 0-30s, 2: 30-60s, 3: 60s+
    private final Runnable reassertRunnable = new Runnable() {
        @Override
        public void run() {
            try {
                SharedPreferences prefs = getSharedPreferences("NoozePrefs", Context.MODE_PRIVATE);
                boolean visible = prefs.getBoolean("ringActivityVisible", false);
                if (!visible) {
                    // Re-post full screen notification to bring RingActivity to front
                    Notification notification = createNotification("Alarm");
                    NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                    nm.notify(NOTIFICATION_ID, notification);
                    Log.d(TAG, "Reasserted full-screen notification (RingActivity not visible)");
                }
            } catch (Exception e) {
                Log.w(TAG, "Reassert failed: " + e.getMessage());
            } finally {
                // Schedule next check in ~12 seconds
                if (reassertHandler != null) {
                    reassertHandler.postDelayed(this, 12000);
                }
            }
        }
    };

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
            // Align with manifest: mediaPlayback
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
        
        // Start alarm sound and vibration
        startAlarm();
        
        // Post full-screen notification which launches RingActivity over lock
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        notificationManager.notify(NOTIFICATION_ID, notification);

        // Start periodic reassert while service is active
        reassertHandler = new android.os.Handler(getMainLooper());
        reassertHandler.postDelayed(reassertRunnable, 12000);
        
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
            // Full-screen intent to launch RingActivity even when device is locked (Android 10+)
            .setFullScreenIntent(pendingIntent, true)
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

            // Initialize handler and escalate phases over time
            if (vibrationHandler == null) {
                vibrationHandler = new android.os.Handler(getMainLooper());
            }
            applyVibrationPhase(1);
            // Escalate after 30s and 60s
            vibrationHandler.postDelayed(new Runnable() { @Override public void run() { applyVibrationPhase(2); } }, 30_000);
            vibrationHandler.postDelayed(new Runnable() { @Override public void run() { applyVibrationPhase(3); } }, 60_000);
        } else {
            Log.d(TAG, "Vibration not started - vibrator null or already vibrating");
        }
    }

    private void applyVibrationPhase(int phase) {
        if (vibrator == null || !isVibrating) return;
        if (phase < 1) phase = 1;
        if (phase > 3) phase = 3;
        vibrationPhase = phase;

        long[] timings;
        int[] amplitudes = null;
        switch (phase) {
            case 1: // moderate pulses
                timings = new long[]{ 0, 200, 150, 200, 150, 260, 800 };
                amplitudes = new int[]{ 0, 150, 0, 150, 0, 180, 0 };
                break;
            case 2: // stronger, shorter gaps
                timings = new long[]{ 0, 280, 120, 280, 120, 320, 600 };
                amplitudes = new int[]{ 0, 200, 0, 200, 0, 230, 0 };
                break;
            default: // phase 3 max intensity
                timings = new long[]{ 0, 360, 100, 360, 100, 420, 500 };
                amplitudes = new int[]{ 0, 255, 0, 255, 0, 255, 0 };
                break;
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (vibrator.hasAmplitudeControl() && amplitudes != null) {
                    vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, 0));
                } else {
                    vibrator.vibrate(VibrationEffect.createWaveform(timings, 0));
                }
            } else {
                vibrator.vibrate(timings, 0);
            }
            Log.d(TAG, "Applied vibration phase: " + phase);
        } catch (Exception e) {
            Log.w(TAG, "Failed to apply vibration phase " + phase + ": " + e.getMessage());
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
        if (vibrationHandler != null) {
            vibrationHandler.removeCallbacksAndMessages(null);
            vibrationHandler = null;
        }
        
        // Stop service
        stopForeground(true);
        stopSelf();

        // Stop reassert loop
        if (reassertHandler != null) {
            reassertHandler.removeCallbacksAndMessages(null);
            reassertHandler = null;
        }
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
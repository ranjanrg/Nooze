package com.nooze;

import android.app.Service;
import android.content.Intent;
import android.media.MediaPlayer;
import android.os.IBinder;
import android.util.Log;

public class AlarmSoundService extends Service {
    private static final String TAG = "AlarmSoundService";
    private MediaPlayer mediaPlayer;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "AlarmSoundService created");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "AlarmSoundService started");
        
        // Check if this is a restart after being killed
        if (startId > 1) {
            Log.d(TAG, "Service restarted, resuming alarm sound");
        }
        
        playAlarmSound();
        return START_STICKY; // Restart service if it gets killed
    }

    private void playAlarmSound() {
        try {
            if (mediaPlayer != null) {
                mediaPlayer.release();
            }
            
            // Create MediaPlayer and set up alarm sound
            mediaPlayer = MediaPlayer.create(this, R.raw.alarm_sound);
            if (mediaPlayer != null) {
                mediaPlayer.setLooping(true); // Loop the sound
                mediaPlayer.setVolume(1.0f, 1.0f); // Full volume
                
                // Set up completion listener to restart if interrupted
                mediaPlayer.setOnCompletionListener(mp -> {
                    Log.d(TAG, "Alarm sound completed, restarting...");
                    // Restart the sound if it completes unexpectedly
                    if (isAlarmActive()) {
                        playAlarmSound();
                    }
                });
                
                // Set up error listener
                mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                    Log.e(TAG, "MediaPlayer error: " + what + ", " + extra);
                    // Try to recover by restarting
                    if (isAlarmActive()) {
                        playAlarmSound();
                    }
                    return true; // Error handled
                });
                
                mediaPlayer.start();
                Log.d(TAG, "Alarm sound started");
            } else {
                Log.e(TAG, "Failed to create MediaPlayer");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error playing alarm sound: " + e.getMessage());
            // Try to recover after a short delay
            android.os.Handler handler = new android.os.Handler();
            handler.postDelayed(() -> {
                if (isAlarmActive()) {
                    playAlarmSound();
                }
            }, 1000);
        }
    }
    
    private boolean isAlarmActive() {
        return getSharedPreferences("NoozePrefs", MODE_PRIVATE)
            .getBoolean("isAlarmActive", false);
    }

    public void stopAlarmSound() {
        try {
            if (mediaPlayer != null) {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.release();
                mediaPlayer = null;
                Log.d(TAG, "Alarm sound stopped");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error stopping alarm sound: " + e.getMessage());
        }
    }
    
    public void ensureAlarmSoundPlaying() {
        try {
            if (mediaPlayer == null || !mediaPlayer.isPlaying()) {
                Log.d(TAG, "Alarm sound not playing, restarting...");
                playAlarmSound();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error ensuring alarm sound: " + e.getMessage());
        }
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "AlarmSoundService destroyed");
        stopAlarmSound();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
} 
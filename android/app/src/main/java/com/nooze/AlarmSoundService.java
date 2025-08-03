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
            Log.d(TAG, "Service restarted, checking if alarm is still active");
            // Only resume if alarm is still active
            if (!isAlarmActive()) {
                Log.d(TAG, "Alarm no longer active, stopping service");
                stopSelf();
                return START_NOT_STICKY;
            }
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
                    Log.d(TAG, "Alarm sound completed, checking if should restart...");
                    // Only restart the sound if alarm is still active
                    if (isAlarmActive()) {
                        Log.d(TAG, "Alarm still active, restarting sound...");
                        playAlarmSound();
                    } else {
                        Log.d(TAG, "Alarm no longer active, stopping service");
                        stopSelf();
                    }
                });
                
                // Set up error listener
                mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                    Log.e(TAG, "MediaPlayer error: " + what + ", " + extra);
                    // Only try to recover if alarm is still active
                    if (isAlarmActive()) {
                        Log.d(TAG, "Alarm still active, trying to recover...");
                        playAlarmSound();
                    } else {
                        Log.d(TAG, "Alarm no longer active, stopping service");
                        stopSelf();
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
            // Try to recover after a short delay only if alarm is still active
            android.os.Handler handler = new android.os.Handler();
            handler.postDelayed(() -> {
                if (isAlarmActive()) {
                    Log.d(TAG, "Alarm still active, retrying after error...");
                    playAlarmSound();
                } else {
                    Log.d(TAG, "Alarm no longer active, stopping service after error");
                    stopSelf();
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
            // Stop the service completely when sound is stopped
            Log.d(TAG, "Stopping service after sound stop");
            stopSelf();
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
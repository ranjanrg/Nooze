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
                mediaPlayer.start();
                Log.d(TAG, "Alarm sound started");
            } else {
                Log.e(TAG, "Failed to create MediaPlayer");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error playing alarm sound: " + e.getMessage());
        }
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
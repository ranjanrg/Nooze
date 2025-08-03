package com.nooze;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.media.MediaPlayer;
import android.os.Bundle;
import android.os.PowerManager;
import android.util.Log;

public class AlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "AlarmReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "Alarm received! Action: " + intent.getAction());
        
        // Acquire wake lock to ensure device stays awake
        PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wakeLock = powerManager.newWakeLock(
            PowerManager.FULL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE,
            "Nooze:AlarmWakeLock"
        );
        wakeLock.acquire(10000); // 10 seconds
        
        // Get alarm ID from intent
        int alarmId = intent.getIntExtra("alarmId", -1);
        Log.d(TAG, "Alarm ID: " + alarmId);
        
        // Start alarm sound service
        Intent soundIntent = new Intent(context, AlarmSoundService.class);
        context.startService(soundIntent);
        
        // Start floating math widget (appears on home screen)
        Intent widgetIntent = new Intent(context, FloatingMathWidget.class);
        widgetIntent.putExtra("alarmId", alarmId);
        context.startService(widgetIntent);
        
        // Create intent to launch AlarmActivity
        Intent alarmIntent = new Intent(context, AlarmActivity.class);
        alarmIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        alarmIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        alarmIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        alarmIntent.putExtra("alarmId", alarmId);
        
        Log.d(TAG, "Launching AlarmActivity and FloatingMathWidget...");
        
        // Launch the alarm activity
        context.startActivity(alarmIntent);
        
        Log.d(TAG, "AlarmActivity launch intent sent");
        
        // Release wake lock after a delay
        wakeLock.release();
    }
} 
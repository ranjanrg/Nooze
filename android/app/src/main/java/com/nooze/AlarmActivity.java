package com.nooze;

import android.app.Activity;
import android.os.Bundle;
import android.view.WindowManager;
import android.content.Intent;
import android.view.KeyEvent;
import android.app.KeyguardManager;
import android.content.Context;
import android.view.View;
import android.view.Window;
import android.view.MotionEvent;
import android.util.Log;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

public class AlarmActivity extends ReactActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Set window flags to show over lock screen and make unescapable
        getWindow().addFlags(
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
            WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON |
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN |
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS |
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        );
        
        // Hide system UI completely and prevent gesture navigation
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN |
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
            View.SYSTEM_UI_FLAG_LOW_PROFILE |
            View.SYSTEM_UI_FLAG_IMMERSIVE
        );
        
        // Set window to be completely fullscreen
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        );
        
        // Disable keyguard if possible
        KeyguardManager keyguardManager = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
        if (keyguardManager.isKeyguardLocked()) {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD);
        }
        
        // Set a global flag that React Native can detect
        Intent intent = getIntent();
        if (intent != null) {
            intent.putExtra("isAlarmLaunch", true);
            // Also set a shared preference flag
            getSharedPreferences("NoozePrefs", MODE_PRIVATE)
                .edit()
                .putBoolean("isAlarmActive", true)
                .apply();
        }
    }

    @Override
    protected String getMainComponentName() {
        return "Nooze";
    }

    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new DefaultReactActivityDelegate(
            this,
            getMainComponentName(),
            DefaultNewArchitectureEntryPoint.getFabricEnabled()
        );
    }

    // Allow back button (user-friendly approach)
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        // Allow navigation keys - user can exit
        return super.onKeyDown(keyCode, event);
    }

    // Allow back button (user-friendly approach)
    @Override
    public void onBackPressed() {
        // Allow back button - user can exit
        super.onBackPressed();
    }

    // Allow user to leave the activity (user-friendly approach)
    @Override
    public void onUserLeaveHint() {
        // Check if alarm is still active before starting floating widget
        boolean isAlarmActive = getSharedPreferences("NoozePrefs", MODE_PRIVATE)
            .getBoolean("isAlarmActive", false);
        
        if (isAlarmActive) {
            // User is trying to leave without solving - start floating widget
            Log.d("AlarmActivity", "User leaving activity without solving - starting floating widget");
            
            // Start floating math widget
            Intent widgetIntent = new Intent(this, FloatingMathWidget.class);
            widgetIntent.putExtra("alarmId", getIntent().getIntExtra("alarmId", -1));
            startService(widgetIntent);
        } else {
            Log.d("AlarmActivity", "User leaving activity after solving - no floating widget needed");
        }
        
        super.onUserLeaveHint();
    }

    // Handle activity pause (user-friendly approach)
    @Override
    protected void onPause() {
        // Check if alarm is still active before restarting sound service
        boolean isAlarmActive = getSharedPreferences("NoozePrefs", MODE_PRIVATE)
            .getBoolean("isAlarmActive", false);
        
        if (isAlarmActive) {
            // Only restart sound service if alarm is still active
            Log.d("AlarmActivity", "Alarm still active - restarting sound service");
            Intent soundIntent = new Intent(this, AlarmSoundService.class);
            startService(soundIntent);
        } else {
            Log.d("AlarmActivity", "Alarm solved - not restarting sound service");
        }
        
        super.onPause();
    }

    // Allow touch events (user-friendly approach)
    @Override
    public boolean dispatchTouchEvent(MotionEvent ev) {
        // Allow all touch events - user can interact normally
        return super.dispatchTouchEvent(ev);
    }

    // Prevent activity from being finished by system
    @Override
    public void finish() {
        // Only allow finish if math problem is solved
        // This will be controlled from React Native
        super.finish();
    }

    // Override onWindowFocusChanged to maintain fullscreen
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            // Re-hide system UI when focus is regained
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_FULLSCREEN |
                View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                View.SYSTEM_UI_FLAG_LOW_PROFILE
            );
        }
    }
} 
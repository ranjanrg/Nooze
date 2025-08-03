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

    // Override back button to prevent escape
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        // Prevent ALL navigation keys
        if (keyCode == KeyEvent.KEYCODE_BACK || 
            keyCode == KeyEvent.KEYCODE_HOME || 
            keyCode == KeyEvent.KEYCODE_APP_SWITCH ||
            keyCode == KeyEvent.KEYCODE_MENU ||
            keyCode == KeyEvent.KEYCODE_TAB ||
            keyCode == KeyEvent.KEYCODE_ESCAPE) {
            return true; // Consume the event, don't let it propagate
        }
        return super.onKeyDown(keyCode, event);
    }

    // Override onBackPressed for newer Android versions
    @Override
    public void onBackPressed() {
        // Do nothing - prevent back button from closing the activity
    }

    // Prevent user from leaving the activity (blocks home gesture)
    @Override
    public void onUserLeaveHint() {
        // Do nothing - prevent user from leaving the activity
        // This should block home gesture and other system navigation
    }

    // Prevent activity from being paused (blocks home gesture)
    @Override
    protected void onPause() {
        // Don't call super.onPause() to prevent activity from being paused
        // This makes the activity stay in foreground even when home is pressed
        
        // Ensure alarm sound continues playing even when activity is paused
        Intent soundIntent = new Intent(this, AlarmSoundService.class);
        startService(soundIntent);
    }

    // Block gesture navigation by intercepting touch events
    @Override
    public boolean dispatchTouchEvent(MotionEvent ev) {
        // Block edge swipes that could trigger gesture navigation
        if (ev.getAction() == MotionEvent.ACTION_DOWN) {
            float x = ev.getX();
            float y = ev.getY();
            int screenWidth = getResources().getDisplayMetrics().widthPixels;
            int screenHeight = getResources().getDisplayMetrics().heightPixels;
            
            // Allow emergency stop area (bottom center) - exempt from blocking
            boolean isEmergencyStopArea = (x > screenWidth * 0.3 && x < screenWidth * 0.7 && y > screenHeight * 0.85);
            
            if (!isEmergencyStopArea) {
                // Block bottom edge swipes (home gesture) - VERY aggressive
                if (y > screenHeight * 0.6) {
                    return true; // Consume the event
                }
                
                // Block left/right edge swipes (back gesture) - more aggressive
                if (x < screenWidth * 0.2 || x > screenWidth * 0.8) {
                    return true; // Consume the event
                }
                
                // Block diagonal swipes (corner gestures)
                if ((x < screenWidth * 0.15 && y > screenHeight * 0.7) ||
                    (x > screenWidth * 0.85 && y > screenHeight * 0.7)) {
                    return true; // Consume the event
                }
            }
        }
        
        // Block long press gestures that might trigger system actions
        if (ev.getAction() == MotionEvent.ACTION_MOVE) {
            float x = ev.getX();
            float y = ev.getY();
            int screenWidth = getResources().getDisplayMetrics().widthPixels;
            int screenHeight = getResources().getDisplayMetrics().heightPixels;
            
            // Allow emergency stop area
            boolean isEmergencyStopArea = (x > screenWidth * 0.3 && x < screenWidth * 0.7 && y > screenHeight * 0.85);
            
            if (!isEmergencyStopArea) {
                // Block edge movements - VERY aggressive
                if (y > screenHeight * 0.6 || x < screenWidth * 0.2 || x > screenWidth * 0.8) {
                    return true; // Consume the event
                }
            }
        }
        
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
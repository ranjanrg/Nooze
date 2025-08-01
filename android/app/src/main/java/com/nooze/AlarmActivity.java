package com.nooze;

import android.app.Activity;
import android.os.Bundle;
import android.view.WindowManager;
import android.content.Intent;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

public class AlarmActivity extends ReactActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Set window flags to show over lock screen
        getWindow().addFlags(
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
            WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON
        );
        
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
} 
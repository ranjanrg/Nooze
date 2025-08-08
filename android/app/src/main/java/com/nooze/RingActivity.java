package com.nooze;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

public class RingActivity extends Activity {
    private static final String TAG = "RingActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d(TAG, "RingActivity onCreate called");
        setContentView(R.layout.activity_ring);
        // Ensure screen turns on and shows over lock for older APIs
        getWindow().addFlags(
            android.view.WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
            android.view.WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
            android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
        );

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O_MR1) {
            setTurnScreenOn(true);
            setShowWhenLocked(true);
        }
        
        // Set up UI
        setupUI();
        Log.d(TAG, "RingActivity setup complete");
    }

    private void setupUI() {
        TextView titleText = findViewById(R.id.alarm_title);
        Button dismissButton = findViewById(R.id.dismiss_button);
        
        // Always show "WAKE UP!" instead of alarm title
        titleText.setText("WAKE UP!");
        
        // Dismiss button - stops alarm and shows math problem
        dismissButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                dismissAlarm();
            }
        });
    }

    private void dismissAlarm() {
        Log.d(TAG, "dismissAlarm called - launching math problem");
        
        // Launch math problem activity
        Intent mathIntent = new Intent(this, MathProblemActivity.class);
        mathIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        startActivity(mathIntent);
        
        // Close this activity
        finish();
    }

    @Override
    public void onBackPressed() {
        // Prevent back button from dismissing alarm
        // User must explicitly choose dismiss to solve math problem
    }
} 
package com.nooze;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.content.SharedPreferences;
import org.json.JSONArray;
import java.text.SimpleDateFormat;
import java.util.Locale;

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

        // Fixed daily quote per your direction
        titleText.setText("This moment can change your life");

        // Dismiss button - long press to start (matches screenshot)
        dismissButton.setOnLongClickListener(new View.OnLongClickListener() {
            @Override
            public boolean onLongClick(View v) {
                dismissAlarm();
                return true;
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

    @Override
    protected void onResume() {
        super.onResume();
        try {
            SharedPreferences prefs = getSharedPreferences("NoozePrefs", Context.MODE_PRIVATE);
            prefs.edit().putBoolean("ringActivityVisible", true).apply();
            Log.d(TAG, "RingActivity visible=true");
        } catch (Exception ignored) {}
    }

    @Override
    protected void onPause() {
        super.onPause();
        try {
            SharedPreferences prefs = getSharedPreferences("NoozePrefs", Context.MODE_PRIVATE);
            prefs.edit().putBoolean("ringActivityVisible", false).apply();
            Log.d(TAG, "RingActivity visible=false");
        } catch (Exception ignored) {}
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        try {
            SharedPreferences prefs = getSharedPreferences("NoozePrefs", Context.MODE_PRIVATE);
            prefs.edit().putBoolean("ringActivityVisible", false).apply();
        } catch (Exception ignored) {}
    }

    // Build a shuffled bag of indices 0..n-1 (Fisher–Yates)
    private JSONArray buildShuffledBag(int n) {
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = i;
        java.util.Random rnd = new java.util.Random(System.currentTimeMillis());
        for (int i = n - 1; i > 0; i--) {
            int j = rnd.nextInt(i + 1);
            int tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }
        JSONArray bag = new JSONArray();
        for (int v : arr) bag.put(v);
        return bag;
    }
} 
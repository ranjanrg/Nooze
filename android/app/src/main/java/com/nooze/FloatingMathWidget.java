package com.nooze;

import android.app.Service;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.IBinder;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.util.Log;
import android.view.WindowManager.LayoutParams;

public class FloatingMathWidget extends Service {
    private static final String TAG = "FloatingMathWidget";
    private WindowManager windowManager;
    private View floatingView;
    private WindowManager.LayoutParams params;
    private int alarmId;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "FloatingMathWidget created");
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "FloatingMathWidget started");
        
        if (intent != null) {
            alarmId = intent.getIntExtra("alarmId", -1);
        }
        
        showFloatingWidget();
        return START_STICKY;
    }

    private void showFloatingWidget() {
        // Create floating widget view
        floatingView = LayoutInflater.from(this).inflate(R.layout.floating_math_widget, null);
        
        // Set up window parameters for floating widget
        params = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN |
            WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
            PixelFormat.TRANSLUCENT
        );
        
        params.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
        
        // Adaptive positioning based on screen size
        android.util.DisplayMetrics displayMetrics = new android.util.DisplayMetrics();
        windowManager.getDefaultDisplay().getMetrics(displayMetrics);
        int screenHeight = displayMetrics.heightPixels;
        
        // Adaptive positioning based on screen size
        // For small screens, position higher; for large screens, position lower
        int minY = 80;
        int maxY = (int)(screenHeight * 0.25);
        int targetY = (int)(screenHeight * 0.15);
        
        // Ensure widget is visible and not too close to top
        params.y = Math.max(minY, Math.min(targetY, maxY));
        
        // Generate math problem
        generateMathProblem();
        
        // Set up submit button
        Button submitButton = floatingView.findViewById(R.id.widgetSubmitButton);
        EditText answerInput = floatingView.findViewById(R.id.widgetAnswerInput);
        
        // Ensure keyboard appears when input is focused
        answerInput.setOnFocusChangeListener((v, hasFocus) -> {
            if (hasFocus) {
                // Show keyboard
                android.view.inputmethod.InputMethodManager imm = 
                    (android.view.inputmethod.InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
                imm.showSoftInput(answerInput, android.view.inputmethod.InputMethodManager.SHOW_IMPLICIT);
            }
        });
        
        submitButton.setOnClickListener(v -> {
            checkAnswer(answerInput.getText().toString());
        });
        
        // Set up close button (opens app)
        Button openAppButton = floatingView.findViewById(R.id.openAppButton);
        openAppButton.setOnClickListener(v -> {
            // Open the alarm activity (math problem screen) instead of main activity
            Intent alarmIntent = new Intent(this, AlarmActivity.class);
            alarmIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            alarmIntent.putExtra("isAlarmLaunch", true);
            alarmIntent.putExtra("alarmId", alarmId);
            startActivity(alarmIntent);
            
            // Hide the floating widget
            hideFloatingWidget();
        });
        
        // Auto-focus the input field when widget is shown
        answerInput.requestFocus();
        
        try {
            windowManager.addView(floatingView, params);
            Log.d(TAG, "Floating math widget displayed");
        } catch (Exception e) {
            Log.e(TAG, "Error displaying floating widget: " + e.getMessage());
        }
    }

    private void generateMathProblem() {
        int num1 = (int) (Math.random() * 90) + 10; // 10-99
        int num2 = (int) (Math.random() * 90) + 10; // 10-99
        String[] operators = {"+", "-", "*"};
        String operator = operators[(int) (Math.random() * operators.length)];
        
        int answer;
        switch (operator) {
            case "+":
                answer = num1 + num2;
                break;
            case "-":
                answer = num1 - num2;
                break;
            case "*":
                answer = num1 * num2;
                break;
            default:
                answer = num1 + num2;
        }
        
        // Store answer in shared preferences
        getSharedPreferences("NoozePrefs", MODE_PRIVATE)
            .edit()
            .putInt("currentAnswer", answer)
            .apply();
        
        // Update UI
        TextView mathProblemText = floatingView.findViewById(R.id.widgetMathProblem);
        mathProblemText.setText(num1 + " " + operator + " " + num2 + " = ?");
        
        Log.d(TAG, "Math problem generated: " + num1 + " " + operator + " " + num2 + " = " + answer);
    }

    private void checkAnswer(String userAnswer) {
        try {
            int userAnswerNum = Integer.parseInt(userAnswer);
            int correctAnswer = getSharedPreferences("NoozePrefs", MODE_PRIVATE)
                .getInt("currentAnswer", 0);
            
            if (userAnswerNum == correctAnswer) {
                // Correct answer - stop alarm and dismiss widget
                Log.d(TAG, "Correct answer! Stopping alarm and dismissing widget");
                
                // Stop alarm sound
                Intent soundIntent = new Intent(this, AlarmSoundService.class);
                stopService(soundIntent);
                
                // Clear alarm state
                getSharedPreferences("NoozePrefs", MODE_PRIVATE)
                    .edit()
                    .putBoolean("isAlarmActive", false)
                    .apply();
                
                // Hide floating widget
                hideFloatingWidget();
                
                // Stop this service
                stopSelf();
                
            } else {
                // Wrong answer - generate new problem
                Log.d(TAG, "Wrong answer! Generating new problem");
                EditText answerInput = floatingView.findViewById(R.id.widgetAnswerInput);
                answerInput.setText("");
                generateMathProblem();
            }
        } catch (NumberFormatException e) {
            Log.e(TAG, "Invalid answer format");
        }
    }

    private void hideFloatingWidget() {
        if (floatingView != null && windowManager != null) {
            try {
                // Check if view is still attached before trying to remove it
                if (floatingView.getParent() != null) {
                    windowManager.removeView(floatingView);
                    Log.d(TAG, "Floating widget hidden");
                } else {
                    Log.d(TAG, "Floating widget already detached - skipping hide");
                }
            } catch (Exception e) {
                Log.e(TAG, "Error hiding floating widget: " + e.getMessage());
            }
        }
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "FloatingMathWidget destroyed");
        hideFloatingWidget();
        super.onDestroy();
    }



    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
} 
package com.nooze;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableMap;

public class AlarmModule extends ReactContextBaseJavaModule {
    private static final String TAG = "AlarmModule";
    private final ReactApplicationContext reactContext;
    private final AlarmManager alarmManager;

    public AlarmModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.alarmManager = (AlarmManager) reactContext.getSystemService(Context.ALARM_SERVICE);
        Log.d(TAG, "AlarmModule constructor called - Module initialized!");
    }

    @Override
    public String getName() {
        return "AlarmModule";
    }

    @ReactMethod
    public void testConnection(Promise promise) {
        Log.d(TAG, "testConnection called from React Native!");
        promise.resolve("AlarmModule is working!");
    }

    @ReactMethod
    public void checkIfAlarmLaunch(Promise promise) {
        try {
            Intent intent = getCurrentActivity().getIntent();
            boolean isAlarmLaunch = intent != null && intent.getBooleanExtra("isAlarmLaunch", false);
            
            // Also check shared preferences
            boolean isAlarmActive = reactContext.getSharedPreferences("NoozePrefs", Context.MODE_PRIVATE)
                .getBoolean("isAlarmActive", false);
            
            boolean shouldShowAlarm = isAlarmLaunch || isAlarmActive;
            Log.d(TAG, "checkIfAlarmLaunch: intent=" + isAlarmLaunch + ", sharedPref=" + isAlarmActive + ", result=" + shouldShowAlarm);
            
            // Clear the shared preference flag if it was set
            if (isAlarmActive) {
                reactContext.getSharedPreferences("NoozePrefs", Context.MODE_PRIVATE)
                    .edit()
                    .putBoolean("isAlarmActive", false)
                    .apply();
            }
            
            promise.resolve(shouldShowAlarm);
        } catch (Exception e) {
            Log.e(TAG, "Error checking alarm launch: " + e.getMessage());
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void checkDisplayOverAppsPermission(Promise promise) {
        try {
            boolean hasPermission = false;
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                hasPermission = android.provider.Settings.canDrawOverlays(reactContext);
            } else {
                hasPermission = true; // For older versions, assume permission is granted
            }
            Log.d(TAG, "checkDisplayOverAppsPermission: " + hasPermission);
            promise.resolve(hasPermission);
        } catch (Exception e) {
            Log.e(TAG, "Error checking display over apps permission: " + e.getMessage());
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void stopAlarmSound(Promise promise) {
        try {
            Intent intent = new Intent(reactContext, AlarmSoundService.class);
            reactContext.stopService(intent);
            Log.d(TAG, "Alarm sound stop requested");
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error stopping alarm sound: " + e.getMessage());
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void scheduleAlarm(ReadableMap alarmData, Promise promise) {
        Log.d(TAG, "scheduleAlarm called with data: " + alarmData.toString());
        try {
            long triggerTime = (long) alarmData.getDouble("triggerTime");
            int alarmId = alarmData.getInt("alarmId");
            Log.d(TAG, "Parsed triggerTime: " + triggerTime + ", alarmId: " + alarmId);
            
            Intent intent = new Intent(reactContext, AlarmReceiver.class);
            intent.setAction("com.nooze.ALARM_TRIGGER");
            intent.putExtra("alarmId", alarmId);
            
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                reactContext,
                alarmId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_ONE_SHOT
            );
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                // Use setAlarmClock for more reliable timing (Android 5.0+)
                alarmManager.setAlarmClock(
                    new AlarmManager.AlarmClockInfo(triggerTime, pendingIntent),
                    pendingIntent
                );
            } else {
                // Fallback for older Android versions
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    triggerTime,
                    pendingIntent
                );
            }
            
            Log.d(TAG, "Alarm scheduled for: " + triggerTime);
            promise.resolve(true);
            
        } catch (Exception e) {
            Log.e(TAG, "Error scheduling alarm: " + e.getMessage());
            promise.reject("ALARM_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void cancelAlarm(int alarmId, Promise promise) {
        try {
            Intent intent = new Intent(reactContext, AlarmReceiver.class);
            intent.setAction("com.nooze.ALARM_TRIGGER");
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                reactContext,
                alarmId,
                intent,
                PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
            );
            
            if (pendingIntent != null) {
                alarmManager.cancel(pendingIntent);
                pendingIntent.cancel();
                Log.d(TAG, "Alarm cancelled: " + alarmId);
            }
            
            promise.resolve(true);
            
        } catch (Exception e) {
            Log.e(TAG, "Error cancelling alarm: " + e.getMessage());
            promise.reject("ALARM_ERROR", e.getMessage());
        }
    }
} 
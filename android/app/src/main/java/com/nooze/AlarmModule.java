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
            
            // Check shared preferences - this is the authoritative source
            boolean isAlarmActive = reactContext.getSharedPreferences("NoozePrefs", Context.MODE_PRIVATE)
                .getBoolean("isAlarmActive", false);
            
            // Only show alarm if BOTH intent flag is set AND shared preference is true
            // This prevents false positives after solving
            boolean shouldShowAlarm = isAlarmLaunch && isAlarmActive;
            Log.d(TAG, "checkIfAlarmLaunch: intent=" + isAlarmLaunch + ", sharedPref=" + isAlarmActive + ", result=" + shouldShowAlarm);
            
            // ALWAYS clear the intent flag to prevent future false positives
            // This ensures the intent flag doesn't persist across app state changes
            if (intent != null) {
                intent.removeExtra("isAlarmLaunch");
                Log.d(TAG, "Intent flag cleared to prevent future false positives");
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
            Intent intent = new Intent(reactContext, AlarmService.class);
            reactContext.stopService(intent);
            Log.d(TAG, "Alarm sound stop requested");
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error stopping alarm sound: " + e.getMessage());
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void clearAlarmActiveFlag(Promise promise) {
        try {
            reactContext.getSharedPreferences("NoozePrefs", Context.MODE_PRIVATE)
                .edit()
                .putBoolean("isAlarmActive", false)
                .apply();
            Log.d(TAG, "Alarm active flag cleared from shared preferences");
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error clearing alarm active flag: " + e.getMessage());
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void isAlarmStillActive(Promise promise) {
        try {
            boolean isActive = reactContext.getSharedPreferences("NoozePrefs", Context.MODE_PRIVATE)
                .getBoolean("isAlarmActive", false);
            Log.d(TAG, "isAlarmStillActive: " + isActive);
            promise.resolve(isActive);
        } catch (Exception e) {
            Log.e(TAG, "Error checking if alarm is still active: " + e.getMessage());
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void saveAlarmsForBoot(String alarmsJson, Promise promise) {
        try {
            reactContext.getSharedPreferences("NoozePrefs", Context.MODE_PRIVATE)
                .edit()
                .putString("savedAlarms", alarmsJson)
                .apply();
            Log.d(TAG, "Alarms saved for boot restoration: " + alarmsJson);
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error saving alarms for boot: " + e.getMessage());
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
            
            Intent intent = new Intent(reactContext, AlarmBroadcastReceiver.class);
            intent.putExtra("ALARM_ID", alarmId);
            intent.putExtra("TITLE", "Alarm " + alarmId);
            intent.putExtra("RECURRING", false);
            intent.putExtra("MONDAY", false);
            intent.putExtra("TUESDAY", false);
            intent.putExtra("WEDNESDAY", false);
            intent.putExtra("THURSDAY", false);
            intent.putExtra("FRIDAY", false);
            intent.putExtra("SATURDAY", false);
            intent.putExtra("SUNDAY", false);
            
            // Use appropriate PendingIntent flags based on alarm type
            int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
            
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                reactContext,
                alarmId,
                intent,
                flags
            );
            
            // Choose the best alarm scheduling method based on Android version and requirements
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                // Android 6.0+ (API 23+): Use setExactAndAllowWhileIdle for better Doze compatibility
                // This is the recommended approach for critical alarms that need to fire even in Doze mode
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerTime,
                    pendingIntent
                );
                Log.d(TAG, "Scheduled alarm using setExactAndAllowWhileIdle (Android 6.0+)");
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                // Android 5.0+ (API 21+): Use setAlarmClock for critical wake-up alarms
                // This provides the most reliable timing but uses more resources
                alarmManager.setAlarmClock(
                    new AlarmManager.AlarmClockInfo(triggerTime, pendingIntent),
                    pendingIntent
                );
                Log.d(TAG, "Scheduled alarm using setAlarmClock (Android 5.0+)");
            } else {
                // Fallback for older Android versions
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    triggerTime,
                    pendingIntent
                );
                Log.d(TAG, "Scheduled alarm using setExact (Legacy Android)");
            }
            
            Log.d(TAG, "Alarm scheduled for: " + triggerTime + " (ID: " + alarmId + ")");
            promise.resolve(true);
            
        } catch (Exception e) {
            Log.e(TAG, "Error scheduling alarm: " + e.getMessage());
            promise.reject("ALARM_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void cancelAlarm(int alarmId, Promise promise) {
        try {
            Intent intent = new Intent(reactContext, AlarmBroadcastReceiver.class);
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
            } else {
                Log.d(TAG, "No pending intent found for alarm: " + alarmId);
            }
            
            promise.resolve(true);
            
        } catch (Exception e) {
            Log.e(TAG, "Error cancelling alarm: " + e.getMessage());
            promise.reject("ALARM_ERROR", e.getMessage());
        }
    }
} 
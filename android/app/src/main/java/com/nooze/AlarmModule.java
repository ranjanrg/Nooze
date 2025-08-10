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
import android.content.SharedPreferences;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

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
    @ReactMethod
    public void canScheduleExactAlarms(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) { // API 31+
                boolean allowed = alarmManager.canScheduleExactAlarms();
                promise.resolve(allowed);
            } else {
                promise.resolve(true);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error checking canScheduleExactAlarms: " + e.getMessage());
            promise.resolve(true);
        }
    }

    @ReactMethod
    public void openExactAlarmSettings(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                Intent intent = new Intent(android.provider.Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                intent.setData(android.net.Uri.parse("package:" + reactContext.getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                reactContext.startActivity(intent);
                promise.resolve(true);
            } else {
                promise.resolve(true);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error opening exact alarm settings: " + e.getMessage());
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void openAppNotificationSettings(Promise promise) {
        try {
            Intent intent = new Intent();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                intent.setAction(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                intent.putExtra(android.provider.Settings.EXTRA_APP_PACKAGE, reactContext.getPackageName());
            } else {
                intent.setAction(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(android.net.Uri.parse("package:" + reactContext.getPackageName()));
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error opening app notification settings: " + e.getMessage());
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void requestIgnoreBatteryOptimizations(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Intent intent = new Intent(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(android.net.Uri.parse("package:" + reactContext.getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                reactContext.startActivity(intent);
            }
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error requesting ignore battery optimizations: " + e.getMessage());
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void createAlarmChannel(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationManager nm = (NotificationManager) reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
                NotificationChannel channel = new NotificationChannel(
                        "AlarmChannel",
                        "Alarm Notifications",
                        NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Channel for alarm notifications");
                channel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
                channel.enableVibration(true);
                channel.enableLights(true);
                nm.createNotificationChannel(channel);
            }
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error creating alarm channel: " + e.getMessage());
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void postTestNotification(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                // Ensure channel exists
                NotificationManager nm = (NotificationManager) reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
                NotificationChannel channel = new NotificationChannel(
                        "AlarmChannel",
                        "Alarm Notifications",
                        NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Channel for alarm notifications");
                channel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
                nm.createNotificationChannel(channel);
            }
            NotificationManager nm = (NotificationManager) reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
            NotificationCompat.Builder builder = new NotificationCompat.Builder(reactContext, "AlarmChannel")
                    .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                    .setContentTitle("Nooze notifications")
                    .setContentText("Tap to configure notifications")
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setCategory(NotificationCompat.CATEGORY_REMINDER)
                    .setAutoCancel(true);
            nm.notify(42, builder.build());
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error posting test notification: " + e.getMessage());
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void areNotificationsEnabled(Promise promise) {
        try {
            boolean enabled = NotificationManagerCompat.from(reactContext).areNotificationsEnabled();
            promise.resolve(enabled);
        } catch (Exception e) {
            Log.e(TAG, "Error checking notifications enabled: " + e.getMessage());
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void openChannelNotificationSettings(String channelId, Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Intent intent = new Intent(android.provider.Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS);
                intent.putExtra(android.provider.Settings.EXTRA_APP_PACKAGE, reactContext.getPackageName());
                intent.putExtra(android.provider.Settings.EXTRA_CHANNEL_ID, channelId);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                reactContext.startActivity(intent);
                promise.resolve(true);
            } else {
                // Fallback to app notification settings
                openAppNotificationSettings(promise);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error opening channel notification settings: " + e.getMessage());
            promise.resolve(false);
        }
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
  public void consumeLastCompletion(Promise promise) {
      try {
          SharedPreferences prefs = reactContext.getSharedPreferences("NoozePrefs", Context.MODE_PRIVATE);
          boolean pending = prefs.getBoolean("lastCompletionPending", false);
          if (!pending) {
              promise.resolve(null);
              return;
          }
          String dateKey = prefs.getString("lastCompletedDateKey", null);
          String isoWake = prefs.getString("lastCompletedActualWakeTime", null);
          // Clear the pending flag so it is consumed once
          prefs.edit()
                  .putBoolean("lastCompletionPending", false)
                  .apply();
          android.os.Bundle bundle = new android.os.Bundle();
          bundle.putString("dateKey", dateKey);
          bundle.putString("actualWakeTime", isoWake);
          com.facebook.react.bridge.WritableMap map = com.facebook.react.bridge.Arguments.fromBundle(bundle);
          promise.resolve(map);
      } catch (Exception e) {
          Log.e(TAG, "Error consuming last completion: " + e.getMessage());
          promise.resolve(null);
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
            // Optional: persist daily time for reschedule
            int hourOfDay = alarmData.hasKey("hourOfDay") ? alarmData.getInt("hourOfDay") : -1;
            int minuteOfHour = alarmData.hasKey("minuteOfHour") ? alarmData.getInt("minuteOfHour") : -1;
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
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                // Android 12/31+: Use setAlarmClock to guarantee exact timing without special access
                alarmManager.setAlarmClock(
                    new AlarmManager.AlarmClockInfo(triggerTime, pendingIntent),
                    pendingIntent
                );
                Log.d(TAG, "Scheduled alarm using setAlarmClock (Android 12+)");
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                // Android 6.0+ (API 23–30): Exact while idle
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerTime,
                    pendingIntent
                );
                Log.d(TAG, "Scheduled alarm using setExactAndAllowWhileIdle (Android 6.0–11)");
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                // Android 5.0–5.1: AlarmClock
                alarmManager.setAlarmClock(
                    new AlarmManager.AlarmClockInfo(triggerTime, pendingIntent),
                    pendingIntent
                );
                Log.d(TAG, "Scheduled alarm using setAlarmClock (Android 5.x)");
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
            // Persist latest alarm metadata for boot/reschedule
            SharedPreferences prefs = reactContext.getSharedPreferences("NoozePrefs", Context.MODE_PRIVATE);
            prefs.edit()
                .putInt("lastAlarmId", alarmId)
                .putLong("lastTriggerTime", triggerTime)
                .putInt("dailyWakeHour", hourOfDay)
                .putInt("dailyWakeMinute", minuteOfHour)
                .apply();
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

    @ReactMethod
    public void scheduleOneOffTestAlarm(ReadableMap alarmData, Promise promise) {
        Log.d(TAG, "scheduleOneOffTestAlarm called with data: " + alarmData.toString());
        try {
            long triggerTime = (long) alarmData.getDouble("triggerTime");
            int alarmId = alarmData.hasKey("alarmId") ? alarmData.getInt("alarmId") : 9999;

            Intent intent = new Intent(reactContext, AlarmBroadcastReceiver.class);
            intent.putExtra("ALARM_ID", alarmId);
            intent.putExtra("TITLE", "Test Alarm");
            intent.putExtra("RECURRING", false);

            int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;

            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                reactContext,
                alarmId,
                intent,
                flags
            );

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                alarmManager.setAlarmClock(
                    new AlarmManager.AlarmClockInfo(triggerTime, pendingIntent),
                    pendingIntent
                );
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerTime,
                    pendingIntent
                );
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                alarmManager.setAlarmClock(
                    new AlarmManager.AlarmClockInfo(triggerTime, pendingIntent),
                    pendingIntent
                );
            } else {
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    triggerTime,
                    pendingIntent
                );
            }

            Log.d(TAG, "One-off test alarm scheduled for: " + triggerTime + " (ID: " + alarmId + ")");
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error scheduling one-off test alarm: " + e.getMessage());
            promise.reject("ALARM_ERROR", e.getMessage());
        }
    }
    @ReactMethod
    public void clearAllAlarms(Promise promise) {
        try {
            SharedPreferences prefs = reactContext.getSharedPreferences("NoozePrefs", Context.MODE_PRIVATE);
            int lastId = prefs.getInt("lastAlarmId", -1);
            if (lastId != -1) {
                Intent intent = new Intent(reactContext, AlarmBroadcastReceiver.class);
                PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    reactContext,
                    lastId,
                    intent,
                    PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
                );
                if (pendingIntent != null) {
                    alarmManager.cancel(pendingIntent);
                    pendingIntent.cancel();
                    Log.d(TAG, "Cleared last scheduled alarm: " + lastId);
                }
            }
            // Also stop any running alarm service and reset flags
            try {
                Intent serviceIntent = new Intent(reactContext, AlarmService.class);
                reactContext.stopService(serviceIntent);
            } catch (Exception ignored) {}
            prefs.edit().putBoolean("isAlarmActive", false).apply();
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error clearing alarms: " + e.getMessage());
            promise.reject("ALARM_ERROR", e.getMessage());
        }
    }
} 
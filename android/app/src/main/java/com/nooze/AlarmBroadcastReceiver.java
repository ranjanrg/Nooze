package com.nooze;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import java.util.Calendar;
import java.util.List;

public class AlarmBroadcastReceiver extends BroadcastReceiver {
    private static final String TAG = "AlarmBroadcastReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent.getAction() != null && intent.getAction().equals(Intent.ACTION_BOOT_COMPLETED)) {
            Log.d(TAG, "Boot completed - rescheduling alarms");
            startRescheduleAlarmsService(context);
        } else {
            Log.d(TAG, "Alarm received - starting alarm service");
            startAlarmService(context, intent);
        }
    }

    private void startAlarmService(Context context, Intent intent) {
        Intent intentService = new Intent(context, AlarmService.class);
        intentService.putExtra("ALARM_ID", intent.getIntExtra("ALARM_ID", -1));
        intentService.putExtra("TITLE", intent.getStringExtra("TITLE"));
        intentService.putExtra("RECURRING", intent.getBooleanExtra("RECURRING", false));
        intentService.putExtra("MONDAY", intent.getBooleanExtra("MONDAY", false));
        intentService.putExtra("TUESDAY", intent.getBooleanExtra("TUESDAY", false));
        intentService.putExtra("WEDNESDAY", intent.getBooleanExtra("WEDNESDAY", false));
        intentService.putExtra("THURSDAY", intent.getBooleanExtra("THURSDAY", false));
        intentService.putExtra("FRIDAY", intent.getBooleanExtra("FRIDAY", false));
        intentService.putExtra("SATURDAY", intent.getBooleanExtra("SATURDAY", false));
        intentService.putExtra("SUNDAY", intent.getBooleanExtra("SUNDAY", false));

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intentService);
        } else {
            context.startService(intentService);
        }
    }

    private void startRescheduleAlarmsService(Context context) {
        Intent intentService = new Intent(context, RescheduleAlarmsService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intentService);
        } else {
            context.startService(intentService);
        }
    }
} 
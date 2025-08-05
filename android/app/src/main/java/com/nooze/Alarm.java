package com.nooze;

import androidx.room.Entity;
import androidx.room.PrimaryKey;
import android.content.Context;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import java.util.Calendar;

@Entity(tableName = "alarm_table")
public class Alarm {
    @PrimaryKey(autoGenerate = true)
    private int alarmId;
    private int hour, minute;
    private boolean started;
    private String title;
    private boolean recurring;
    private boolean monday, tuesday, wednesday, thursday, friday, saturday, sunday;

    public Alarm(int hour, int minute, String title, boolean started, boolean recurring,
                 boolean monday, boolean tuesday, boolean wednesday, boolean thursday,
                 boolean friday, boolean saturday, boolean sunday) {
        this.hour = hour;
        this.minute = minute;
        this.title = title;
        this.started = started;
        this.recurring = recurring;
        this.monday = monday;
        this.tuesday = tuesday;
        this.wednesday = wednesday;
        this.thursday = thursday;
        this.friday = friday;
        this.saturday = saturday;
        this.sunday = sunday;
    }

    public void schedule(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, AlarmBroadcastReceiver.class);
        intent.putExtra("ALARM_ID", alarmId);
        intent.putExtra("TITLE", title);
        intent.putExtra("RECURRING", recurring);
        intent.putExtra("MONDAY", monday);
        intent.putExtra("TUESDAY", tuesday);
        intent.putExtra("WEDNESDAY", wednesday);
        intent.putExtra("THURSDAY", thursday);
        intent.putExtra("FRIDAY", friday);
        intent.putExtra("SATURDAY", saturday);
        intent.putExtra("SUNDAY", sunday);

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context, 
            alarmId, 
            intent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Calendar calendar = Calendar.getInstance();
        calendar.setTimeInMillis(System.currentTimeMillis());
        calendar.set(Calendar.HOUR_OF_DAY, hour);
        calendar.set(Calendar.MINUTE, minute);
        calendar.set(Calendar.SECOND, 0);

        // If alarm time has already passed today, schedule for tomorrow
        if (calendar.getTimeInMillis() <= System.currentTimeMillis()) {
            calendar.set(Calendar.DAY_OF_YEAR, calendar.get(Calendar.DAY_OF_YEAR) + 1);
        }

        long triggerTime = calendar.getTimeInMillis();

        // Use appropriate alarm method based on Android version
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
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

        Log.d("Alarm", "Scheduled alarm " + alarmId + " for " + calendar.getTime());
    }

    public void cancelAlarm(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, AlarmBroadcastReceiver.class);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context, 
            alarmId, 
            intent, 
            PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
        );
        
        if (pendingIntent != null) {
            alarmManager.cancel(pendingIntent);
            pendingIntent.cancel();
        }
        
        Log.d("Alarm", "Cancelled alarm " + alarmId);
    }

    // Getters and Setters
    public int getAlarmId() { return alarmId; }
    public void setAlarmId(int alarmId) { this.alarmId = alarmId; }
    public int getHour() { return hour; }
    public void setHour(int hour) { this.hour = hour; }
    public int getMinute() { return minute; }
    public void setMinute(int minute) { this.minute = minute; }
    public boolean isStarted() { return started; }
    public void setStarted(boolean started) { this.started = started; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public boolean isRecurring() { return recurring; }
    public void setRecurring(boolean recurring) { this.recurring = recurring; }
    public boolean isMonday() { return monday; }
    public void setMonday(boolean monday) { this.monday = monday; }
    public boolean isTuesday() { return tuesday; }
    public void setTuesday(boolean tuesday) { this.tuesday = tuesday; }
    public boolean isWednesday() { return wednesday; }
    public void setWednesday(boolean wednesday) { this.wednesday = wednesday; }
    public boolean isThursday() { return thursday; }
    public void setThursday(boolean thursday) { this.thursday = thursday; }
    public boolean isFriday() { return friday; }
    public void setFriday(boolean friday) { this.friday = friday; }
    public boolean isSaturday() { return saturday; }
    public void setSaturday(boolean saturday) { this.saturday = saturday; }
    public boolean isSunday() { return sunday; }
    public void setSunday(boolean sunday) { this.sunday = sunday; }
} 
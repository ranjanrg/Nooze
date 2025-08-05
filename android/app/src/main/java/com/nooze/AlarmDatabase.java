package com.nooze;

import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;
import android.content.Context;

@Database(entities = {Alarm.class}, version = 1, exportSchema = false)
public abstract class AlarmDatabase extends RoomDatabase {
    private static AlarmDatabase instance;
    public abstract AlarmDao alarmDao();

    public static synchronized AlarmDatabase getInstance(Context context) {
        if (instance == null) {
            instance = Room.databaseBuilder(
                context.getApplicationContext(),
                AlarmDatabase.class,
                "alarm_database"
            ).build();
        }
        return instance;
    }
} 
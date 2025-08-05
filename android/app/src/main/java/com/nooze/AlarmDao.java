package com.nooze;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.Query;
import androidx.room.Update;
import java.util.List;

@Dao
public interface AlarmDao {
    @Insert
    void insert(Alarm alarm);

    @Update
    void update(Alarm alarm);

    @Delete
    void delete(Alarm alarm);

    @Query("SELECT * FROM alarm_table ORDER BY hour ASC, minute ASC")
    LiveData<List<Alarm>> getAllAlarms();

    @Query("SELECT * FROM alarm_table WHERE started = 1")
    List<Alarm> getStartedAlarms();
} 
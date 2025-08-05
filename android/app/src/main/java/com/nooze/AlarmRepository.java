package com.nooze;

import android.app.Application;
import androidx.lifecycle.LiveData;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class AlarmRepository {
    private AlarmDao alarmDao;
    private LiveData<List<Alarm>> allAlarms;
    private ExecutorService executorService;

    public AlarmRepository(Application application) {
        AlarmDatabase database = AlarmDatabase.getInstance(application);
        alarmDao = database.alarmDao();
        allAlarms = alarmDao.getAllAlarms();
        executorService = Executors.newSingleThreadExecutor();
    }

    public void insert(Alarm alarm) {
        executorService.execute(() -> alarmDao.insert(alarm));
    }

    public void update(Alarm alarm) {
        executorService.execute(() -> alarmDao.update(alarm));
    }

    public void delete(Alarm alarm) {
        executorService.execute(() -> alarmDao.delete(alarm));
    }

    public LiveData<List<Alarm>> getAllAlarms() {
        return allAlarms;
    }

    public List<Alarm> getStartedAlarms() {
        return alarmDao.getStartedAlarms();
    }
} 
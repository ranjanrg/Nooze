package com.nooze;

import android.util.Log;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class AlarmPackage implements ReactPackage {
    private static final String TAG = "AlarmPackage";

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        Log.d(TAG, "AlarmPackage.createNativeModules called!");
        List<NativeModule> modules = new ArrayList<>();
        AlarmModule alarmModule = new AlarmModule(reactContext);
        modules.add(alarmModule);
        Log.d(TAG, "AlarmModule added to modules list: " + alarmModule.getName());
        return modules;
    }
} 
package com.zigo.education;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.batoulapps.adhan.CalculationMethod;
import com.batoulapps.adhan.Coordinates;
import com.batoulapps.adhan.PrayerTimes;
import com.batoulapps.adhan.data.DateComponents;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

@CapacitorPlugin(name = "PrayerTimes")
public class PrayerTimesPlugin extends Plugin {

    @PluginMethod
    public void getPrayerTimes(PluginCall call) {
        Double latitude = call.getDouble("latitude");
        Double longitude = call.getDouble("longitude");
        String methodStr = call.getString("method", "TURKEY"); // Varsayılan Türkiye (Diyanet'e yakın)

        if (latitude == null || longitude == null) {
            call.reject("Koordinatlar eksik!");
            return;
        }

        Coordinates coordinates = new Coordinates(latitude, longitude);
        DateComponents date = DateComponents.from(new Date());
        
        // Hesaplama yöntemini seç
        CalculationMethod method;
        try {
            method = CalculationMethod.valueOf(methodStr);
        } catch (Exception e) {
            method = CalculationMethod.MUSLIM_WORLD_LEAGUE;
        }

        PrayerTimes prayerTimes = new PrayerTimes(coordinates, date, method.getParameters());
        SimpleDateFormat formatter = new SimpleDateFormat("HH:mm", Locale.getDefault());
        formatter.setTimeZone(TimeZone.getDefault());

        JSObject ret = new JSObject();
        ret.put("fajr", formatter.format(prayerTimes.fajr));
        ret.put("sunrise", formatter.format(prayerTimes.sunrise));
        ret.put("dhuhr", formatter.format(prayerTimes.dhuhr));
        ret.put("asr", formatter.format(prayerTimes.asr));
        ret.put("maghrib", formatter.format(prayerTimes.maghrib));
        ret.put("isha", formatter.format(prayerTimes.isha));

        call.resolve(ret);
    }
}

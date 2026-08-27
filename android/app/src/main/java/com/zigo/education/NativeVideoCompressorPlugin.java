package com.zigo.education;

import android.net.Uri;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.abedelazizshe.lightcompressorlibrary.CompressionListener;
import com.abedelazizshe.lightcompressorlibrary.VideoCompressor;
import com.abedelazizshe.lightcompressorlibrary.VideoQuality;
import com.abedelazizshe.lightcompressorlibrary.config.Configuration;
import com.abedelazizshe.lightcompressorlibrary.config.AppSpecificStorageConfiguration;

import java.io.File;

@CapacitorPlugin(name = "NativeVideoCompressor")
public class NativeVideoCompressorPlugin extends Plugin {

    @PluginMethod
    public void compress(PluginCall call) {
        String fileUriStr = call.getString("fileUri");
        if (fileUriStr == null) {
            call.reject("fileUri is required");
            return;
        }

        // Convert the input URI string (often file:// format) to an Android Uri
        Uri inputUri = Uri.parse(fileUriStr);
        String outputPath = getContext().getCacheDir().getPath() + "/compressed_" + System.currentTimeMillis() + ".mp4";

        try {
            // Initiate LightCompressor
            VideoCompressor.start(
                getContext(),
                inputUri,
                null,
                outputPath,
                new Configuration(
                    VideoQuality.MEDIUM,
                    false, // isMinBitrateCheckEnabled
                    null,  // videoBitrate
                    false, // disableAudio
                    false, // keepOriginalResolution
                    720.0, // videoWidth
                    1280.0 // videoHeight
                ),
                new CompressionListener() {
                    @Override
                    public void onProgress(float percent) {
                        // In a more advanced implementation, we could emit events to JS here.
                    }

                    @Override
                    public void onSuccess() {
                        File outFile = new File(outputPath);
                        JSObject ret = new JSObject();
                        ret.put("fileUri", "file://" + outputPath);
                        ret.put("size", outFile.length());
                        call.resolve(ret);
                    }

                    @Override
                    public void onFailure(String failureMessage) {
                        Log.e("ZigoVideoCompressor", "Compression Failed: " + failureMessage);
                        call.reject("Compression failed: " + failureMessage);
                    }

                    @Override
                    public void onStart() {
                        Log.i("ZigoVideoCompressor", "Compression Started");
                    }

                    @Override
                    public void onCancelled() {
                        call.reject("Compression cancelled");
                    }
                }
            );
        } catch (Exception e) {
            Log.e("ZigoVideoCompressor", "Exception starting compression", e);
            call.reject("Failed to initialize compressor: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void cancel(PluginCall call) {
        VideoCompressor.cancel();
        call.resolve();
    }
}

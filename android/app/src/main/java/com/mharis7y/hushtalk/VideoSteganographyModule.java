package com.mharis7y.hushtalk;

import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Log;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.mharis7y.hushtalk.parameters.VideoEncodeParams;
import com.mharis7y.hushtalk.parameters.VideoDecodeParams;
import com.mharis7y.hushtalk.process.SimpleEncodeProcess;
import com.mharis7y.hushtalk.process.SimpleDecodeProcess;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.OutputStream;

public class VideoSteganographyModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "VideoSteganography";
    private ReactApplicationContext reactContext;

    public VideoSteganographyModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void encodeVideo(String videoUri, String textToHide, Promise promise) {
        try {
            // Convert URI to actual file path
            String videoPath = getRealPathFromURI(videoUri);
            if (videoPath == null || !new File(videoPath).exists()) {
                promise.reject("INVALID_PATH", "Unable to resolve video file path from URI: " + videoUri);
                return;
            }

            // Get output directory - use public Movies directory for gallery visibility
            File outputDir;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // For Android 10+, we'll use MediaStore, so use a temporary directory
                outputDir = new File(reactContext.getExternalFilesDir(null), "HushTalk");
            } else {
                // For older versions, save directly to public Movies directory
                outputDir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES), "HushTalk");
            }
            if (!outputDir.exists()) {
                outputDir.mkdirs();
            }

            String outputDirectory = outputDir.getAbsolutePath() + File.separator;

            // Create parameters
            VideoEncodeParams params = new VideoEncodeParams(videoPath, textToHide, outputDirectory);

            // Execute encoding
            SimpleEncodeProcess encodeProcess = new SimpleEncodeProcess();
            boolean success = encodeProcess.encode(params);

            if (success) {
                String outputPath = outputDirectory + params.getOutputFileName();
                File outputFile = new File(outputPath);

                // Save to MediaStore or legacy storage to make it visible in gallery
                Uri mediaUri = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q)
                    ? saveVideoToMediaStore(outputFile, params.getOutputFileName())
                    : saveVideoToLegacyStorage(outputFile, params.getOutputFileName());

                WritableMap result = Arguments.createMap();
                result.putString("uri", mediaUri.toString());
                result.putString("path", outputPath);
                result.putString("fileName", params.getOutputFileName());
                promise.resolve(result);
            } else {
                String errorMessage = encodeProcess.getLastError();
                promise.reject("ENCODE_FAILED", errorMessage != null ? errorMessage : "Video encoding failed");
            }
        } catch (Exception e) {
            Log.e(MODULE_NAME, "Error encoding video", e);
            promise.reject("ENCODE_ERROR", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void decodeVideo(String videoUri, Promise promise) {
        try {
            String videoPath = getRealPathFromURI(videoUri);
            if (videoPath == null || !new File(videoPath).exists()) {
                promise.reject("INVALID_PATH", "Unable to resolve video file path from URI: " + videoUri);
                return;
            }

            VideoDecodeParams params = new VideoDecodeParams(videoPath);

            SimpleDecodeProcess decodeProcess = new SimpleDecodeProcess();
            boolean success = decodeProcess.decode(params);

            if (success) {
                String decodedText = decodeProcess.getDecodedText();
                WritableMap result = Arguments.createMap();
                result.putString("text", decodedText);
                promise.resolve(result);
            } else {
                String errorMessage = decodeProcess.getLastError();
                promise.reject("DECODE_FAILED", errorMessage != null ? errorMessage : "Video decoding failed");
            }
        } catch (Exception e) {
            Log.e(MODULE_NAME, "Error decoding video", e);
            promise.reject("DECODE_ERROR", e.getMessage(), e);
        }
    }

    /**
     * Save video to MediaStore to make it visible in gallery (Android 10+ / API 29+)
     */
    private Uri saveVideoToMediaStore(File videoFile, String fileName) throws IOException {
        android.content.ContentResolver contentResolver = reactContext.getContentResolver();

        ContentValues contentValues = new ContentValues();
        contentValues.put(MediaStore.Video.Media.DISPLAY_NAME, fileName);
        contentValues.put(MediaStore.Video.Media.MIME_TYPE, "video/mp4");
        contentValues.put(MediaStore.Video.Media.RELATIVE_PATH, Environment.DIRECTORY_MOVIES + "/HushTalk");
        contentValues.put(MediaStore.Video.Media.IS_PENDING, 1);

        Uri uri = contentResolver.insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, contentValues);
        if (uri == null) {
            throw new IOException("Failed to create MediaStore entry");
        }

        OutputStream outputStream = null;
        FileInputStream inputStream = null;
        try {
            outputStream = contentResolver.openOutputStream(uri);
            if (outputStream == null) {
                throw new IOException("Failed to open output stream");
            }

            inputStream = new FileInputStream(videoFile);
            byte[] buffer = new byte[1024];
            int length;
            while ((length = inputStream.read(buffer)) > 0) {
                outputStream.write(buffer, 0, length);
            }
            outputStream.flush();

            // Mark as not pending so it appears in gallery
            contentValues.clear();
            contentValues.put(MediaStore.Video.Media.IS_PENDING, 0);
            contentResolver.update(uri, contentValues, null, null);

            Log.d(MODULE_NAME, "Video saved to MediaStore: " + uri.toString());
            return uri;
        } catch (Exception e) {
            // Clean up on failure
            if (uri != null) {
                contentResolver.delete(uri, null, null);
            }
            throw new IOException("Failed to save video to MediaStore", e);
        } finally {
            if (outputStream != null) {
                try {
                    outputStream.close();
                } catch (IOException e) {
                    // Ignore
                }
            }
            if (inputStream != null) {
                try {
                    inputStream.close();
                } catch (IOException e) {
                    // Ignore
                }
            }
        }
    }

    /**
     * Legacy storage method for Android 9 and below
     * For older versions, the file is already saved to public directory by MP4MediaWriter,
     * so we just need to notify the media scanner
     */
    private Uri saveVideoToLegacyStorage(File videoFile, String fileName) throws IOException {
        // File is already in the correct public location, just notify media scanner
        android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_MEDIA_SCANNER_SCAN_FILE);
        intent.setData(Uri.fromFile(videoFile));
        reactContext.sendBroadcast(intent);

        Log.d(MODULE_NAME, "Video saved to legacy storage: " + videoFile.getAbsolutePath());
        return Uri.fromFile(videoFile);
    }

    private String getRealPathFromURI(String uriString) {
        try {
            Uri uri = Uri.parse(uriString);
            String scheme = uri.getScheme();

            if (scheme == null || scheme.equals("file")) {
                // Already a file path
                return uri.getPath();
            } else if (scheme.equals("content")) {
                // Content URI - need to resolve to file path
                android.database.Cursor cursor = reactContext.getContentResolver().query(
                    uri,
                    new String[]{android.provider.MediaStore.Video.Media.DATA},
                    null,
                    null,
                    null
                );

                if (cursor != null) {
                    if (cursor.moveToFirst()) {
                        int columnIndex = cursor.getColumnIndex(android.provider.MediaStore.Video.Media.DATA);
                        if (columnIndex >= 0) {
                            String path = cursor.getString(columnIndex);
                            cursor.close();
                            return path;
                        }
                    }
                    cursor.close();
                }

                // Fallback: try to get path from URI directly
                String path = uri.getPath();
                if (path != null && new File(path).exists()) {
                    return path;
                }
            }

            // Last resort: try as direct file path
            return uriString.replace("file://", "");
        } catch (Exception e) {
            Log.e(MODULE_NAME, "Error resolving URI to path", e);
            return null;
        }
    }
}

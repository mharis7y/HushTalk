package com.mharis7y.hushtalk.bitmap

import android.content.ContentValues
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.ImageDecoder
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Log
import java.io.File
import java.io.FileOutputStream

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableNativeArray

class BitmapModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String {
        return "Bitmap"
    }

    @ReactMethod
    fun getPixels(filePath: String, start: Int, end: Int, promise: Promise) {
        try {
            val bitmap = this.getBitmap(filePath)
            val width = bitmap.getWidth()
            val height = bitmap.getHeight()
            
            val pixels = WritableNativeArray()
            val totalPixels = end - start
            
            for (i in 0 until totalPixels) {
                val pixelIndex = start + i
                val x = pixelIndex % width
                val y = pixelIndex / width
                
                if (x < width && y < height) {
                    val color = bitmap.getPixel(x, y)
                    pixels.pushInt(Color.red(color))
                    pixels.pushInt(Color.green(color))
                    pixels.pushInt(Color.blue(color))
                }
            }

            promise.resolve(pixels)
        } catch (e: Exception) {
            Log.e("BitmapModule", "Error getting pixels", e)
            promise.reject("BITMAP_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun setPixels(filePath: String, pixels: ReadableArray, promise: Promise) {
        try {

            val bitmap = this.getBitmap(filePath)
            val width = bitmap.getWidth()
            val height = bitmap.getHeight()
            val pixelsRequired = pixels.size().div(3)

            for (i in 0 until pixelsRequired) {
                val color = Color.argb(255, pixels.getInt(i * 3), pixels.getInt(i * 3 + 1), pixels.getInt(i * 3 + 2))
                val x = i % width
                val y = i / width
                if (x < width && y < height) {
                    bitmap.setPixel(x, y, color)
                }
            }

            // Use MediaStore API for Android 10+ (API 29+), fallback for older versions
            val uri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                saveImageToMediaStore(bitmap)
            } else {
                saveImageToLegacyStorage(bitmap)
            }
            
            promise.resolve(uri.toString())
        } catch (e: Exception) {
            Log.e("BitmapModule", "Error setting pixels", e)
            promise.reject("BITMAP_ERROR", e.message, e)
        }
    }

    fun getBitmap(filePath: String): Bitmap {
        val context = getReactApplicationContext()
        val cr = context.getContentResolver()
        val uri = Uri.parse(filePath)

        val bitmap: Bitmap
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            val source = ImageDecoder.createSource(cr, uri)
            val onHeaderListener = ImageDecoder.OnHeaderDecodedListener { decoder, _, _ ->
                decoder.setMutableRequired(true)
            }
            bitmap = ImageDecoder.decodeBitmap(source, onHeaderListener)
        } else {
            bitmap = MediaStore.Images.Media.getBitmap(cr, uri)
        }

        return bitmap
    }

    /**
     * Save image using MediaStore API (Android 10+ / API 29+)
     * This is the modern way that works with scoped storage
     */
    private fun saveImageToMediaStore(bitmap: Bitmap): Uri {
        val context = getReactApplicationContext()
        val contentResolver = context.contentResolver
        val date = System.currentTimeMillis()
        val fileName = "HushTalk_${date}.png"

        val contentValues = ContentValues().apply {
            put(MediaStore.Images.Media.DISPLAY_NAME, fileName)
            put(MediaStore.Images.Media.MIME_TYPE, "image/png")
            put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/HushTalk")
            put(MediaStore.Images.Media.IS_PENDING, 1)
        }

        val uri = contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)
            ?: throw Exception("Failed to create MediaStore entry")

        try {
            contentResolver.openOutputStream(uri)?.use { outputStream ->
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
            } ?: throw Exception("Failed to open output stream")

            // Mark as not pending so it appears in gallery
            contentValues.clear()
            contentValues.put(MediaStore.Images.Media.IS_PENDING, 0)
            contentResolver.update(uri, contentValues, null, null)

            Log.d("BitmapModule", "Image saved to MediaStore: $uri")
            return uri
        } catch (e: Exception) {
            // Clean up on failure
            contentResolver.delete(uri, null, null)
            throw e
        }
    }

    /**
     * Legacy storage method for Android 9 and below
     */
    private fun saveImageToLegacyStorage(bitmap: Bitmap): Uri {
        val context = getReactApplicationContext()
        val myDir = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), "HushTalk")

        if (!myDir.exists()) {
            if (!myDir.mkdirs()) {
                throw Exception("Failed to create HushTalk directory")
            }
        }

        val date = System.currentTimeMillis()
        val fileName = "HushTalk_${date}.png"
        val file = File(myDir, fileName)

        FileOutputStream(file).use { out ->
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
            out.flush()
        }

        // Notify media scanner
        val intent = android.content.Intent(android.content.Intent.ACTION_MEDIA_SCANNER_SCAN_FILE)
        intent.data = Uri.fromFile(file)
        context.sendBroadcast(intent)

        Log.d("BitmapModule", "Image saved to legacy storage: ${file.absolutePath}")
        return Uri.fromFile(file)
    }
}

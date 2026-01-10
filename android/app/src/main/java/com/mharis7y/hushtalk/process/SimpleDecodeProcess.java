package com.mharis7y.hushtalk.process;

import android.util.Log;
import com.mharis7y.hushtalk.algorithms.AlgorithmFactory;
import com.mharis7y.hushtalk.algorithms.ISteganographyContainer;
import com.mharis7y.hushtalk.algorithms.compression.Deflate;
import com.mharis7y.hushtalk.error.ErrorManager;
import com.mharis7y.hushtalk.mp4.MP4MediaReader;
import com.mharis7y.hushtalk.parameters.VideoDecodeParams;
import com.mharis7y.hushtalk.tools.Utils;

public class SimpleDecodeProcess {
    private static final String TAG = "SimpleDecodeProcess";
    private static final String H264_LSB1BIT_CONTAINER = "com.mharis7y.hushtalk.algorithms.steganography.video.H264SteganographyContainerLsb1Bit";
    
    private MP4MediaReader _mp4MediaReader;
    private ISteganographyContainer _h264SteganographyContainer;
    private byte[] _unHideData;
    private String _lastError;
    private String _decodedText;

    public SimpleDecodeProcess() {
        _mp4MediaReader = null;
        _h264SteganographyContainer = null;
        _unHideData = null;
        _lastError = null;
        _decodedText = null;
    }

    public boolean decode(VideoDecodeParams parameters) {
        Utils.setStartTime();
        Log.i(TAG, "Start video decoding");
        _lastError = null;

        if (!this.init(parameters)) {
            return false;
        }

        // Extract data from video
        Log.i(TAG, "Extracting data from video");
        _h264SteganographyContainer.unHideData();
        byte[] unHideDataVideo = _h264SteganographyContainer.getUnHideData();

        if (unHideDataVideo == null || unHideDataVideo.length == 0) {
            _lastError = "No hidden data found in video";
            Log.e(TAG, _lastError);
            return false;
        }

        // Decompress the data
        Utils.printTime("Start text decompression: ");
        try {
            _decodedText = Deflate.decompress(unHideDataVideo);
            Utils.printTime("End text decompression: ");
        } catch (Exception e) {
            _lastError = "Error decompressing data: " + e.getMessage();
            Log.e(TAG, _lastError, e);
            return false;
        }

        Log.i(TAG, "End video decoding");
        return true;
    }

    public String getDecodedText() {
        return _decodedText;
    }

    public String getLastError() {
        return _lastError;
    }

    // Private methods
    private boolean init(VideoDecodeParams parameters) {
        return initSteganographyContainer() && initMp4Components(parameters);
    }

    private boolean initSteganographyContainer() {
        // Always use LSB1Bit algorithm
        _h264SteganographyContainer = AlgorithmFactory.getSteganographyContainerInstanceFromName(H264_LSB1BIT_CONTAINER);
        if (_h264SteganographyContainer == null) {
            _lastError = "Unable to load H264 LSB1Bit steganography algorithm";
            ErrorManager.getInstance().addErrorMessage(_lastError);
            return false;
        }
        return true;
    }

    private boolean initMp4Components(VideoDecodeParams parameters) {
        Utils.printTime("Start load file: ");
        _mp4MediaReader = new MP4MediaReader();
        if (!_mp4MediaReader.loadData(parameters.getVideoPath())) {
            _lastError = "Unable to load data from original MP4";
            ErrorManager.getInstance().addErrorMessage(_lastError);
            return false;
        }

        _h264SteganographyContainer.setFileStreamDirectory(null); // Not needed for decoding

        if (!_h264SteganographyContainer.loadData(_mp4MediaReader)) {
            _lastError = "Unable to load video channel from original MP4";
            ErrorManager.getInstance().addErrorMessage(_lastError);
            return false;
        }
        Utils.printTime("End load file: ");
        return true;
    }
}




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
    // Using AAC audio steganography instead of H264 video steganography
    private static final String AAC_LSB1BIT_CONTAINER = "com.mharis7y.hushtalk.algorithms.steganography.audio.AACSteganographyContainerLsb1Bit";
    
    private MP4MediaReader _mp4MediaReader;
    private ISteganographyContainer _aacSteganographyContainer;
    private byte[] _unHideData;
    private String _lastError;
    private String _decodedText;

    public SimpleDecodeProcess() {
        _mp4MediaReader = null;
        _aacSteganographyContainer = null;
        _unHideData = null;
        _lastError = null;
        _decodedText = null;
    }

    public boolean decode(VideoDecodeParams parameters) {
        Utils.setStartTime();
        Log.i(TAG, "Start video decoding (AAC audio steganography)");
        _lastError = null;

        if (!this.init(parameters)) {
            return false;
        }

        // Extract data from audio track
        Log.i(TAG, "Extracting data from audio track");
        _aacSteganographyContainer.unHideData();
        byte[] unHideDataAudio = _aacSteganographyContainer.getUnHideData();

        if (unHideDataAudio == null || unHideDataAudio.length == 0) {
            _lastError = "No hidden data found in Video";
            Log.e(TAG, _lastError);
            return false;
        }

        // Decompress the data
        Utils.printTime("Start text decompression: ");
        try {
            _decodedText = Deflate.decompress(unHideDataAudio);
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
        return initSteganographyContainer() && 
               initMp4Components(parameters) &&
               checkAudioTrackExists();
    }

    private boolean initSteganographyContainer() {
        // Use AAC LSB1Bit algorithm for audio steganography
        _aacSteganographyContainer = AlgorithmFactory.getSteganographyContainerInstanceFromName(AAC_LSB1BIT_CONTAINER);
        if (_aacSteganographyContainer == null) {
            _lastError = "Unable to load AAC LSB1Bit steganography algorithm";
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

        _aacSteganographyContainer.setFileStreamDirectory(null); // Not needed for decoding

        if (!_aacSteganographyContainer.loadData(_mp4MediaReader)) {
            _lastError = "Unable to load audio channel from original MP4";
            ErrorManager.getInstance().addErrorMessage(_lastError);
            return false;
        }
        Utils.printTime("End load file: ");
        return true;
    }

    /**
     * Check if the video has an audio track - required for AAC steganography
     */
    private boolean checkAudioTrackExists() {
        if (_mp4MediaReader.getAudioSampleList() == null || _mp4MediaReader.getAudioSampleList().size() == 0) {
            _lastError = "Video has no audio track. Cannot extract hidden data.";
            ErrorManager.getInstance().addErrorMessage(_lastError);
            Log.e(TAG, _lastError);
            return false;
        }
        return true;
    }
}


package com.mharis7y.hushtalk.process;

import android.util.Log;
import com.mharis7y.hushtalk.algorithms.AlgorithmFactory;
import com.mharis7y.hushtalk.algorithms.ISteganographyContainer;
import com.mharis7y.hushtalk.algorithms.compression.Deflate;
import com.mharis7y.hushtalk.error.ErrorManager;
import com.mharis7y.hushtalk.mp4.MP4MediaReader;
import com.mharis7y.hushtalk.mp4.MP4MediaWriter;
import com.mharis7y.hushtalk.parameters.VideoEncodeParams;
import com.mharis7y.hushtalk.tools.Utils;
import com.googlecode.mp4parser.DataSource;
import com.googlecode.mp4parser.authoring.Track;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import org.apache.commons.io.IOUtils;

public class SimpleEncodeProcess {
    private static final String TAG = "SimpleEncodeProcess";
    // Using AAC audio steganography instead of H264 video steganography
    // H264 with CABAC (High Profile) causes green artifacts, AAC is safe
    private static final String AAC_LSB1BIT_CONTAINER = "com.mharis7y.hushtalk.algorithms.steganography.audio.AACSteganographyContainerLsb1Bit";
    
    private MP4MediaReader _mp4MediaReader;
    private ISteganographyContainer _aacSteganographyContainer;
    private ByteArrayInputStream _contentToHideStream;
    private byte[] _bytesToHide;
    private String _lastError;

    public SimpleEncodeProcess() {
        _mp4MediaReader = null;
        _aacSteganographyContainer = null;
        _contentToHideStream = null;
        _bytesToHide = null;
        _lastError = null;
    }

    public boolean encode(VideoEncodeParams parameters) {
        Utils.setStartTime();
        Log.i(TAG, "Start video encoding (AAC audio steganography)");
        _lastError = null;

        if (!this.init(parameters)) {
            return false;
        }

        // Hide data in audio track
        Log.i(TAG, "Hiding data in audio track");
        _aacSteganographyContainer.hideData(_bytesToHide);

        // Finalize and save
        finalise(parameters);
        Log.i(TAG, "End video encoding");
        return true;
    }

    public String getLastError() {
        return _lastError;
    }

    // Private methods
    private boolean init(VideoEncodeParams parameters) {
        return initContentToHideStream(parameters) &&
               initSteganographyContainer() &&
               initMp4Components(parameters) &&
               checkAudioTrackExists() &&
               checkEnoughSpaceInAudio();
    }

    private boolean initContentToHideStream(VideoEncodeParams parameters) {
        try {
            String textToHide = parameters.getTextToHide();
            if (textToHide == null || textToHide.isEmpty()) {
                _lastError = "Text to hide cannot be empty";
                return false;
            }

            // Compress the text using Deflate compression
            Utils.printTime("Start text compression: ");
            byte[] compressedBytes = Deflate.compress(textToHide);
            Utils.printTime("End text compression: ");

            _bytesToHide = compressedBytes;
            _contentToHideStream = new ByteArrayInputStream(_bytesToHide);

            if (_bytesToHide.length > Utils.MAX_BYTE_TO_HIDE) {
                _lastError = "The content you want to hide is too big (30MB max)";
                return false;
            }
            return true;
        } catch (Exception e) {
            _lastError = "Unable to prepare content to hide: " + e.getMessage();
            Log.e(TAG, _lastError, e);
            return false;
        }
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

    private boolean initMp4Components(VideoEncodeParams parameters) {
        Utils.printTime("Start preparing data: ");
        _mp4MediaReader = new MP4MediaReader();
        if (!_mp4MediaReader.loadData(parameters.getSourceVideoPath())) {
            _lastError = "Unable to load data from original MP4";
            ErrorManager.getInstance().addErrorMessage(_lastError);
            return false;
        }

        _aacSteganographyContainer.setFileStreamDirectory(parameters.getDestinationVideoDirectory());

        if (!_aacSteganographyContainer.loadData(_mp4MediaReader)) {
            _lastError = "Unable to load audio channel from original MP4";
            ErrorManager.getInstance().addErrorMessage(_lastError);
            return false;
        }
        return true;
    }

    /**
     * Check if the video has an audio track - required for AAC steganography
     */
    private boolean checkAudioTrackExists() {
        if (_mp4MediaReader.getAudioSampleList() == null || _mp4MediaReader.getAudioSampleList().size() == 0) {
            _lastError = "Video has no audio track. Steganography requires a video with audio.";
            ErrorManager.getInstance().addErrorMessage(_lastError);
            Log.e(TAG, _lastError);
            return false;
        }
        return true;
    }

    private boolean checkEnoughSpaceInAudio() {
        if (_aacSteganographyContainer == null || _bytesToHide == null) {
            _lastError = "Steganography container or content not initialized";
            return false;
        }

        long audioSteganographyLength = _aacSteganographyContainer.getMaxContentToHide();
        int dataLength = _bytesToHide.length;

        if (audioSteganographyLength < dataLength) {
            _lastError = "Not enough space in audio to hide data. Maximum: " + audioSteganographyLength + " bytes, Required: " + dataLength + " bytes";
            ErrorManager.getInstance().addErrorMessage(_lastError);
            Log.e(TAG, _lastError);
            return false;
        }
        return true;
    }

    private void finalise(VideoEncodeParams parameters) {
        Utils.printTime("Start saving file: ");
        MP4MediaWriter mp4MediaWriter;
        DataSource aacDataSource;
        Track videoTrack;
        String outputVideoName;

        if (_aacSteganographyContainer != null) {
            _aacSteganographyContainer.writeRemainingSamples();
        }

        outputVideoName = "HushTalk_" + Utils.getCurrentDateAndTime() + ".mp4";
        parameters.setOutputFileName(outputVideoName);

        // Get modified AAC audio data source (with hidden data)
        aacDataSource = _aacSteganographyContainer.getDataSource();
        // Get original video track (preserved without modification)
        videoTrack = _mp4MediaReader.getVideoTrack();

        if (videoTrack != null) {
            // Use constructor that merges preserved video + modified audio
            mp4MediaWriter = new MP4MediaWriter(
                parameters.getDestinationVideoDirectory() + outputVideoName,
                videoTrack,
                aacDataSource
            );
        } else {
            // No video track found - this shouldn't happen for valid video files
            Log.w(TAG, "No video track found, creating audio-only file");
            mp4MediaWriter = new MP4MediaWriter(
                parameters.getDestinationVideoDirectory() + outputVideoName,
                (Track) null,
                aacDataSource
            );
        }
        mp4MediaWriter.create();
        mp4MediaWriter.cleanUpResources();

        _aacSteganographyContainer.cleanUpResources();
        Utils.printTime("End saving file: ");
    }
}






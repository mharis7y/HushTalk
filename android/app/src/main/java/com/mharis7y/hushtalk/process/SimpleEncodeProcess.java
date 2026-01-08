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
    private static final String H264_LSB1BIT_CONTAINER = "com.mharis7y.hushtalk.algorithms.steganography.video.H264SteganographyContainerLsb1Bit";
    
    private MP4MediaReader _mp4MediaReader;
    private ISteganographyContainer _h264SteganographyContainer;
    private ByteArrayInputStream _contentToHideStream;
    private byte[] _bytesToHide;
    private String _lastError;

    public SimpleEncodeProcess() {
        _mp4MediaReader = null;
        _h264SteganographyContainer = null;
        _contentToHideStream = null;
        _bytesToHide = null;
        _lastError = null;
    }

    public boolean encode(VideoEncodeParams parameters) {
        Utils.setStartTime();
        Log.i(TAG, "Start video encoding");
        _lastError = null;

        if (!this.init(parameters)) {
            return false;
        }

        // Hide data in video
        Log.i(TAG, "Hiding data in video");
        _h264SteganographyContainer.hideData(_bytesToHide);

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
               checkEnoughSpaceInVideo();
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
        // Always use LSB1Bit algorithm
        _h264SteganographyContainer = AlgorithmFactory.getSteganographyContainerInstanceFromName(H264_LSB1BIT_CONTAINER);
        if (_h264SteganographyContainer == null) {
            _lastError = "Unable to load H264 LSB1Bit steganography algorithm";
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

        _h264SteganographyContainer.setFileStreamDirectory(parameters.getDestinationVideoDirectory());

        if (!_h264SteganographyContainer.loadData(_mp4MediaReader)) {
            _lastError = "Unable to load video channel from original MP4";
            ErrorManager.getInstance().addErrorMessage(_lastError);
            return false;
        }
        return true;
    }

    private boolean checkEnoughSpaceInVideo() {
        if (_h264SteganographyContainer == null || _bytesToHide == null) {
            _lastError = "Steganography container or content not initialized";
            return false;
        }

        long videoSteganographyLength = _h264SteganographyContainer.getMaxContentToHide();
        int dataLength = _bytesToHide.length;

        if (videoSteganographyLength < dataLength) {
            _lastError = "Not enough space in video to hide data. Maximum: " + videoSteganographyLength + " bytes, Required: " + dataLength + " bytes";
            ErrorManager.getInstance().addErrorMessage(_lastError);
            Log.e(TAG, _lastError);
            return false;
        }
        return true;
    }

    private void finalise(VideoEncodeParams parameters) {
        Utils.printTime("Start saving file: ");
        MP4MediaWriter mp4MediaWriter;
        DataSource h264DataSource;
        Track audioTrack;
        String outputVideoName;

        if (_h264SteganographyContainer != null) {
            _h264SteganographyContainer.writeRemainingSamples();
        }

        outputVideoName = "HushTalk_" + Utils.getCurrentDateAndTime() + ".mp4";
        parameters.setOutputFileName(outputVideoName);

        h264DataSource = _h264SteganographyContainer.getDataSource();
        // Get original audio track if it exists (preserve it without modification)
        audioTrack = _mp4MediaReader.getAudioTrack();

        if (audioTrack != null) {
            // Use constructor that accepts Track object for audio preservation
            mp4MediaWriter = new MP4MediaWriter(
                parameters.getDestinationVideoDirectory() + outputVideoName,
                _mp4MediaReader.getTimescale(),
                (int) _mp4MediaReader.getDurationPerSample(),
                h264DataSource,
                audioTrack
            );
        } else {
            // No audio track, use constructor with null DataSource
            mp4MediaWriter = new MP4MediaWriter(
                parameters.getDestinationVideoDirectory() + outputVideoName,
                _mp4MediaReader.getTimescale(),
                (int) _mp4MediaReader.getDurationPerSample(),
                h264DataSource,
                (DataSource) null
            );
        }
        mp4MediaWriter.create();
        mp4MediaWriter.cleanUpResources();

        _h264SteganographyContainer.cleanUpResources();
        Utils.printTime("End saving file: ");
    }
}










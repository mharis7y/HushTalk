package com.mharis7y.hushtalk.parameters;

public class VideoEncodeParams {
    private String sourceVideoPath;
    private String textToHide;
    private String destinationVideoDirectory;
    private String outputFileName;

    public VideoEncodeParams(String sourceVideoPath, String textToHide, String destinationVideoDirectory) {
        this.sourceVideoPath = sourceVideoPath;
        this.textToHide = textToHide;
        this.destinationVideoDirectory = destinationVideoDirectory;
    }

    public String getSourceVideoPath() {
        return sourceVideoPath;
    }

    public void setSourceVideoPath(String sourceVideoPath) {
        this.sourceVideoPath = sourceVideoPath;
    }

    public String getTextToHide() {
        return textToHide;
    }

    public void setTextToHide(String textToHide) {
        this.textToHide = textToHide;
    }

    public String getDestinationVideoDirectory() {
        return destinationVideoDirectory;
    }

    public void setDestinationVideoDirectory(String destinationVideoDirectory) {
        this.destinationVideoDirectory = destinationVideoDirectory;
    }

    public String getOutputFileName() {
        return outputFileName;
    }

    public void setOutputFileName(String outputFileName) {
        this.outputFileName = outputFileName;
    }
}












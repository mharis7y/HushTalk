package com.mharis7y.hushtalk.algorithms;

import com.googlecode.mp4parser.DataSource;
import com.mharis7y.hushtalk.mp4.MP4MediaReader;

public interface ISteganographyContainer {

	public boolean loadData(MP4MediaReader mediaReader);
	public void writeRemainingSamples();

	public void hideData(byte[] content);
	public void unHideData();	
	
	public long getMaxContentToHide();
	public byte[] getUnHideData();
	public DataSource getDataSource();	
	public void setFileStreamDirectory(String directory);
	public String getFileStreamDirectory();
	
	public void cleanUpResources();
}

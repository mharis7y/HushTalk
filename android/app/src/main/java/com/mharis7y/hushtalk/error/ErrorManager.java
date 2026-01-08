package com.mharis7y.hushtalk.error;

import java.util.ArrayList;
import java.util.List;

public class ErrorManager {

	private static ErrorManager s_instance;
	
	public static ErrorManager getInstance() {
		if (s_instance == null) {
			s_instance = new ErrorManager();
		}
		return s_instance;
	}

	
	private List<String> _errorMessages;
	private List<Integer> _codeErrorMessages;
	
	private ErrorManager() {
		_errorMessages = new ArrayList<String>();
		_codeErrorMessages = new ArrayList<Integer>();
	}
	
	public void addErrorMessage(String message) {
		if (_errorMessages != null) {
			_errorMessages.add(message);
		}
	}
	
	public void addErrorMessage(int code) {
		if (_codeErrorMessages != null) {
			_codeErrorMessages.add(code);
		}
	}

	
	// Simplified - removed UI dependencies
	public void clearErrors() {
		if (_errorMessages != null) {
			_errorMessages.clear();
		}
		if (_codeErrorMessages != null) {
			_codeErrorMessages.clear();
		}
	}
	
}

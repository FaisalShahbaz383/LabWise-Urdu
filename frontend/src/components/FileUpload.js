import React, { useState, useRef } from 'react';
import ReportResult from './ReportResult';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'pdf'];
const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/pdf',
];

const FileUpload = ({ onUploadSuccess, onFileChange }) => {
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle' | 'uploading' | 'success' | 'error'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  const fileInputRef = useRef(null);

  // Format file size in human-readable units
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Client-side file validation
  const validateFile = (selectedFile) => {
    if (!selectedFile) return 'No file selected.';

    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    const isExtensionValid = ALLOWED_EXTENSIONS.includes(fileExtension);
    const isMimeValid = ALLOWED_MIME_TYPES.includes(selectedFile.type);

    if (!isExtensionValid && !isMimeValid) {
      return `Unsupported file format (.${fileExtension}). Only PNG, JPG, JPEG, and PDF files are accepted.`;
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      return `File size (${formatFileSize(selectedFile.size)}) exceeds the maximum allowed limit of 5MB.`;
    }

    return null;
  };

  // Set selected file and preview
  const handleFileSelection = (selectedFile) => {
    setErrorMessage('');
    const validationError = validateFile(selectedFile);

    if (validationError) {
      setErrorMessage(validationError);
      setFile(null);
      setFilePreview(null);
      setUploadStatus('idle');
      if (onFileChange) onFileChange(null);
      return;
    }

    setFile(selectedFile);
    if (onFileChange) onFileChange(selectedFile);
    setUploadStatus('idle');
    setSuccessResult(null);

    // Create thumbnail preview if image
    if (selectedFile.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(selectedFile);
      setFilePreview(previewUrl);
    } else {
      setFilePreview(null); // PDF file
    }
  };

  // Drag and drop events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  // File input change
  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  // Reset file selector
  const handleRemoveFile = () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setFile(null);
    setFilePreview(null);
    setUploadStatus('idle');
    setErrorMessage('');
    setSuccessResult(null);
    setUploadProgress(0);
    setUploadStage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onFileChange) {
      onFileChange(null);
    }
    if (onUploadSuccess) {
      onUploadSuccess(null);
    }
  };

  // Trigger file upload and OCR processing to backend
  const handleUpload = async () => {
    if (!file) {
      setErrorMessage('Please choose a file to upload first.');
      return;
    }

    setUploadStatus('uploading');
    setErrorMessage('');
    setUploadProgress(20);
    setUploadStage('Uploading report to secure server...');

    const formData = new FormData();
    formData.append('report', file);

    try {
      // Staged progress animation for upload + OCR + AI structuring
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 30 && prev < 60) {
            setUploadStage('Running OCR text extraction engine...');
            return prev + 10;
          }
          if (prev >= 60 && prev < 85) {
            setUploadStage('Analyzing biomarkers with Gemini AI...');
            return prev + 5;
          }
          if (prev >= 85 && prev < 95) {
            setUploadStage('Generating bilingual explanations (English + Urdu)...');
            return prev + 2;
          }
          if (prev >= 95) {
            clearInterval(progressTimer);
            return 95;
          }
          return prev + 15;
        });
      }, 400);

      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/reports/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      clearInterval(progressTimer);
      const data = await response.json();

      if (!response.ok || (data.success === false && !data.extractedText && !data.report?.extractedText)) {
        throw new Error(data.message || `Upload failed with status: ${response.status}`);
      }

      // 1. Ensure the frontend reads extractedText and analysis directly from any API response structure:
      const extractedText =
        data.extractedText ??
        data.report?.extractedText ??
        data.data?.extractedText ??
        data.data?.report?.extractedText ??
        '';

      const analysis =
        data.analysis ??
        data.report?.analysis ??
        data.data?.analysis ??
        data.data?.report?.analysis ??
        {};

      const reportId =
        data.reportId ??
        data._id ??
        data.report?._id ??
        data.report?.id ??
        data.data?.reportId ??
        data.data?._id ??
        '';

      const status =
        data.status ??
        data.report?.status ??
        data.data?.status ??
        (extractedText.trim().length > 0 ? 'completed' : 'failed');

      const ocrMethod =
        data.ocrMethod ??
        data.report?.ocrMethod ??
        data.data?.ocrMethod ??
        'pdf2json';

      const filePath =
        data.filePath ??
        data.report?.filePath ??
        data.data?.filePath ??
        '';

      const normalizedResult = {
        ...data,
        reportId,
        _id: reportId,
        status,
        extractedText,
        analysis,
        ocrMethod,
        filePath,
        report: {
          ...(data.report || data.data?.report || {}),
          _id: reportId,
          status,
          extractedText,
          analysis,
          filePath,
        },
      };

      // 2. Update React state immediately upon upload completion
      setUploadProgress(100);
      setUploadStage('Analysis & Explanations Complete!');
      setUploadStatus('success');
      setSuccessResult(normalizedResult);

      if (onUploadSuccess) {
        onUploadSuccess(normalizedResult);
      }
    } catch (err) {
      console.error('File upload & OCR error:', err);
      setUploadStatus('error');
      setErrorMessage(
        err.message ||
          'Failed to upload and process file. Please verify that the LabWise Urdu backend server is running.'
      );
    }
  };

  return (
    <div className="file-uploader-container">
      {/* If upload succeeded, show the comprehensive OCR Result Preview */}
      {uploadStatus === 'success' && successResult ? (
        <ReportResult result={successResult} onReset={handleRemoveFile} />
      ) : (
        <>
          {/* Dropzone container */}
          <div
            className={`dropzone-box ${isDragging ? 'dropzone-active' : ''} ${
              file ? 'dropzone-has-file' : ''
            }`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !file && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              id="medicalReportFileInput"
              className="file-hidden-input"
              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
              onChange={handleInputChange}
              disabled={uploadStatus === 'uploading'}
            />

            {!file ? (
              <div className="dropzone-idle-content">
                <div className="upload-icon-circle">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <h3 className="dropzone-title">
                  Drag &amp; Drop your Medical Report here
                </h3>
                <p className="dropzone-subtitle">
                  or <span className="browse-link">browse files</span> from your computer
                </p>
                <div className="file-requirements-badge">
                  <span>Supports: PDF, PNG, JPG, JPEG</span>
                  <span>•</span>
                  <span>Max file size: 5MB</span>
                </div>
              </div>
            ) : (
              <div className="file-selected-card" onClick={(e) => e.stopPropagation()}>
                <div className="file-card-header">
                  <div className="file-meta-wrapper">
                    {filePreview ? (
                      <div className="image-preview-wrapper">
                        <img
                          src={filePreview}
                          alt="Selected Report Preview"
                          className="image-thumbnail"
                        />
                      </div>
                    ) : (
                      <div className="pdf-icon-badge">
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                        <span>PDF</span>
                      </div>
                    )}
                    <div className="file-details">
                      <h4 className="file-name" title={file.name}>
                        {file.name}
                      </h4>
                      <p className="file-meta">
                        <span className="file-size">{formatFileSize(file.size)}</span>
                        <span className="file-type-pill">
                          {file.type || file.name.split('.').pop().toUpperCase()}
                        </span>
                      </p>
                    </div>
                  </div>

                  {uploadStatus !== 'uploading' && (
                    <button
                      type="button"
                      className="remove-file-btn"
                      onClick={handleRemoveFile}
                      title="Remove selected file"
                      aria-label="Remove selected file"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Uploading progress indicator */}
                {uploadStatus === 'uploading' && (
                  <div className="progress-section">
                    <div className="progress-bar-track">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <div className="progress-status-row">
                      <span className="progress-spinner"></span>
                      <span className="progress-text">
                        {uploadStage || `Processing (${uploadProgress}%)...`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error notification banner */}
          {errorMessage && (
            <div className="alert-box alert-error">
              <svg
                className="alert-icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div className="alert-content">
                <strong>Upload Error:</strong> {errorMessage}
              </div>
            </div>
          )}

          {/* Action upload button */}
          {file && (
            <div className="upload-action-row">
              <button
                type="button"
                className={`btn btn-primary ${
                  uploadStatus === 'uploading' ? 'btn-loading' : ''
                }`}
                onClick={handleUpload}
                disabled={uploadStatus === 'uploading'}
              >
                {uploadStatus === 'uploading' ? (
                  <>
                    <span className="btn-spinner"></span>
                    <span>Running OCR Extraction...</span>
                  </>
                ) : (
                  <>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>Upload &amp; Extract Text</span>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FileUpload;

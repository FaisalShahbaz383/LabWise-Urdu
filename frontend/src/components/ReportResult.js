import React, { useState } from 'react';

const ReportResult = ({ result, onReset }) => {
  const [copied, setCopied] = useState(false);
  const [selectedLang, setSelectedLang] = useState('urdu'); // 'urdu' | 'english'
  const [showRawText, setShowRawText] = useState(false);

  if (!result) return null;

  const payload = result && result.data ? result.data : result;
  const reportObj = payload.report || result.report || {};
  const analysisObj = payload.analysis || reportObj.analysis || result.analysis || {};

  // Extract text directly from top-level or nested report/data objects
  const textContent =
    payload.extractedText ??
    reportObj.extractedText ??
    result.extractedText ??
    '';

  const resolvedReportId =
    payload.reportId ||
    payload._id ||
    reportObj._id ||
    reportObj.id ||
    result.reportId ||
    result._id ||
    'N/A';

  const resolvedFilePath =
    payload.filePath ||
    reportObj.filePath ||
    result.filePath ||
    '';

  const resolvedFileName =
    reportObj.originalFileName ||
    payload.originalFileName ||
    result.originalFileName ||
    '';

  const ocrMethod =
    payload.ocrMethod ||
    reportObj.ocrMethod ||
    result.ocrMethod ||
    'pdf2json';

  const currentStatus =
    payload.status ||
    reportObj.status ||
    result.status ||
    (textContent.trim().length > 0 ? 'completed' : 'failed');

  // Analysis data
  const patientName = analysisObj.patientName || reportObj.patientName || '';
  const tests = Array.isArray(analysisObj.tests) ? analysisObj.tests : [];
  const explanationEnglish = analysisObj.explanationEnglish || '';
  const explanationUrdu = analysisObj.explanationUrdu || '';
  const disclaimer =
    analysisObj.disclaimer ||
    '⚠️ Educational tool only. Not a medical diagnosis. Always consult a certified physician.';

  // Metrics
  const charCount = textContent.length;
  const wordCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
  const lineCount = textContent ? textContent.split('\n').length : 0;
  const isSuccess = currentStatus === 'completed' && textContent.trim().length > 0;

  const abnormalCount = tests.filter(
    (t) => t.status === 'HIGH' || t.status === 'LOW'
  ).length;

  const handleCopyExplanation = async () => {
    const textToCopy =
      selectedLang === 'urdu' ? explanationUrdu : explanationEnglish;
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const getStatusBadge = (status) => {
    const normalized = (status || '').toUpperCase();
    if (normalized === 'HIGH') {
      return (
        <span className="test-status-badge test-status-high">
          <span className="status-arrow">▲</span> HIGH
        </span>
      );
    }
    if (normalized === 'LOW') {
      return (
        <span className="test-status-badge test-status-low">
          <span className="status-arrow">▼</span> LOW
        </span>
      );
    }
    if (normalized === 'NORMAL') {
      return (
        <span className="test-status-badge test-status-normal">
          <span className="status-check">✓</span> NORMAL
        </span>
      );
    }
    return (
      <span className="test-status-badge test-status-unknown">
        {normalized || 'UNKNOWN'}
      </span>
    );
  };

  return (
    <div className="report-result-card">
      {/* Header & Status Banner */}
      <div className="result-header">
        <div className="result-title-group">
          <div className="status-badges-row">
            {isSuccess ? (
              <span className="badge badge-success ocr-status-badge">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                AI Analysis &amp; Extraction Complete
              </span>
            ) : (
              <span className="badge badge-warning ocr-status-badge">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {currentStatus === 'failed'
                  ? 'Processing Incomplete'
                  : 'Extracted (Low Contrast / No Biomarkers)'}
              </span>
            )}

            <span className="badge badge-neutral method-badge">
              OCR: {ocrMethod} • AI: Gemini
            </span>

            {abnormalCount > 0 && (
              <span className="badge badge-warning attention-badge">
                ⚠️ {abnormalCount} Abnormal {abnormalCount === 1 ? 'Marker' : 'Markers'}
              </span>
            )}
          </div>

          <h3 className="result-heading">
            {patientName ? `Medical Summary: ${patientName}` : 'Diagnostic Report Analysis'}
          </h3>
          <p className="result-subheading">
            Structured clinical markers &amp; simplified bilingual explanations powered by LabWise Urdu.
          </p>
        </div>

        <div className="result-actions">
          {onReset && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onReset}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Upload Another</span>
            </button>
          )}
        </div>
      </div>

      {/* Report Metadata Grid */}
      <div className="result-meta-grid">
        <div className="meta-item">
          <span className="meta-item-label">Report ID</span>
          <span className="meta-item-value code-font">{resolvedReportId}</span>
        </div>
        {patientName && (
          <div className="meta-item">
            <span className="meta-item-label">Patient Name</span>
            <span className="meta-item-value highlight-patient">{patientName}</span>
          </div>
        )}
        {resolvedFileName && (
          <div className="meta-item">
            <span className="meta-item-label">Original Document</span>
            <span className="meta-item-value" title={resolvedFileName}>
              {resolvedFileName}
            </span>
          </div>
        )}
        {resolvedFilePath && (
          <div className="meta-item">
            <span className="meta-item-label">Server Path</span>
            <span className="meta-item-value code-font" title={resolvedFilePath}>
              {resolvedFilePath}
            </span>
          </div>
        )}
        <div className="meta-item">
          <span className="meta-item-label">Identified Tests</span>
          <span className="meta-item-value">
            {tests.length} markers ({abnormalCount} outside normal range)
          </span>
        </div>
      </div>

      {/* ======================================================================
          DAY 3: Bilingual AI Explanation Section with Urdu RTL Support
          ====================================================================== */}
      <div className="ai-explanation-card">
        <div className="explanation-header-row">
          <div className="explanation-title-group">
            <div className="explanation-tag">
              <span className="sparkle-icon">✨</span>
              <span>AI Bilingual Summary</span>
            </div>
            <h4 className="explanation-title">Patient-Friendly Report Explanation</h4>
          </div>

          {/* Bilingual Toggle Controls */}
          <div className="language-toggle-group" role="tablist">
            <button
              type="button"
              className={`lang-btn ${selectedLang === 'urdu' ? 'lang-btn-active' : ''}`}
              onClick={() => setSelectedLang('urdu')}
              role="tab"
              aria-selected={selectedLang === 'urdu'}
            >
              <span className="flag-icon">🇵🇰</span>
              <span>اردو خلاصہ</span>
            </button>
            <button
              type="button"
              className={`lang-btn ${selectedLang === 'english' ? 'lang-btn-active' : ''}`}
              onClick={() => setSelectedLang('english')}
              role="tab"
              aria-selected={selectedLang === 'english'}
            >
              <span className="flag-icon">🇬🇧</span>
              <span>English Summary</span>
            </button>
          </div>
        </div>

        {/* Dynamic Explanation Content Box */}
        <div
          className={`explanation-content-box ${
            selectedLang === 'urdu' ? 'urdu-view' : 'english-view'
          }`}
          dir={selectedLang === 'urdu' ? 'rtl' : 'ltr'}
        >
          {selectedLang === 'urdu' ? (
            <div className="urdu-explanation-text">
              {explanationUrdu ? (
                <p>{explanationUrdu}</p>
              ) : (
                <p className="placeholder-text">
                  اردو میں خلاصہ تیار کیا جا رہا ہے یا دستیاب نہیں ہے۔
                </p>
              )}
            </div>
          ) : (
            <div className="english-explanation-text">
              {explanationEnglish ? (
                <p>{explanationEnglish}</p>
              ) : (
                <p className="placeholder-text">
                  English summary is currently unavailable for this report.
                </p>
              )}
            </div>
          )}

          {/* Copy Explanation Toolbar */}
          <div className="explanation-actions-bar">
            <button
              type="button"
              className={`btn btn-secondary btn-sm ${copied ? 'btn-copied' : ''}`}
              onClick={handleCopyExplanation}
              title="Copy current explanation"
            >
              {copied ? (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{selectedLang === 'urdu' ? 'کاپی ہوگیا!' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>
                    {selectedLang === 'urdu' ? 'خلاصہ کاپی کریں' : 'Copy Explanation'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ⚠️ Prominent Medical Disclaimer Banner directly below AI summary */}
        <div className="safety-disclaimer-banner" role="alert">
          <div className="safety-disclaimer-icon">⚠️</div>
          <div className="safety-disclaimer-body">
            <strong>Medical Safety Disclaimer:</strong> {disclaimer}
          </div>
        </div>
      </div>

      {/* ======================================================================
          DAY 3: Structured Clinical Test Table
          ====================================================================== */}
      <div className="structured-tests-section">
        <div className="section-header-row">
          <div>
            <h4 className="section-title">Extracted Biomarkers &amp; Lab Values</h4>
            <p className="section-desc">
              Clinical measurements with normal reference intervals and health status flags.
            </p>
          </div>
          <span className="tests-count-pill">{tests.length} Parameters</span>
        </div>

        {tests.length > 0 ? (
          <div className="table-wrapper">
            <table className="medical-tests-table">
              <thead>
                <tr>
                  <th>Test Marker</th>
                  <th>Observed Value</th>
                  <th>Unit</th>
                  <th>Reference Range</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test, idx) => (
                  <tr
                    key={idx}
                    className={`test-row ${
                      test.status === 'HIGH'
                        ? 'row-high'
                        : test.status === 'LOW'
                        ? 'row-low'
                        : ''
                    }`}
                  >
                    <td className="test-name-cell">
                      <strong>{test.testName}</strong>
                    </td>
                    <td className="test-value-cell">
                      <span className="value-tag">{test.value || '—'}</span>
                    </td>
                    <td className="test-unit-cell">{test.unit || '—'}</td>
                    <td className="test-range-cell">{test.referenceRange || '—'}</td>
                    <td className="test-status-cell">{getStatusBadge(test.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-tests-card">
            <p>No individual laboratory tests were parsed from this document.</p>
            <p className="no-tests-sub">
              Check the raw extracted text below to verify file legibility.
            </p>
          </div>
        )}
      </div>

      {/* ======================================================================
          Collapsible Raw Extracted OCR Text Section
          ====================================================================== */}
      <div className="raw-text-collapsible-card">
        <button
          type="button"
          className="collapsible-toggle-btn"
          onClick={() => setShowRawText((prev) => !prev)}
        >
          <div className="toggle-label-group">
            <svg
              className={`toggle-arrow ${showRawText ? 'toggle-arrow-open' : ''}`}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="toggle-title">Raw Extracted OCR Text</span>
          </div>
          <span className="toggle-metrics">
            {wordCount} words • {charCount} chars • {lineCount} lines
          </span>
        </button>

        {showRawText && (
          <div className="extracted-text-container">
            {textContent ? (
              <pre className="extracted-text-body">{textContent}</pre>
            ) : (
              <div className="extracted-text-empty">
                <p className="empty-title">No raw text recorded for this report.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportResult;

import React, { useState } from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import ReportHistory from './components/ReportHistory';
import { AuthProvider } from './context/AuthContext';

function AppContent() {
  const [activeTab, setActiveTab] = useState('analyze'); // 'analyze' | 'history'
  const [selectedFile, setSelectedFile] = useState(null);
  const [latestReport, setLatestReport] = useState(null);

  const handleUploadSuccess = (data) => {
    setLatestReport(data);
  };

  // Stepper completion checks
  const isStep1Completed = Boolean(selectedFile || latestReport);

  const isStep2Completed = Boolean(
    latestReport &&
      ((latestReport.extractedText && latestReport.extractedText.trim().length > 0) ||
        (latestReport.report?.extractedText && latestReport.report.extractedText.trim().length > 0))
  );

  const isStep3Completed = Boolean(
    latestReport &&
      (latestReport.status === 'completed' ||
        latestReport.report?.status === 'completed' ||
        Boolean(
          latestReport.analysis &&
            (latestReport.analysis.explanationEnglish ||
              latestReport.analysis.explanationUrdu ||
              latestReport.analysis.tests?.length > 0)
        ) ||
        Boolean(
          latestReport.report?.analysis &&
            (latestReport.report.analysis.explanationEnglish ||
              latestReport.report.analysis.explanationUrdu ||
              latestReport.report.analysis.tests?.length > 0)
        ))
  );

  return (
    <div className="app-layout">
      {/* ⚠️ Prominent Medical Disclaimer Banner */}
      <div className="disclaimer-banner" role="alert">
        <div className="disclaimer-content">
          <span className="disclaimer-icon">⚠️</span>
          <span className="disclaimer-text">
            <strong>Medical Disclaimer:</strong> Educational tool only. Not a medical diagnosis. Always consult a certified physician.
          </span>
        </div>
      </div>

      {/* Main App Navigation Bar */}
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'analyze' ? (
        <>
          {/* Main Container Header */}
          <header className="app-header">
            <div className="header-inner">
              <div className="brand-badge">
                <span className="pulse-dot"></span>
              </div>
              <h1 className="app-title">LabWise Urdu</h1>
              <p className="app-subtitle">
                AI-driven diagnostic report reader. Upload blood tests, lab work, or imaging
                scans (PDF, PNG, JPG) to extract clinical biomarkers and receive simplified
                bilingual explanations in English and Urdu.
              </p>
            </div>
          </header>

          <main className="app-main">
            <div className="main-card">
              <div className="card-header">
                <div className="card-title-group">
                  <h2 className="card-title">Upload &amp; Analyze Lab Report</h2>
                  <p className="card-subtitle">
                    Select or drag a diagnostic document to trigger OCR extraction and Gemini bilingual structuring.
                  </p>
                </div>
                <div className="pipeline-pill">AI Engine: Active</div>
              </div>

              {/* Drag & Drop File Upload Component */}
              <FileUpload
                onUploadSuccess={handleUploadSuccess}
                onFileChange={setSelectedFile}
              />

              {/* Active Session Info */}
              {latestReport && (
                <div className="active-report-session">
                  <span className="session-indicator">● Active Document:</span>
                  <span className="session-id">
                    Report #{latestReport.reportId || (latestReport.report && latestReport.report._id)}
                  </span>
                  <span className="session-status-badge">
                    Status: {latestReport.status || (latestReport.report && latestReport.report.status)}
                  </span>
                </div>
              )}

              {/* Workflow Steps Guide */}
              <div className="workflow-steps">
                <div className={`step-card ${isStep1Completed ? 'step-card-completed' : ''}`}>
                  <div className="step-number">{isStep1Completed ? '✓' : '1'}</div>
                  <div className="step-body">
                    <h4 className="step-title">1. File Pipeline</h4>
                    <p className="step-desc">
                      Validated &amp; stored securely via Multer &amp; MongoDB Atlas schema.
                    </p>
                  </div>
                </div>

                <div className={`step-card ${isStep2Completed ? 'step-card-completed' : ''}`}>
                  <div className="step-number">{isStep2Completed ? '✓' : '2'}</div>
                  <div className="step-body">
                    <h4 className="step-title">2. OCR Extraction</h4>
                    <p className="step-desc">
                      Pure JS pdf2json &amp; Tesseract.js extract clinical text from documents.
                    </p>
                  </div>
                </div>

                <div className={`step-card ${isStep3Completed ? 'step-card-completed' : ''}`}>
                  <div className="step-number">{isStep3Completed ? '✓' : '3'}</div>
                  <div className="step-body">
                    <h4 className="step-title">3. Bilingual AI Insights</h4>
                    <p className="step-desc">
                      {isStep3Completed
                        ? 'Gemini LLM structured biomarkers with simplified English & Urdu summaries.'
                        : 'Gemini LLM structures biomarkers with simplified English & Urdu summaries.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </>
      ) : (
        <main className="app-main">
          <ReportHistory onNavigateToUpload={() => setActiveTab('analyze')} />
        </main>
      )}

      {/* Authentication Modal */}
      <AuthModal />

      {/* App Footer */}
      <footer className="app-footer">
        <p>
          LabWise Urdu • AI Medical Report Explainer • Built with React, Express, pdf2json, Gemini &amp; MongoDB
        </p>
        <p className="footer-subtext">
          Designed for educational health literacy. Confidential documents are processed locally and securely.
        </p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

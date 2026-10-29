import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import ReportResult from './ReportResult';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ReportHistory = ({ onNavigateToUpload }) => {
  const { token, isAuthenticated, openAuthModal } = useAuth();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchReports = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/my-history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch report history.');
      }

      setReports(Array.isArray(data.reports) ? data.reports : []);
    } catch (err) {
      console.error('History fetch error:', err);
      setError(err.message || 'Could not load your report history.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchReports();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, fetchReports]);

  const handleDelete = async (e, reportId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this medical report from your history?')) {
      return;
    }

    setDeletingId(reportId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete report.');
      }

      setReports((prev) => prev.filter((r) => (r._id || r.id) !== reportId));
      if (selectedReport && (selectedReport._id === reportId || selectedReport.reportId === reportId)) {
        setSelectedReport(null);
      }
    } catch (err) {
      alert(err.message || 'Error deleting report.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recent';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // If user selected a report to inspect, render the full ReportResult with a "Back to History" button
  if (selectedReport) {
    return (
      <div className="history-detail-container">
        <div className="history-detail-nav">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setSelectedReport(null)}
          >
            ← Back to All Reports
          </button>
          <span className="history-viewing-tag">Viewing Historical Report</span>
        </div>

        <ReportResult
          result={selectedReport}
          onReset={() => setSelectedReport(null)}
        />
      </div>
    );
  }

  // Guest view: prompt to authenticate
  if (!isAuthenticated) {
    return (
      <div className="history-card-wrapper">
        <div className="auth-prompt-card">
          <div className="auth-prompt-icon">📋</div>
          <h3 className="auth-prompt-title">Sign in to View Report History</h3>
          <p className="auth-prompt-desc">
            Keep an organized record of all your diagnostic tests, track biological
            markers across time, and access your bilingual Urdu/English explanations
            from any device.
          </p>
          <div className="auth-prompt-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => openAuthModal('login')}
            >
              Sign In to Your Account
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => openAuthModal('register')}
            >
              Create Free Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="history-card-wrapper">
      <div className="history-header-row">
        <div>
          <h2 className="history-main-title">My Diagnostic Reports</h2>
          <p className="history-subtitle">
            Saved laboratory tests, OCR extractions, and bilingual AI summaries.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={fetchReports}
          disabled={loading}
          title="Refresh history list"
        >
          {loading ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {error && (
        <div className="alert-box alert-error">
          <span>⚠️ {error}</span>
        </div>
      )}

      {loading ? (
        <div className="history-loading-box">
          <div className="progress-spinner"></div>
          <p>Loading your medical report history...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="history-empty-card">
          <div className="empty-icon">📂</div>
          <h4 className="empty-title">No reports saved yet</h4>
          <p className="empty-desc">
            When you upload blood tests, pathology labs, or radiology reports while logged in,
            they will automatically be cataloged here for future reference.
          </p>
          {onNavigateToUpload && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onNavigateToUpload}
            >
              Upload Your First Report
            </button>
          )}
        </div>
      ) : (
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Date &amp; Time</th>
                <th>Patient Name</th>
                <th>File Document</th>
                <th>Biomarkers Flagged</th>
                <th>Pipeline Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => {
                const reportId = report._id || report.id;
                const analysis = report.analysis || {};
                const tests = Array.isArray(analysis.tests) ? analysis.tests : [];
                const abnormalCount = tests.filter(
                  (t) => t.status === 'HIGH' || t.status === 'LOW'
                ).length;
                const patient = analysis.patientName || 'Not specified';

                return (
                  <tr
                    key={reportId}
                    className="history-row"
                    onClick={() => setSelectedReport(report)}
                  >
                    <td className="history-date-cell">
                      {formatDate(report.createdAt)}
                    </td>
                    <td className="history-patient-cell">
                      <strong>{patient}</strong>
                    </td>
                    <td className="history-file-cell" title={report.originalFileName}>
                      <span className="file-name-text">
                        {report.originalFileName}
                      </span>
                    </td>
                    <td className="history-markers-cell">
                      {tests.length > 0 ? (
                        abnormalCount > 0 ? (
                          <span className="badge badge-warning">
                            ⚠️ {abnormalCount} Abnormal
                          </span>
                        ) : (
                          <span className="badge badge-success">
                            ✓ All in Range
                          </span>
                        )
                      ) : (
                        <span className="badge badge-neutral">—</span>
                      )}
                    </td>
                    <td className="history-status-cell">
                      <span
                        className={`badge ${
                          report.status === 'completed'
                            ? 'badge-success'
                            : report.status === 'failed'
                            ? 'badge-warning'
                            : 'badge-neutral'
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="history-action-cell text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedReport(report)}
                      >
                        View Analysis
                      </button>
                      <button
                        type="button"
                        className="btn-delete-report"
                        onClick={(e) => handleDelete(e, reportId)}
                        disabled={deletingId === reportId}
                        title="Delete report"
                      >
                        {deletingId === reportId ? '...' : '🗑️'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReportHistory;

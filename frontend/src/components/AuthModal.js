import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const AuthModal = ({ onNavigateTab, onShowToast }) => {
  const {
    authModalOpen,
    authModalTab,
    setAuthModalTab,
    closeAuthModal,
    login,
    register,
  } = useAuth();

  const [loginMode, setLoginMode] = useState('user'); // 'user' | 'admin'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!authModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      if (authModalTab === 'register') {
        if (!name.trim()) {
          throw new Error('Please enter your full name.');
        }
        await register(name, email, password);
      } else {
        const result = await login(email, password);
        const loggedInRole = result?.user?.role;

        if (loginMode === 'admin') {
          if (loggedInRole === 'admin') {
            if (onNavigateTab) {
              onNavigateTab('admin');
            }
          } else {
            if (onShowToast) {
              onShowToast('Logged in successfully as standard user.');
            }
          }
        }
      }
      // Reset fields
      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const switchTab = (tab) => {
    setErrorMsg('');
    setAuthModalTab(tab);
    if (tab === 'register') {
      setLoginMode('user');
    }
  };

  return (
    <div className="modal-backdrop" onClick={closeAuthModal}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-tabs">
            <button
              type="button"
              className={`modal-tab-btn ${authModalTab === 'login' ? 'active' : ''}`}
              onClick={() => switchTab('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`modal-tab-btn ${authModalTab === 'register' ? 'active' : ''}`}
              onClick={() => switchTab('register')}
            >
              Create Account
            </button>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={closeAuthModal}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Subtle Role Mode Switcher (Visible in Login tab) */}
          {authModalTab === 'login' && (
            <div className="auth-role-switcher-container">
              <div className="auth-role-switcher">
                <button
                  type="button"
                  className={`role-switch-btn ${loginMode === 'user' ? 'role-switch-active' : ''}`}
                  onClick={() => {
                    setLoginMode('user');
                    setErrorMsg('');
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginRight: '5px' }}
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  User Login
                </button>
                <button
                  type="button"
                  className={`role-switch-btn role-switch-admin ${
                    loginMode === 'admin' ? 'role-switch-active' : ''
                  }`}
                  onClick={() => {
                    setLoginMode('admin');
                    setErrorMsg('');
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginRight: '5px' }}
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Admin Login
                </button>
              </div>
            </div>
          )}

          {/* Intro Header */}
          <div className="modal-intro">
            <h3 className="modal-title">
              {authModalTab === 'register'
                ? 'Join LabWise Urdu'
                : loginMode === 'admin'
                ? 'Admin Portal Sign In'
                : 'Welcome Back'}
            </h3>
            <p className="modal-subtitle">
              {authModalTab === 'register'
                ? 'Create a free account to automatically save your lab reports and track your medical history.'
                : loginMode === 'admin'
                ? 'Sign in to access system administration, user management, and global reports.'
                : 'Sign in to access your past diagnostic reports and AI health insights.'}
            </p>
          </div>

          {/* Admin Hint Banner */}
          {authModalTab === 'login' && loginMode === 'admin' && (
            <div className="admin-login-hint-banner">
              <span className="hint-shield-icon">🛡️</span>
              <span>Administrator access requires elevated account credentials.</span>
            </div>
          )}

          {errorMsg && (
            <div className="alert-box alert-error modal-alert">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {authModalTab === 'register' && (
              <div className="form-group">
                <label htmlFor="authNameInput" className="form-label">
                  Full Name
                </label>
                <input
                  id="authNameInput"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Dr. Sarah Khan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={authModalTab === 'register'}
                  disabled={submitting}
                  autoFocus
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="authEmailInput" className="form-label">
                Email Address
              </label>
              <input
                id="authEmailInput"
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="authPasswordInput" className="form-label">
                Password
              </label>
              <input
                id="authPasswordInput"
                type="password"
                className="form-input"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={submitting}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="btn-spinner"></span>
                  <span>
                    {authModalTab === 'register'
                      ? 'Creating Account...'
                      : loginMode === 'admin'
                      ? 'Verifying Admin Credentials...'
                      : 'Signing In...'}
                  </span>
                </>
              ) : (
                <span>
                  {authModalTab === 'register'
                    ? 'Register & Save Reports'
                    : loginMode === 'admin'
                    ? 'Sign In as Administrator'
                    : 'Sign In to Dashboard'}
                </span>
              )}
            </button>
          </form>

          <div className="modal-footer-switch">
            {authModalTab === 'register' ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  className="text-link-btn"
                  onClick={() => switchTab('login')}
                >
                  Sign in here
                </button>
              </p>
            ) : (
              <p>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  className="text-link-btn"
                  onClick={() => switchTab('register')}
                >
                  Create one now
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const AuthModal = () => {
  const {
    authModalOpen,
    authModalTab,
    setAuthModalTab,
    closeAuthModal,
    login,
    register,
  } = useAuth();

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
        await login(email, password);
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
          <div className="modal-intro">
            <h3 className="modal-title">
              {authModalTab === 'register'
                ? 'Join LabWise Urdu'
                : 'Welcome Back'}
            </h3>
            <p className="modal-subtitle">
              {authModalTab === 'register'
                ? 'Create a free account to automatically save your lab reports and track your medical history.'
                : 'Sign in to access your past diagnostic reports and AI health insights.'}
            </p>
          </div>

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
                      : 'Signing In...'}
                  </span>
                </>
              ) : (
                <span>
                  {authModalTab === 'register'
                    ? 'Register & Save Reports'
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

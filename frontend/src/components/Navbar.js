import React from 'react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ activeTab, onTabChange }) => {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();

  return (
    <nav className="app-navbar">
      <div className="navbar-container">
        {/* Brand Brand Identity */}
        <div className="navbar-brand" onClick={() => onTabChange('analyze')}>
          <div className="brand-logo-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span className="brand-name">LabWise Urdu</span>
          <span className="brand-version-badge">Bilingual AI</span>
        </div>

        {/* Navigation Tabs */}
        <div className="navbar-nav-links">
          <button
            type="button"
            className={`nav-link-btn ${activeTab === 'analyze' ? 'nav-link-active' : ''}`}
            onClick={() => onTabChange('analyze')}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            <span>Analyze Report</span>
          </button>

          <button
            type="button"
            className={`nav-link-btn ${activeTab === 'history' ? 'nav-link-active' : ''}`}
            onClick={() => onTabChange('history')}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>My Reports History</span>
          </button>
        </div>

        {/* User Auth Actions */}
        <div className="navbar-auth-actions">
          {isAuthenticated ? (
            <div className="user-profile-badge">
              <div className="user-avatar-circle">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="user-display-name">{user?.name}</span>
              <button
                type="button"
                className="btn-logout"
                onClick={logout}
                title="Sign out of account"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="auth-button-group">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => openAuthModal('login')}
              >
                Login
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => openAuthModal('register')}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

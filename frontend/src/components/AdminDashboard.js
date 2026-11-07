import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AdminDashboard = ({ onNavigateToUpload }) => {
  const { user: currentUser, token, isAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all registered users
  const fetchUsers = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch registered users.');
      }

      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      console.error('Admin users fetch error:', err);
      setError(err.message || 'Failed to load user list.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [isAdmin, fetchUsers]);

  // Handle role modification
  const handleRoleChange = async (targetUserId, newRole) => {
    if (!targetUserId || !newRole) return;

    // Optional confirmation when demoting yourself
    if (
      (currentUser?._id === targetUserId || currentUser?.id === targetUserId) &&
      newRole !== 'admin'
    ) {
      const confirmSelfDemote = window.confirm(
        'Warning: You are about to remove admin privileges from your own account. Proceed?'
      );
      if (!confirmSelfDemote) return;
    }

    setUpdatingId(targetUserId);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/users/${targetUserId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update user role.');
      }

      // Update state locally immediately
      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          const uId = u._id || u.id;
          return uId === targetUserId ? { ...u, role: newRole } : u;
        })
      );

      setSuccessMessage(data.message || `User role successfully updated to ${newRole}.`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Role update error:', err);
      setError(err.message || 'Could not update user role.');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // If user is not an admin, block view
  if (!isAdmin) {
    return (
      <div className="admin-access-denied-card">
        <div className="access-denied-icon">🔒</div>
        <h2>Access Restricted</h2>
        <p>You require administrator privileges to view and manage user accounts.</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onNavigateToUpload}
        >
          Return to Lab Analyzer
        </button>
      </div>
    );
  }

  // Filter users by search term
  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    const nameMatch = u.name?.toLowerCase().includes(q);
    const emailMatch = u.email?.toLowerCase().includes(q);
    const roleMatch = u.role?.toLowerCase().includes(q);
    return nameMatch || emailMatch || roleMatch;
  });

  const totalAdmins = users.filter((u) => u.role === 'admin').length;
  const totalStandardUsers = users.filter((u) => u.role === 'user' || !u.role).length;

  return (
    <div className="admin-dashboard-container">
      {/* Top Header */}
      <div className="admin-header-card">
        <div className="admin-header-title-group">
          <div className="admin-badge-icon">
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
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <h2 className="admin-title">Admin Management Console</h2>
            <p className="admin-subtitle">
              Manage system users, oversee access control, and adjust role permissions.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={fetchUsers}
          disabled={loading}
          title="Refresh user list"
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
            style={{ marginRight: '6px' }}
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Metrics Row */}
      <div className="admin-metrics-grid">
        <div className="admin-metric-card">
          <div className="metric-icon-box metric-total">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="metric-data">
            <span className="metric-label">Total Registered</span>
            <span className="metric-value">{users.length}</span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="metric-icon-box metric-admin">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div className="metric-data">
            <span className="metric-label">Administrators</span>
            <span className="metric-value">{totalAdmins}</span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="metric-icon-box metric-user">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="7" r="4" />
              <path d="M5.5 21a8.38 8.38 0 0 1 13 0" />
            </svg>
          </div>
          <div className="metric-data">
            <span className="metric-label">Standard Users</span>
            <span className="metric-value">{totalStandardUsers}</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="admin-alert admin-alert-success" role="alert">
          <span className="alert-icon">✓</span>
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="admin-alert admin-alert-error" role="alert">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Main Table Card */}
      <div className="admin-table-card">
        <div className="admin-table-toolbar">
          <div className="admin-search-box">
            <svg
              className="admin-search-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-search-input"
            />
            {searchTerm && (
              <button
                type="button"
                className="admin-search-clear"
                onClick={() => setSearchTerm('')}
              >
                ×
              </button>
            )}
          </div>
          <div className="admin-user-count">
            Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> accounts
          </div>
        </div>

        {loading ? (
          <div className="admin-loading-state">
            <div className="spinner"></div>
            <p>Loading user accounts...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="admin-empty-state">
            <div className="empty-icon">👥</div>
            <h3>No users found</h3>
            <p>
              {searchTerm
                ? 'No registered users match your search query.'
                : 'There are currently no registered users in the database.'}
            </p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Email Address</th>
                  <th>Joined Date</th>
                  <th>Current Role</th>
                  <th style={{ textAlign: 'right' }}>Manage Role</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const uId = u._id || u.id;
                  const isCurrent = currentUser?._id === uId || currentUser?.id === uId;
                  const isUpdating = updatingId === uId;
                  const userRole = u.role || 'user';

                  return (
                    <tr key={uId} className={isCurrent ? 'current-user-row' : ''}>
                      <td>
                        <div className="user-table-profile">
                          <div
                            className={`user-avatar-pill ${
                              userRole === 'admin' ? 'avatar-admin' : 'avatar-user'
                            }`}
                          >
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="user-name-box">
                            <span className="user-name-text">{u.name || 'Unnamed User'}</span>
                            {isCurrent && <span className="you-badge">You</span>}
                          </div>
                        </div>
                      </td>

                      <td className="user-email-cell">
                        <span>{u.email}</span>
                      </td>

                      <td className="user-date-cell">
                        <span>{formatDate(u.createdAt)}</span>
                      </td>

                      <td>
                        <span
                          className={`role-badge ${
                            userRole === 'admin' ? 'role-badge-admin' : 'role-badge-user'
                          }`}
                        >
                          {userRole === 'admin' ? '★ Admin' : 'User'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div className="role-action-controls">
                          <select
                            className="role-select-dropdown"
                            value={userRole}
                            disabled={isUpdating}
                            onChange={(e) => handleRoleChange(uId, e.target.value)}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>

                          <button
                            type="button"
                            className={`btn-role-toggle ${
                              userRole === 'admin' ? 'btn-demote' : 'btn-promote'
                            }`}
                            disabled={isUpdating}
                            onClick={() =>
                              handleRoleChange(uId, userRole === 'admin' ? 'user' : 'admin')
                            }
                            title={
                              userRole === 'admin'
                                ? 'Demote to regular user'
                                : 'Promote to administrator'
                            }
                          >
                            {isUpdating ? (
                              <span className="btn-spinner"></span>
                            ) : userRole === 'admin' ? (
                              'Demote'
                            ) : (
                              'Make Admin'
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const TOKEN_KEY = 'labwise_auth_token';
const USER_KEY = 'labwise_auth_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(USER_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem(TOKEN_KEY) || null;
  });

  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'register'

  // Open modal with specific tab
  const openAuthModal = (tab = 'login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  // Verify and fetch latest user profile on mount
  const fetchCurrentUser = useCallback(async (authToken) => {
    if (!authToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();
      if (response.ok && data.success && data.user) {
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      } else {
        // Token expired or invalid
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      console.warn('[AuthContext] Verification failed or network error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const existingToken = localStorage.getItem(TOKEN_KEY);
    if (existingToken) {
      fetchCurrentUser(existingToken);
    } else {
      setLoading(false);
    }
  }, [fetchCurrentUser]);

  // Login handler
  const login = async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Login failed. Please check your credentials.');
    }

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    closeAuthModal();
    return data;
  };

  // Register handler
  const register = async (name, email, password) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Registration failed.');
    }

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    closeAuthModal();
    return data;
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    loading,
    login,
    register,
    logout,
    authModalOpen,
    authModalTab,
    openAuthModal,
    closeAuthModal,
    setAuthModalTab,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

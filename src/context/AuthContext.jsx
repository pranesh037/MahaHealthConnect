import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentRole, setCurrentRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore authenticated session from backend JWT on app initialization
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('mhc_access_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.me();
        if (res && res.user && res.user.role) {
          setCurrentUser(res.user);
          setCurrentRole(res.user.role);
        } else {
          localStorage.removeItem('mhc_access_token');
          setCurrentRole(null);
          setCurrentUser(null);
        }
      } catch (err) {
        console.warn('Session restoration failed or token expired:', err.message);
        localStorage.removeItem('mhc_access_token');
        setCurrentRole(null);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const loginAsUser = async (username, password, selectedRole) => {
    try {
      const result = await api.login({
        username,
        password,
        role: selectedRole
      });

      localStorage.setItem('mhc_access_token', result.token);
      window.dispatchEvent(new Event('mhc-auth-changed'));

      setCurrentRole(result.user.role);
      setCurrentUser(result.user);

      return { success: true, user: result.user, role: result.user.role };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  };

  const registerUser = async (payload) => {
    try {
      const result = await api.register(payload);

      localStorage.setItem('mhc_access_token', result.token);
      window.dispatchEvent(new Event('mhc-auth-changed'));

      setCurrentRole(result.user.role);
      setCurrentUser(result.user);

      return { success: true, user: result.user, role: result.user.role };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  };

  const logout = async () => {
    try {
      if (localStorage.getItem('mhc_access_token')) await api.logout();
    } catch {
      // Clear local session even if network fails
    }
    localStorage.removeItem('mhc_access_token');
    setCurrentRole(null);
    setCurrentUser(null);
    window.dispatchEvent(new Event('mhc-auth-changed'));
  };

  return (
    <AuthContext.Provider
      value={{
        role: currentRole,
        user: currentUser,
        loading,
        loginAsUser,
        registerUser,
        logout,
        isAuthenticated: !!currentRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

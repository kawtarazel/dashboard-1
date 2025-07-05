import React, { createContext, useContext, useState, useEffect, use } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user_role, setUserRole] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Fetch user profile if token exists
      authApi.getProfile()
        .then(profile => {
          setUser(profile);
        })
        .catch(() => {
          setUser(null);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Function to fetch user role
  const fetchUserRole = async (id) => {
    try {
      const role = await authApi.getUserRole(id);
      setUserRole(role['role'].name);
    } catch (error) {
      console.error('Failed to fetch user role:', error);
    }
  };

  const login = async (email, password) => {
    try {
      const data = await authApi.login(email, password);
      localStorage.setItem('accessToken', data.access_token);
      localStorage.setItem('refreshToken', data.refresh_token);
      const profile = await authApi.getProfile();
      setUser(profile);
      return profile;
    } catch (error) {
      // Check for custom error from backend
      if (
        error?.response?.data?.detail === 'Please verify your email before logging in.'
      ) {
        throw new Error('EMAIL_NOT_VERIFIED');
      }
      throw error;
    }
  };

  const signup = async (email, username, password) => {
    try {
      await authApi.signup(email, username, password);
      console.log('Signup successful, logging in...');
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        signup,
        logout,
        fetchUserRole,
        user_role
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Store JWT token strictly in React memory/state (not localStorage)
  const [token, setToken] = useState(null);
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Configure global Axios interceptor for memory-stored JWT
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (err) => Promise.reject(err)
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, [token]);

  // Send OTP handler
  const sendOtp = async (mobile) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/auth/send-otp', { mobile });
      setLoading(false);
      return res.data;
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Failed to send OTP. Please try again.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Verify OTP handler
  const verifyOtp = async (mobile, otp) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/auth/verify-otp', { mobile, otp });
      const { token: jwtToken, worker: workerData, isNewWorker } = res.data;

      // Store in memory
      setToken(jwtToken);
      setWorker(workerData);
      setLoading(false);

      return { isNewWorker, worker: workerData };
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Invalid or expired OTP.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const logout = () => {
    setToken(null);
    setWorker(null);
    setError(null);
  };

  const value = useMemo(
    () => ({
      token,
      worker,
      loading,
      error,
      isAuthenticated: Boolean(token && worker),
      sendOtp,
      verifyOtp,
      logout,
      setWorker
    }),
    [token, worker, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { auth, googleProvider } from '../config/firebase';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Store JWT token strictly in React memory/state
  const [token, setToken] = useState(null);
  const [worker, setWorker] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
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

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Google Login via Firebase Popup
  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      setFirebaseUser(user);

      // Exchange with backend to obtain session JWT and worker profile
      const res = await axios.post('/api/auth/google-login', {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        uid: user.uid,
      });

      const { token: jwtToken, worker: workerData, isNewWorker } = res.data;

      setToken(jwtToken);
      setWorker(workerData);
      setLoading(false);

      return { isNewWorker, worker: workerData, user };
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || err.message || 'Google authentication failed';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Log out handler
  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('[Firebase SignOut]:', e);
    }
    setToken(null);
    setWorker(null);
    setFirebaseUser(null);
    setError(null);
  };

  const value = useMemo(
    () => ({
      token,
      worker,
      firebaseUser,
      loading,
      error,
      isAuthenticated: Boolean(token && worker),
      loginWithGoogle,
      logout,
      setWorker
    }),
    [token, worker, firebaseUser, loading, error]
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

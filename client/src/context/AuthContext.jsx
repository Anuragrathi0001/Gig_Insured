import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { auth, googleProvider } from '../config/firebase';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialize state from localStorage so page refreshes never drop session
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('gig_token') || null;
    } catch {
      return null;
    }
  });

  const [worker, setWorkerState] = useState(() => {
    try {
      const stored = localStorage.getItem('gig_worker');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const setWorker = (workerData) => {
    setWorkerState(workerData);
    if (workerData) {
      localStorage.setItem('gig_worker', JSON.stringify(workerData));
    } else {
      localStorage.removeItem('gig_worker');
    }
  };

  // Configure global Axios interceptor for JWT authorization header
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const activeToken = token || localStorage.getItem('gig_token');
        if (activeToken) {
          config.headers.Authorization = `Bearer ${activeToken}`;
        }
        return config;
      },
      (err) => Promise.reject(err)
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, [token]);

  // Listen to Firebase Auth state changes and restore session on page reload
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);

      if (currentUser) {
        // If we already have stored token and worker, optionally refresh from /api/auth/me
        const storedToken = localStorage.getItem('gig_token');
        if (storedToken) {
          try {
            const meRes = await axios.get('/api/auth/me', {
              headers: { Authorization: `Bearer ${storedToken}` }
            });
            if (meRes.data?.worker) {
              setWorkerState(meRes.data.worker);
              localStorage.setItem('gig_worker', JSON.stringify(meRes.data.worker));
            }
          } catch (e) {
            console.warn('[AuthContext] Session verify failed, re-authenticating with backend:', e);
            // Re-authenticate with backend seamlessly
            try {
              const res = await axios.post('/api/auth/google-login', {
                email: currentUser.email,
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL,
                uid: currentUser.uid,
              });
              setToken(res.data.token);
              setWorkerState(res.data.worker);
              localStorage.setItem('gig_token', res.data.token);
              localStorage.setItem('gig_worker', JSON.stringify(res.data.worker));
            } catch (err) {
              console.error('[AuthContext] Re-auth failed:', err);
            }
          }
        } else {
          // No token in localStorage, exchange Firebase user with backend
          try {
            const res = await axios.post('/api/auth/google-login', {
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              uid: currentUser.uid,
            });
            setToken(res.data.token);
            setWorkerState(res.data.worker);
            localStorage.setItem('gig_token', res.data.token);
            localStorage.setItem('gig_worker', JSON.stringify(res.data.worker));
          } catch (err) {
            console.error('[AuthContext] Firebase exchange error:', err);
          }
        }
      } else {
        // Firebase user is null
        const storedToken = localStorage.getItem('gig_token');
        if (!storedToken) {
          setToken(null);
          setWorkerState(null);
        }
      }

      setLoading(false);
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
      setWorkerState(workerData);
      localStorage.setItem('gig_token', jwtToken);
      localStorage.setItem('gig_worker', JSON.stringify(workerData));
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
    localStorage.removeItem('gig_token');
    localStorage.removeItem('gig_worker');
    setToken(null);
    setWorkerState(null);
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

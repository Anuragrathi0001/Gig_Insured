import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCk7f_jYZo1WlMow-2UGfSO2FYlCaF6ZHQ",
  authDomain: "gig-insure.firebaseapp.com",
  projectId: "gig-insure",
  storageBucket: "gig-insure.firebasestorage.app",
  messagingSenderId: "697312983633",
  appId: "1:697312983633:web:d59da4a9b1b634e9cad670",
  measurementId: "G-CH2NP2VYG3"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Auth & Providers
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Analytics if supported
export let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export default app;

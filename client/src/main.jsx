import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from './App.jsx';
import './index.css';

// Set global Axios base URL for Vercel/production deployment
const envUrl = import.meta.env.VITE_API_URL;
const isProd = import.meta.env.PROD || !import.meta.env.DEV;

let backendUrl = 'https://gig-insured.onrender.com';

if (!isProd) {
  const currentHost = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? window.location.hostname
    : 'localhost';
  backendUrl = envUrl ? envUrl.replace('localhost', currentHost) : `http://${currentHost}:5001`;
} else if (envUrl && !envUrl.includes('localhost')) {
  backendUrl = envUrl;
}

axios.defaults.baseURL = backendUrl;
console.log('[Gig Insured API Target]:', axios.defaults.baseURL);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

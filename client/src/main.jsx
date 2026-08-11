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
  backendUrl = envUrl || 'http://localhost:5000';
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

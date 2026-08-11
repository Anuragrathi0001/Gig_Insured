import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from './App.jsx';
import './index.css';

// Set global Axios base URL for Vercel/production deployment
const defaultBackendUrl = import.meta.env.DEV
  ? 'http://localhost:5000'
  : 'https://gig-insured.onrender.com';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || defaultBackendUrl;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

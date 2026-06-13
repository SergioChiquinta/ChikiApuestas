import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ToastProvider } from './context/ToastContext';
import 'flag-icons/css/flag-icons.min.css';
import './styles/index.css';
import './styles/enhancements.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);

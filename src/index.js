import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      <Toaster
        position="top-center" // <-- THIS IS THE CHANGE
        toastOptions={{
          // Define default options
          className: '',
          duration: 5000,
          style: {
            background: '#1F2937',
            color: '#F9FAFB',
            border: '1px solid #4B5563',
          },
          // Default options for specific types
          success: {
            duration: 4000,
            iconTheme: {
              primary: '#34D399',
              secondary: '#1F2937',
            },
          },
          error: {
            iconTheme: {
                primary: '#F87171',
                secondary: '#1F2937',
            },
          }
        }}
      />
    </AuthProvider>
  </React.StrictMode>
);
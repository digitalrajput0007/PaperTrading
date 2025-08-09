import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppShell from './AppShell'; // Import the AppShell component

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    // A more visually appealing loading state
    return (
      <div className="flex items-center justify-center min-h-screen bg-primary text-text-primary">
        <svg className="animate-spin h-8 w-8 text-secondary mr-3" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading Application...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If the user is logged in, render the children inside the AppShell
  return <AppShell>{children}</AppShell>;
};

export default ProtectedRoute;

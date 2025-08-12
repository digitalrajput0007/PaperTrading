import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppShell from './AppShell';

const AdminRoute = ({ children }) => {
    const { currentUser, userData, loading } = useAuth();

    if (loading) {
        // You can return a loading spinner here
        return <div>Loading...</div>;
    }

    // If the user is not logged in, redirect to the login page.
    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    // If the user is logged in but does not have the 'admin' role,
    // redirect them to the dashboard.
    if (userData?.role !== 'admin') {
        return <Navigate to="/" />;
    }

    // If the user is an admin, render the requested page within the AppShell.
    return <AppShell>{children}</AppShell>;
};

export default AdminRoute;

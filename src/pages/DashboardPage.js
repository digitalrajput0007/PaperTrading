import React from 'react';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
    const { userData } = useAuth();

    return (
        <div className="p-4 md:p-6">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
                Welcome back, {userData?.firstName || 'Trader'}!
            </h1>
            <p className="text-text-secondary mb-8">Here is your trading dashboard. You can add new components and tools as you build them.</p>

            {/* You can add other non-live components here in the future */}
            <div className="bg-primary-light p-6 rounded-lg shadow-lg border border-gray-700">
                <h2 className="text-xl font-bold text-text-primary mb-4">Dashboard Content</h2>
                <p className="text-text-secondary">Your dashboard is ready. Use the sidebar to navigate to other tools like the Paper Trading log or Risk Management calculator.</p>
            </div>
        </div>
    );
};

export default DashboardPage;

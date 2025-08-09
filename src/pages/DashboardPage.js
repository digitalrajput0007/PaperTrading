import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
// Note: The components below would need to be created and styled separately.
// import MarketMood from '../components/MarketMood';
// import SectorPerformance from '../components/SectorPerformance';
// import Heatmap from '../components/Heatmap';

const DashboardPage = () => {
    const { currentUser } = useAuth();
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserName = async () => {
            if (currentUser) {
                try {
                    const docRef = doc(db, "users", currentUser.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setUserName(docSnap.data().firstName);
                    } else {
                        // Fallback to email if user document doesn't exist
                        setUserName(currentUser.email.split('@')[0]);
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    setUserName(currentUser.email.split('@')[0]); // Fallback on error
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchUserName();
    }, [currentUser]);

    if (loading) {
        return <div className="text-center text-text-secondary">Loading dashboard...</div>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Welcome, {userName || 'Trader'}!</h1>
            <p className="text-text-secondary mb-8">Here is the market overview for today.</p>

            {/* Placeholder for future components */}
            <div className="grid grid-cols-1 gap-8">
                <div className="bg-primary-light p-6 rounded-lg shadow-lg border border-gray-700 min-h-[20rem] flex items-center justify-center">
                    <p className="text-text-secondary text-lg">Market Mood Component - Coming Soon</p>
                </div>
                 <div className="bg-primary-light p-6 rounded-lg shadow-lg border border-gray-700 min-h-[20rem] flex items-center justify-center">
                    <p className="text-text-secondary text-lg">Sector Performance Component - Coming Soon</p>
                </div>
                 <div className="bg-primary-light p-6 rounded-lg shadow-lg border border-gray-700 min-h-[20rem] flex items-center justify-center">
                    <p className="text-text-secondary text-lg">Market Heatmap Component - Coming Soon</p>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;

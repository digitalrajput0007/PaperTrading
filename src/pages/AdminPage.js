import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';

// --- SVG Icon for Export Button ---
const ExportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;

const AdminPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersCollectionRef = collection(db, 'users');
                const querySnapshot = await getDocs(usersCollectionRef);
                const usersList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Sort users to bring admins to the top
                usersList.sort((a, b) => {
                    if (a.role === 'admin' && b.role !== 'admin') return -1;
                    if (a.role !== 'admin' && b.role === 'admin') return 1;
                    return 0; // Keep original order for users with the same role
                });

                setUsers(usersList);
            } catch (error) {
                console.error("Error fetching users:", error);
                toast.error("Failed to fetch user data.");
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const formatDate = (timestamp) => {
        if (timestamp && timestamp.seconds) {
            return new Date(timestamp.seconds * 1000).toLocaleDateString('en-IN');
        }
        return 'N/A';
    };

    const handleExport = () => {
        // Note: This requires the xlsx library to be loaded from a CDN in your index.html
        // <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
        if (typeof window.XLSX === 'undefined') {
            toast.error("Excel export library is not available.");
            console.error("Please add the xlsx library CDN to your index.html file.");
            return;
        }

        const dataToExport = users.map(user => ({
            'Name': `${user.firstName} ${user.lastName}`,
            'Email': user.email,
            'Mobile': user.mobile || 'N/A',
            'Gender': user.gender || 'N/A',
            'Role': user.role || 'user',
            'Created At': formatDate(user.createdAt),
        }));

        const ws = window.XLSX.utils.json_to_sheet(dataToExport);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, "Users");
        window.XLSX.writeFile(wb, "TradeDash_Users.xlsx");
    };

    return (
        <div className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-text-primary md:hidden">Admin Panel</h1>
                <div className="flex-grow"></div>
                <button 
                    onClick={handleExport} 
                    className="flex items-center bg-secondary hover:bg-secondary-dark text-white font-bold py-2 px-4 rounded-lg transition"
                    disabled={loading || users.length === 0}
                >
                    <ExportIcon />
                    Export to Excel
                </button>
            </div>

            <div className="bg-primary-light p-6 rounded-lg shadow-lg border border-gray-700">
                <div className="overflow-x-auto">
                    {loading ? (
                        <p className="text-center text-text-secondary">Loading users...</p>
                    ) : (
                        <table className="min-w-full text-sm">
                            <thead className="border-b border-gray-700 text-text-secondary">
                                <tr>
                                    <th className="text-left p-3 font-semibold">Name</th>
                                    <th className="text-left p-3 font-semibold">Email</th>
                                    <th className="text-left p-3 font-semibold">Mobile</th>
                                    <th className="text-left p-3 font-semibold">Gender</th>
                                    <th className="text-left p-3 font-semibold">Role</th>
                                    <th className="text-left p-3 font-semibold">Created At</th>
                                </tr>
                            </thead>
                            <tbody className="text-text-primary">
                                {users.map(user => (
                                    <tr key={user.id} className="border-b border-gray-700 hover:bg-primary transition">
                                        <td className="p-3">{user.firstName} {user.lastName}</td>
                                        <td className="p-3">{user.email}</td>
                                        <td className="p-3">{user.mobile || 'N/A'}</td>
                                        <td className="p-3">{user.gender || 'N/A'}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-secondary text-white' : 'bg-gray-600 text-text-secondary'}`}>
                                                {user.role || 'user'}
                                            </span>
                                        </td>
                                        <td className="p-3">{formatDate(user.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPage;

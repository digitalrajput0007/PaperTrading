import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';

// --- Number Formatting Helper ---
const formatCurrency = (number) => {
    if (isNaN(number)) return number;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(number);
};

// --- Reusable Pagination Component ---
const TableControls = ({ totalItems, itemsPerPage, setItemsPerPage, currentPage, setCurrentPage }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startRecord = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const endRecord = Math.min(currentPage * itemsPerPage, totalItems);

    const pageNumbers = useMemo(() => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 4) pages.push('...');
            
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);

            if (currentPage <= 4) {
                start = 2;
                end = 5;
            } else if (currentPage >= totalPages - 3) {
                start = totalPages - 4;
                end = totalPages - 1;
            }

            for (let i = start; i <= end; i++) pages.push(i);

            if (currentPage < totalPages - 3) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    }, [totalPages, currentPage]);
    
    return (
        <div className="flex flex-col md:flex-row items-center justify-between mt-4 text-sm text-text-secondary space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
                <span>Show</span>
                <select 
                    value={itemsPerPage} 
                    onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                    }} 
                    className="p-1 bg-primary border border-gray-600 rounded-md text-white"
                >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                </select>
                <span>records</span>
            </div>

            {totalItems > 0 && (
                <div className="flex items-center justify-center space-x-1">
                    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-3 py-1 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">{'<<'}</button>
                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">{'<'}</button>
                    {pageNumbers.map((num, index) => (
                        <button
                            key={index}
                            onClick={() => typeof num === 'number' && setCurrentPage(num)}
                            disabled={typeof num !== 'number'}
                            className={`px-3 py-1 rounded-md disabled:cursor-not-allowed ${currentPage === num ? 'bg-secondary text-white font-bold' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                            {num}
                        </button>
                    ))}
                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">{'>'}</button>
                    <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-3 py-1 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">{'>>'}</button>
                </div>
            )}
            
            <div>
                <span>Showing {startRecord} to {endRecord} of {totalItems} records</span>
            </div>
        </div>
    );
};

const RankingPage = () => {
    const [rankedUsers, setRankedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return rankedUsers.slice(startIndex, startIndex + itemsPerPage);
    }, [rankedUsers, currentPage, itemsPerPage]);

    useEffect(() => {
        const fetchUsersAndStats = async () => {
            try {
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const allUsersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                const usersList = allUsersList.filter(user => user.role !== 'admin');

                const usersWithStats = await Promise.all(usersList.map(async (user) => {
                    const tradesRef = collection(db, 'users', user.id, 'trades');
                    const tradesSnapshot = await getDocs(tradesRef);
                    const trades = tradesSnapshot.docs.map(d => d.data());

                    const openTrades = trades.filter(t => t.status === 'OPEN').length;
                    const closedTrades = trades.filter(t => t.status === 'CLOSED');
                    const totalPnl = closedTrades.reduce((acc, trade) => acc + (trade.pnl || 0), 0);
                    
                    let avgTradesPerDay = 0;
                    if (trades.length > 0 && trades[0].entryDate) {
                        const firstTradeDate = trades.reduce((earliest, trade) => 
                            trade.entryDate.seconds < earliest.seconds ? trade.entryDate : earliest
                        , trades[0].entryDate).seconds * 1000;
                        
                        const daysSinceFirstTrade = Math.max(1, (new Date().getTime() - firstTradeDate) / (1000 * 3600 * 24));
                        avgTradesPerDay = trades.length / daysSinceFirstTrade;
                    }

                    return { 
                        ...user, 
                        totalPnl, 
                        openTrades, 
                        closedTrades: closedTrades.length, 
                        avgTradesPerDay: avgTradesPerDay.toFixed(2) 
                    };
                }));

                usersWithStats.sort((a, b) => b.totalPnl - a.totalPnl);
                
                const finalRankedList = usersWithStats.map((user, index) => ({
                    ...user,
                    rank: index + 1
                }));

                setRankedUsers(finalRankedList);

            } catch (error) {
                console.error("Error fetching user rankings:", error);
                toast.error("Failed to fetch user rankings.");
            } finally {
                setLoading(false);
            }
        };

        fetchUsersAndStats();
    }, []);

    return (
        <div className="p-4 md:p-6">
            <h1 className="text-3xl font-bold text-text-primary mb-8">User Rankings</h1>
            <div className="bg-primary-light p-6 rounded-lg shadow-lg border border-gray-700">
                <div className="overflow-x-auto">
                    {loading ? (
                        <p className="text-center text-text-secondary">Calculating rankings...</p>
                    ) : (
                        <>
                            <table className="min-w-full text-sm">
                                <thead className="border-b border-gray-700 text-text-secondary">
                                    <tr>
                                        <th className="text-left p-3 font-semibold">Rank</th>
                                        <th className="text-left p-3 font-semibold">Name</th>
                                        <th className="text-left p-3 font-semibold">Total P&L</th>
                                        <th className="text-center p-3 font-semibold">Open Trades</th>
                                        <th className="text-center p-3 font-semibold">Closed Trades</th>
                                        <th className="text-center p-3 font-semibold">Avg. Trades/Day</th>
                                    </tr>
                                </thead>
                                <tbody className="text-text-primary">
                                    {paginatedUsers.map(user => (
                                        <tr key={user.id} className="border-b border-gray-700 hover:bg-primary transition">
                                            <td className="p-3 font-bold text-secondary">{user.rank}</td>
                                            <td className="p-3">{user.firstName} {user.lastName}</td>
                                            <td className={`p-3 font-bold ${user.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {formatCurrency(user.totalPnl)}
                                            </td>
                                            <td className="p-3 text-center">{user.openTrades}</td>
                                            <td className="p-3 text-center">{user.closedTrades}</td>
                                            <td className="p-3 text-center">{user.avgTradesPerDay}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <TableControls 
                                totalItems={rankedUsers.length} 
                                itemsPerPage={itemsPerPage} 
                                setItemsPerPage={setItemsPerPage} 
                                currentPage={currentPage} 
                                setCurrentPage={setCurrentPage} 
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RankingPage;

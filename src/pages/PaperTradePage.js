import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, query, onSnapshot, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';

// --- SVG Icons for Buttons ---
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

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


// --- Combined Pagination and Footer Component ---
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
                        setCurrentPage(1); // Reset to first page on changing items per page
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

// --- Segmented Speedometer Gauge Component ---
const WinRateGauge = ({ winPercentage = 0 }) => {
    const percentage = Math.min(100, Math.max(0, winPercentage));
    const rotation = (percentage / 100) * 180 - 90;

    const Arc = ({ color, from, to }) => {
        const describeArcSegment = (cx, cy, outerRadius, innerRadius, startAngle, endAngle) => {
            const startOuter = {
                x: cx + outerRadius * Math.cos(startAngle * Math.PI / 180),
                y: cy + outerRadius * Math.sin(startAngle * Math.PI / 180)
            };
            const endOuter = {
                x: cx + outerRadius * Math.cos(endAngle * Math.PI / 180),
                y: cy + outerRadius * Math.sin(endAngle * Math.PI / 180)
            };
            
            const startInner = {
                x: cx + innerRadius * Math.cos(endAngle * Math.PI / 180),
                y: cy + innerRadius * Math.sin(endAngle * Math.PI / 180)
            };
            const endInner = {
                x: cx + innerRadius * Math.cos(startAngle * Math.PI / 180),
                y: cy + innerRadius * Math.sin(startAngle * Math.PI / 180)
            };

            const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

            const d = [
                "M", startOuter.x, startOuter.y,
                "A", outerRadius, outerRadius, 0, largeArcFlag, 1, endOuter.x, endOuter.y,
                "L", startInner.x, startInner.y,
                "A", innerRadius, innerRadius, 0, largeArcFlag, 0, endInner.x, endInner.y,
                "Z"
            ].join(" ");

            return d;
        };
        return <path d={describeArcSegment(100, 100, 80, 55, from, to)} fill={color} />;
    };

    return (
        <div className="relative w-64 h-44 flex flex-col items-center justify-start">
            <svg viewBox="0 0 200 100" className="w-full h-auto">
                {/* Gauge Segments */}
                <Arc color="#d9534f" from={180} to={216} /> {/* Red */}
                <Arc color="#f0ad4e" from={216} to={252} /> {/* Orange */}
                <Arc color="#ffd700" from={252} to={288} /> {/* Yellow */}
                <Arc color="#5cb85c" from={288} to={324} /> {/* Light Green */}
                <Arc color="#4cae4c" from={324} to={360} /> {/* Dark Green */}

                {/* Needle */}
                <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '100px 100px', transition: 'transform 0.5s ease-out' }}>
                    <path d="M 100 25 L 95 100 L 105 100 Z" fill="#4A5568" />
                    <circle cx="100" cy="100" r="5" fill="#4A5568" />
                </g>
            </svg>
            <div className="flex flex-col items-center mt-2">
                <span className="text-3xl font-bold text-text-primary">{percentage.toFixed(1)}%</span>
                <span className="text-sm text-text-secondary">Win Rate</span>
            </div>
        </div>
    );
};


const PaperTradePage = () => {
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({ symbol: '', quantity: '', price: '', type: 'BUY', remarks: '', brokerage: '' });
    const [openPositions, setOpenPositions] = useState([]);
    const [closedTrades, setClosedTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exitPrices, setExitPrices] = useState({});

    // --- State for Modals ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTrade, setEditingTrade] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingTradeId, setDeletingTradeId] = useState(null);

    // --- State for Pagination ---
    const [openCurrentPage, setOpenCurrentPage] = useState(1);
    const [openItemsPerPage, setOpenItemsPerPage] = useState(10);
    const [closedCurrentPage, setClosedCurrentPage] = useState(1);
    const [closedItemsPerPage, setClosedItemsPerPage] = useState(10);

    // --- Memoized Paginated Data ---
    const paginatedOpenPositions = useMemo(() => {
        const startIndex = (openCurrentPage - 1) * openItemsPerPage;
        return openPositions.slice(startIndex, startIndex + openItemsPerPage);
    }, [openPositions, openCurrentPage, openItemsPerPage]);

    const paginatedClosedTrades = useMemo(() => {
        const startIndex = (closedCurrentPage - 1) * closedItemsPerPage;
        return closedTrades.slice(startIndex, startIndex + closedItemsPerPage);
    }, [closedTrades, closedCurrentPage, closedItemsPerPage]);

    const tradeStats = useMemo(() => {
        const totalTrades = closedTrades.length;
        const wins = closedTrades.filter(trade => trade.pnl > 0).length;
        const losses = totalTrades - wins;
        const winPercentage = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
        const totalPnl = closedTrades.reduce((acc, trade) => acc + (trade.pnl || 0), 0);
        return { totalTrades, wins, losses, winPercentage, totalPnl };
    }, [closedTrades]);

    useEffect(() => {
        if (!currentUser) return;
        setLoading(true);
        const tradesRef = collection(db, "users", currentUser.uid, "trades");
        const q = query(tradesRef, orderBy("entryDate", "desc"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const positions = [];
            const closed = [];
            querySnapshot.forEach((doc) => {
                const trade = { id: doc.id, ...doc.data() };
                if (trade.status === 'OPEN') positions.push(trade);
                else closed.push(trade);
            });
            setOpenPositions(positions);
            setClosedTrades(closed);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching trades:", err);
            toast.error("Could not fetch trades.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };
    const handleExitPriceChange = (tradeId, value) => setExitPrices(prev => ({ ...prev, [tradeId]: value }));
    const formatDateTime = (timestamp) => {
        if (timestamp && timestamp.seconds) {
            return new Date(timestamp.seconds * 1000).toLocaleString();
        }
        return 'Processing...';
    };

    const handleNewTrade = async (e) => {
        e.preventDefault();
        if (!formData.symbol || !formData.quantity || !formData.price) {
            return toast.error("Please fill in all required fields.");
        }
        try {
            await addDoc(collection(db, "users", currentUser.uid, "trades"), {
                symbol: formData.symbol.toUpperCase(),
                quantity: Number(formData.quantity),
                entryPrice: Number(formData.price),
                type: formData.type,
                remarks: formData.remarks,
                brokerage: Number(formData.brokerage) || 0,
                status: 'OPEN',
                entryDate: new Date(),
            });
            setFormData({ symbol: '', quantity: '', price: '', type: 'BUY', remarks: '', brokerage: '' });
            toast.success("Trade placed successfully!");
        } catch (err) {
            toast.error("Failed to add new trade.");
        }
    };

    const handleCloseTrade = async (tradeId) => {
        const exitPrice = exitPrices[tradeId];
        if (!exitPrice || isNaN(exitPrice) || Number(exitPrice) <= 0) {
            return toast.error("Please enter a valid positive exit price.");
        }
        const tradeToClose = openPositions.find(p => p.id === tradeId);
        const brokerage = tradeToClose.brokerage || 0;
        let pnl;

        if (tradeToClose.type === 'BUY') {
            pnl = ((Number(exitPrice) - tradeToClose.entryPrice) * tradeToClose.quantity) - brokerage;
        } else {
            pnl = ((tradeToClose.entryPrice - Number(exitPrice)) * tradeToClose.quantity) - brokerage;
        }
        
        try {
            await updateDoc(doc(db, "users", currentUser.uid, "trades", tradeId), {
                status: 'CLOSED',
                exitPrice: Number(exitPrice),
                exitDate: new Date(),
                pnl: pnl
            });
            setExitPrices(prev => { const newPrices = {...prev}; delete newPrices[tradeId]; return newPrices; });
            toast.success("Trade closed successfully!");
        } catch (err) {
            toast.error("Failed to close trade.");
        }
    };

    const handleDeleteTrade = async () => {
        if (!deletingTradeId) return;
        try {
            await deleteDoc(doc(db, "users", currentUser.uid, "trades", deletingTradeId));
            toast.success("Trade deleted successfully.");
        } catch (err) {
            toast.error("Failed to delete trade.");
        }
        setIsDeleteModalOpen(false);
        setDeletingTradeId(null);
    };

    const handleUpdateTrade = async (e) => {
        e.preventDefault();
        try {
            const tradeRef = doc(db, "users", currentUser.uid, "trades", editingTrade.id);
            await updateDoc(tradeRef, {
                symbol: editingTrade.symbol.toUpperCase(),
                quantity: Number(editingTrade.quantity),
                entryPrice: Number(editingTrade.entryPrice),
                brokerage: Number(editingTrade.brokerage) || 0,
                remarks: editingTrade.remarks
            });
            toast.success("Trade updated successfully!");
        } catch (err) {
            toast.error("Failed to update trade.");
        }
        setIsEditModalOpen(false);
        setEditingTrade(null);
    };
    
    const openEditModal = (trade) => {
        setEditingTrade(trade);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (tradeId) => {
        setDeletingTradeId(tradeId);
        setIsDeleteModalOpen(true);
    };

    return (
        <div className="p-4 md:p-6">
            <h1 className="text-3xl font-bold text-text-primary mb-8 md:hidden">Dashboard</h1>
            
            <div className="bg-primary-light p-6 rounded-lg shadow-lg mb-8 border border-gray-700">
                <h2 className="text-xl font-semibold text-text-primary mb-4">Trade Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    
                    <div className="w-full flex flex-col items-center justify-center">
                        <WinRateGauge winPercentage={tradeStats.winPercentage} />
                    </div>
                    
                    <div className="w-full grid grid-cols-2 lg:grid-cols-3 gap-4 text-center">
                        <div className="flex flex-col items-center bg-primary p-4 rounded-lg">
                            <span className="text-4xl font-bold text-green-400">{tradeStats.wins}</span>
                            <span className="text-text-secondary mt-1">Wins</span>
                        </div>
                        <div className="flex flex-col items-center bg-primary p-4 rounded-lg">
                            <span className="text-4xl font-bold text-red-400">{tradeStats.losses}</span>
                            <span className="text-text-secondary mt-1">Losses</span>
                        </div>
                        <div className="flex flex-col items-center bg-primary p-4 rounded-lg">
                            <span className="text-4xl font-bold text-text-primary">{tradeStats.totalTrades}</span>
                            <span className="text-text-secondary mt-1">Total Trades</span>
                        </div>
                        <div className="col-span-2 lg:col-span-3 flex flex-col items-center bg-primary p-4 rounded-lg">
                            <span className={`text-4xl font-bold ${tradeStats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {tradeStats.totalPnl >= 0 ? '+' : ''}{formatCurrency(tradeStats.totalPnl)}
                            </span>
                            <span className="text-text-secondary mt-1">Total Net P&L</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-primary-light p-6 rounded-lg shadow-lg mb-8 border border-gray-700">
                <h2 className="text-xl font-semibold text-text-primary mb-4">Enter a New Trade</h2>
                <form onSubmit={handleNewTrade} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                    <select name="type" value={formData.type} onChange={handleChange} className="p-3 bg-primary rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-secondary transition text-white">
                        <option value="BUY">BUY</option>
                        <option value="SELL">SELL</option>
                    </select>
                    <input name="symbol" value={formData.symbol} onChange={handleChange} placeholder="Symbol (e.g., RELIANCE)" className="p-3 bg-primary rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-secondary transition" />
                    <input name="quantity" type="number" value={formData.quantity} onChange={handleChange} placeholder="Quantity" className="p-3 bg-primary rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-secondary transition" />
                    <input name="price" type="number" step="any" value={formData.price} onChange={handleChange} placeholder="Entry Price" className="p-3 bg-primary rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-secondary transition" />
                    <input name="brokerage" type="number" step="any" value={formData.brokerage} onChange={handleChange} placeholder="Brokerage & Taxes" className="p-3 bg-primary rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-secondary transition" />
                    <input name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Remarks" className="p-3 bg-primary rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-secondary transition" />
                    <button type="submit" className="md:col-span-3 lg:col-span-6 bg-secondary hover:bg-secondary-dark text-white font-bold py-3 px-4 rounded-lg transition duration-300 w-full">Place Order</button>
                </form>
            </div>

            <div className="bg-primary-light p-6 rounded-lg shadow-lg mb-8 border border-gray-700">
                <h2 className="text-xl font-semibold text-text-primary mb-4">Open Positions</h2>
                <div className="overflow-x-auto">
                    {loading ? <p className="text-text-secondary">Loading...</p> : openPositions.length > 0 ? (
                        <>
                            <table className="min-w-full text-sm hidden md:table">
                                <thead className="border-b border-gray-700 text-text-secondary">
                                    <tr>
                                        <th className="text-left p-3 font-semibold">Symbol</th>
                                        <th className="text-left p-3 font-semibold">Type</th>
                                        <th className="text-left p-3 font-semibold">Quantity</th>
                                        <th className="text-left p-3 font-semibold">Entry Price</th>
                                        <th className="text-left p-3 font-semibold">Brokerage</th>
                                        <th className="text-left p-3 font-semibold">Entry Date & Time</th>
                                        <th className="text-left p-3 font-semibold">Remarks</th>
                                        <th className="text-left p-3 font-semibold">Exit Price</th>
                                        <th className="text-left p-3 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-text-primary">
                                    {paginatedOpenPositions.map(pos => (
                                        <tr key={pos.id} className="border-b border-gray-700 hover:bg-primary transition">
                                            <td className="p-3 font-bold">{pos.symbol}</td>
                                            <td className={`p-3 font-bold ${pos.type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>{pos.type}</td>
                                            <td className="p-3">{pos.quantity}</td>
                                            <td className="p-3">{formatCurrency(pos.entryPrice)}</td>
                                            <td className="p-3">{formatCurrency(pos.brokerage)}</td>
                                            <td className="p-3 text-text-secondary">{formatDateTime(pos.entryDate)}</td>
                                            <td className="p-3">{pos.remarks}</td>
                                            <td className="p-3">
                                                <input type="number" step="any" placeholder="Exit Price" value={exitPrices[pos.id] || ''} onChange={(e) => handleExitPriceChange(pos.id, e.target.value)} className="p-2 bg-primary rounded-md w-full md:w-28 focus:outline-none focus:ring-2 focus:ring-secondary transition" />
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center space-x-2">
                                                    <button onClick={() => handleCloseTrade(pos.id)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-md transition">Close Trade</button>
                                                    <button onClick={() => openEditModal(pos)} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md transition"><EditIcon /></button>
                                                    <button onClick={() => openDeleteModal(pos.id)} className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-md transition"><DeleteIcon /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="md:hidden space-y-4">
                                {paginatedOpenPositions.map(pos => (
                                    <div key={pos.id} className="bg-primary p-4 rounded-lg border border-gray-700">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-lg">{pos.symbol}</span>
                                            <span className={`text-sm font-bold ${pos.type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>{pos.type}</span>
                                        </div>
                                        <div className="text-sm space-y-1">
                                            <p><strong>Quantity:</strong> {pos.quantity}</p>
                                            <p><strong>Entry Price:</strong> {formatCurrency(pos.entryPrice)}</p>
                                            <p><strong>Brokerage:</strong> {formatCurrency(pos.brokerage)}</p>
                                            <p><strong>Remarks:</strong> {pos.remarks || 'N/A'}</p>
                                            <div className="flex items-center space-x-2 pt-2">
                                                <input type="number" step="any" placeholder="Exit Price" value={exitPrices[pos.id] || ''} onChange={(e) => handleExitPriceChange(pos.id, e.target.value)} className="p-2 bg-primary-light rounded-md w-full focus:outline-none focus:ring-2 focus:ring-secondary transition" />
                                                <button onClick={() => handleCloseTrade(pos.id)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-md transition text-xs">Close</button>
                                            </div>
                                        </div>
                                        <div className="flex justify-end space-x-2 mt-3">
                                            <button onClick={() => openEditModal(pos)} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md transition"><EditIcon /></button>
                                            <button onClick={() => openDeleteModal(pos.id)} className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-md transition"><DeleteIcon /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <TableControls totalItems={openPositions.length} itemsPerPage={openItemsPerPage} setItemsPerPage={setOpenItemsPerPage} currentPage={openCurrentPage} setCurrentPage={setOpenCurrentPage} />
                        </>
                    ) : <p className="text-text-secondary">No open positions.</p>}
                </div>
            </div>

            <div className="bg-primary-light p-6 rounded-lg shadow-lg mb-8 border border-gray-700">
                <h2 className="text-xl font-semibold text-text-primary mb-4">Trade History</h2>
                <div className="overflow-x-auto">
                    {loading ? <p className="text-text-secondary">Loading...</p> : closedTrades.length > 0 ? (
                        <>
                            <table className="min-w-full text-sm hidden md:table">
                                <thead className="border-b border-gray-700 text-text-secondary">
                                    <tr>
                                        <th className="text-left p-3 font-semibold">Symbol</th>
                                        <th className="text-left p-3 font-semibold">Type</th>
                                        <th className="text-left p-3 font-semibold">Net P/L</th>
                                        <th className="text-left p-3 font-semibold">Entry Price</th>
                                        <th className="text-left p-3 font-semibold">Exit Price</th>
                                        <th className="text-left p-3 font-semibold">Brokerage</th>
                                        <th className="text-left p-3 font-semibold">Exit Date & Time</th>
                                        <th className="text-left p-3 font-semibold">Remarks</th>
                                        <th className="text-left p-3 font-semibold">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-text-primary">
                                    {paginatedClosedTrades.map(trade => (
                                        <tr key={trade.id} className="border-b border-gray-700 hover:bg-primary transition">
                                            <td className="p-3 font-bold">{trade.symbol}</td>
                                            <td className={`p-3 font-bold ${trade.type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>{trade.type}</td>
                                            <td className={`p-3 font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}</td>
                                            <td className="p-3">{formatCurrency(trade.entryPrice)}</td>
                                            <td className="p-3">{formatCurrency(trade.exitPrice)}</td>
                                            <td className="p-3">{formatCurrency(trade.brokerage)}</td>
                                            <td className="p-3 text-text-secondary">{formatDateTime(trade.exitDate)}</td>
                                            <td className="p-3">{trade.remarks}</td>
                                            <td className="p-3">
                                                <button onClick={() => openDeleteModal(trade.id)} className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-md transition"><DeleteIcon /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="md:hidden space-y-4">
                                {paginatedClosedTrades.map(trade => (
                                    <div key={trade.id} className="bg-primary p-4 rounded-lg border border-gray-700">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-lg">{trade.symbol}</span>
                                            <span className={`font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}</span>
                                        </div>
                                        <div className="text-sm space-y-1 text-text-secondary">
                                            <p><strong>Type:</strong> <span className={`font-bold ${trade.type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>{trade.type}</span></p>
                                            <p><strong>Entry:</strong> {formatCurrency(trade.entryPrice)} | <strong>Exit:</strong> {formatCurrency(trade.exitPrice)}</p>
                                            <p><strong>Brokerage:</strong> {formatCurrency(trade.brokerage)}</p>
                                            <p><strong>Exited on:</strong> {formatDateTime(trade.exitDate)}</p>
                                            <p><strong>Remarks:</strong> {trade.remarks || 'N/A'}</p>
                                        </div>
                                        <div className="flex justify-end mt-3">
                                            <button onClick={() => openDeleteModal(trade.id)} className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-md transition"><DeleteIcon /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <TableControls totalItems={closedTrades.length} itemsPerPage={closedItemsPerPage} setItemsPerPage={setClosedItemsPerPage} currentPage={closedCurrentPage} setCurrentPage={setClosedCurrentPage} />
                        </>
                    ) : <p className="text-text-secondary">No closed trades yet.</p>}
                </div>
            </div>

            {/* --- Edit Modal --- */}
            {isEditModalOpen && editingTrade && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-primary-light rounded-lg p-8 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Edit Trade</h2>
                        <form onSubmit={handleUpdateTrade}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block mb-1 font-semibold">Symbol</label>
                                    <input value={editingTrade.symbol} onChange={(e) => setEditingTrade({...editingTrade, symbol: e.target.value})} className="p-2 bg-primary rounded-md w-full" />
                                </div>
                                <div>
                                    <label className="block mb-1 font-semibold">Quantity</label>
                                    <input type="number" value={editingTrade.quantity} onChange={(e) => setEditingTrade({...editingTrade, quantity: e.target.value})} className="p-2 bg-primary rounded-md w-full" />
                                </div>
                                <div>
                                    <label className="block mb-1 font-semibold">Entry Price</label>
                                    <input type="number" step="any" value={editingTrade.entryPrice} onChange={(e) => setEditingTrade({...editingTrade, entryPrice: e.target.value})} className="p-2 bg-primary rounded-md w-full" />
                                </div>
                                <div>
                                    <label className="block mb-1 font-semibold">Brokerage & Taxes</label>
                                    <input type="number" step="any" value={editingTrade.brokerage} onChange={(e) => setEditingTrade({...editingTrade, brokerage: e.target.value})} className="p-2 bg-primary rounded-md w-full" />
                                </div>
                                <div>
                                    <label className="block mb-1 font-semibold">Remarks</label>
                                    <input value={editingTrade.remarks} onChange={(e) => setEditingTrade({...editingTrade, remarks: e.target.value})} className="p-2 bg-primary rounded-md w-full" />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-4 mt-6">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Cancel</button>
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Delete Confirmation Modal --- */}
            {isDeleteModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                       <div className="bg-primary-light rounded-lg p-8 w-full max-w-md">
                           <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
                           <p>Are you sure you want to permanently delete this trade? This action cannot be undone.</p>
                           <div className="flex justify-end space-x-4 mt-6">
                                <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Cancel</button>
                                <button type="button" onClick={handleDeleteTrade} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Delete</button>
                           </div>
                       </div>
                 </div>
            )}
        </div>
    );
};

export default PaperTradePage;

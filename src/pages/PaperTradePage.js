import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, query, onSnapshot, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';

// --- SVG Icons for Buttons ---
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

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


const PaperTradePage = () => {
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({ symbol: '', quantity: '', price: '', type: 'BUY' });
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

    // --- Helper Functions ---
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

    // --- CRUD Operations ---
    const handleNewTrade = async (e) => {
        e.preventDefault();
        if (!formData.symbol || !formData.quantity || !formData.price) {
            return toast.error("Please fill in all fields.");
        }
        try {
            await addDoc(collection(db, "users", currentUser.uid, "trades"), {
                symbol: formData.symbol.toUpperCase(),
                quantity: Number(formData.quantity),
                entryPrice: Number(formData.price),
                type: formData.type,
                status: 'OPEN',
                entryDate: new Date(),
            });
            setFormData({ symbol: '', quantity: '', price: '', type: 'BUY' });
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
        const pnl = (exitPrice - tradeToClose.entryPrice) * tradeToClose.quantity;
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
            });
            toast.success("Trade updated successfully!");
        } catch (err) {
            toast.error("Failed to update trade.");
        }
        setIsEditModalOpen(false);
        setEditingTrade(null);
    };
    
    // --- Modal Openers ---
    const openEditModal = (trade) => {
        setEditingTrade(trade);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (tradeId) => {
        setDeletingTradeId(tradeId);
        setIsDeleteModalOpen(true);
    };

    const totalPnl = closedTrades.reduce((acc, trade) => acc + (trade.pnl || 0), 0);

    return (
        <div className="p-4 md:p-6">
            <h1 className="text-3xl font-bold text-text-primary mb-8">Paper Trading</h1>

            {/* --- New Trade Form --- */}
            <div className="bg-primary-light p-6 rounded-lg shadow-lg mb-8 border border-gray-700">
                <h2 className="text-xl font-semibold text-text-primary mb-4">Enter a New Trade</h2>
                <form onSubmit={handleNewTrade} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                    <input name="symbol" value={formData.symbol} onChange={handleChange} placeholder="Symbol (e.g., RELIANCE)" className="p-3 bg-primary rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-secondary transition" />
                    <input name="quantity" type="number" value={formData.quantity} onChange={handleChange} placeholder="Quantity" className="p-3 bg-primary rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-secondary transition" />
                    <input name="price" type="number" step="any" value={formData.price} onChange={handleChange} placeholder="Entry Price" className="p-3 bg-primary rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-secondary transition" />
                    <button type="submit" className="bg-secondary hover:bg-secondary-dark text-white font-bold py-3 px-4 rounded-lg transition duration-300 w-full">Place Order</button>
                </form>
            </div>

            {/* --- Open Positions --- */}
            <div className="bg-primary-light p-6 rounded-lg shadow-lg mb-8 border border-gray-700">
                <h2 className="text-xl font-semibold text-text-primary mb-4">Open Positions</h2>
                <div className="overflow-x-auto">
                    {loading ? <p className="text-text-secondary">Loading...</p> : openPositions.length > 0 ? (
                        <>
                            <table className="min-w-full text-sm hidden md:table">
                                <thead className="border-b border-gray-700 text-text-secondary">
                                    <tr>
                                        <th className="text-left p-3 font-semibold">Symbol</th>
                                        <th className="text-left p-3 font-semibold">Quantity</th>
                                        <th className="text-left p-3 font-semibold">Entry Price</th>
                                        <th className="text-left p-3 font-semibold">Entry Date & Time</th>
                                        <th className="text-left p-3 font-semibold">Exit Price</th>
                                        <th className="text-left p-3 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-text-primary">
                                    {paginatedOpenPositions.map(pos => (
                                        <tr key={pos.id} className="border-b border-gray-700 hover:bg-primary transition">
                                            <td className="p-3 font-bold">{pos.symbol}</td>
                                            <td className="p-3">{pos.quantity}</td>
                                            <td className="p-3">₹{(pos.entryPrice || 0).toFixed(2)}</td>
                                            <td className="p-3 text-text-secondary">{formatDateTime(pos.entryDate)}</td>
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
                                            <span className="text-sm text-text-secondary">{formatDateTime(pos.entryDate)}</span>
                                        </div>
                                        <div className="text-sm space-y-1">
                                            <p><strong>Quantity:</strong> {pos.quantity}</p>
                                            <p><strong>Entry Price:</strong> ₹{(pos.entryPrice || 0).toFixed(2)}</p>
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

            {/* --- Closed Trades --- */}
             <div className="bg-primary-light p-6 rounded-lg shadow-lg border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-text-primary">Trade History</h2>
                    <div className="text-right">
                        <p className="text-text-secondary text-sm">Total P/L</p>
                        <p className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{totalPnl >= 0 ? '+' : ''}₹{totalPnl.toFixed(2)}</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {loading ? <p className="text-text-secondary">Loading...</p> : closedTrades.length > 0 ? (
                        <>
                            <table className="min-w-full text-sm hidden md:table">
                                <thead className="border-b border-gray-700 text-text-secondary">
                                    <tr>
                                        <th className="text-left p-3 font-semibold">Symbol</th>
                                        <th className="text-left p-3 font-semibold">P/L</th>
                                        <th className="text-left p-3 font-semibold">Entry Price</th>
                                        <th className="text-left p-3 font-semibold">Exit Price</th>
                                        <th className="text-left p-3 font-semibold">Exit Date & Time</th>
                                        <th className="text-left p-3 font-semibold">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-text-primary">
                                    {paginatedClosedTrades.map(trade => (
                                        <tr key={trade.id} className="border-b border-gray-700 hover:bg-primary transition">
                                            <td className="p-3 font-bold">{trade.symbol}</td>
                                            <td className={`p-3 font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{trade.pnl >= 0 ? '+' : ''}₹{(trade.pnl || 0).toFixed(2)}</td>
                                            <td className="p-3">₹{(trade.entryPrice || 0).toFixed(2)}</td>
                                            <td className="p-3">₹{(trade.exitPrice || 0).toFixed(2)}</td>
                                            <td className="p-3 text-text-secondary">{formatDateTime(trade.exitDate)}</td>
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
                                            <span className={`font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{trade.pnl >= 0 ? '+' : ''}₹{(trade.pnl || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="text-sm space-y-1 text-text-secondary">
                                            <p><strong>Entry:</strong> ₹{(trade.entryPrice || 0).toFixed(2)} | <strong>Exit:</strong> ₹{(trade.exitPrice || 0).toFixed(2)}</p>
                                            <p><strong>Exited on:</strong> {formatDateTime(trade.exitDate)}</p>
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

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const PaperTradePage = () => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({ symbol: '', quantity: '', price: '', type: 'BUY' });
  const [openPositions, setOpenPositions] = useState([]);
  const [closedTrades, setClosedTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exitPrices, setExitPrices] = useState({}); // State to manage exit prices for each position

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const tradesRef = collection(db, "users", currentUser.uid, "trades");
    const q = query(tradesRef);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const positions = [];
      const closed = [];
      querySnapshot.forEach((doc) => {
        const trade = { id: doc.id, ...doc.data() };
        if (trade.status === 'OPEN') {
          positions.push(trade);
        } else {
          closed.push(trade);
        }
      });
      setOpenPositions(positions);
      setClosedTrades(closed);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching trades:", err);
      setError("Could not fetch trades.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleExitPriceChange = (tradeId, value) => {
    setExitPrices(prev => ({ ...prev, [tradeId]: value }));
  };

  const handleNewTrade = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.symbol || !formData.quantity || !formData.price) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      const tradesRef = collection(db, "users", currentUser.uid, "trades");
      await addDoc(tradesRef, {
        symbol: formData.symbol.toUpperCase(),
        quantity: Number(formData.quantity),
        entryPrice: Number(formData.price),
        type: formData.type,
        status: 'OPEN',
        entryDate: new Date(),
      });
      setFormData({ symbol: '', quantity: '', price: '', type: 'BUY' });
    } catch (err) {
      console.error("Error adding new trade:", err);
      setError("Failed to add new trade.");
    }
  };

  const handleCloseTrade = async (tradeId) => {
    const exitPrice = exitPrices[tradeId];
    if (!exitPrice || isNaN(exitPrice)) {
      alert("Please enter a valid exit price.");
      return;
    }

    const tradeToClose = openPositions.find(p => p.id === tradeId);
    const pnl = (exitPrice - tradeToClose.entryPrice) * tradeToClose.quantity;

    try {
      const tradeRef = doc(db, "users", currentUser.uid, "trades", tradeId);
      await updateDoc(tradeRef, {
        status: 'CLOSED',
        exitPrice: Number(exitPrice),
        exitDate: new Date(),
        pnl: pnl
      });
      // Clear the exit price for the closed trade
      setExitPrices(prev => {
          const newPrices = {...prev};
          delete newPrices[tradeId];
          return newPrices;
      });
    } catch (err) {
      console.error("Error closing trade:", err);
      setError("Failed to close trade.");
    }
  };

  const totalPnl = closedTrades.reduce((acc, trade) => acc + trade.pnl, 0);

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-8">Paper Trading</h1>

      {/* New Trade Form */}
      <div className="bg-primary-light p-6 rounded-lg shadow-lg mb-8 border border-gray-700">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Enter a New Trade</h2>
        <form onSubmit={handleNewTrade} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <input name="symbol" value={formData.symbol} onChange={handleChange} placeholder="Symbol (e.g., RELIANCE)" className="md:col-span-2 p-3 bg-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition" />
          <input name="quantity" type="number" value={formData.quantity} onChange={handleChange} placeholder="Quantity" className="p-3 bg-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition" />
          <input name="price" type="number" step="any" value={formData.price} onChange={handleChange} placeholder="Entry Price" className="p-3 bg-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition" />
          <button type="submit" className="bg-secondary hover:bg-secondary-dark text-white font-bold py-3 px-4 rounded-lg transition duration-300">Place Order</button>
        </form>
        {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
      </div>

      {/* Open Positions */}
      <div className="bg-primary-light p-6 rounded-lg shadow-lg mb-8 border border-gray-700">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Open Positions</h2>
        <div className="overflow-x-auto">
          {loading ? <p className="text-text-secondary">Loading...</p> : openPositions.length > 0 ? (
            <table className="min-w-full text-sm">
              <thead className="border-b border-gray-700 text-text-secondary">
                <tr>
                  <th className="text-left p-3 font-semibold">Symbol</th>
                  <th className="text-left p-3 font-semibold">Quantity</th>
                  <th className="text-left p-3 font-semibold">Entry Price</th>
                  <th className="text-left p-3 font-semibold">Entry Date</th>
                  <th className="text-left p-3 font-semibold">Exit Price</th>
                  <th className="text-left p-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="text-text-primary">
                {openPositions.map(pos => (
                  <tr key={pos.id} className="border-b border-gray-700 hover:bg-primary transition">
                    <td className="p-3 font-bold">{pos.symbol}</td>
                    <td className="p-3">{pos.quantity}</td>
                    <td className="p-3">₹{pos.entryPrice.toFixed(2)}</td>
                    <td className="p-3 text-text-secondary">{new Date(pos.entryDate.seconds * 1000).toLocaleDateString()}</td>
                    <td className="p-3">
                      <input type="number" step="any" placeholder="Exit Price" value={exitPrices[pos.id] || ''} onChange={(e) => handleExitPriceChange(pos.id, e.target.value)} className="p-2 bg-primary rounded-md w-28 focus:outline-none focus:ring-2 focus:ring-secondary transition" />
                    </td>
                    <td className="p-3">
                      <button onClick={() => handleCloseTrade(pos.id)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-md transition">Close</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="text-text-secondary">No open positions.</p>}
        </div>
      </div>

      {/* Closed Trades */}
      <div className="bg-primary-light p-6 rounded-lg shadow-lg border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-text-primary">Trade History</h2>
          <div className="text-right">
            <p className="text-text-secondary text-sm">Total P/L</p>
            <p className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalPnl >= 0 ? '+' : ''}₹{totalPnl.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? <p className="text-text-secondary">Loading...</p> : closedTrades.length > 0 ? (
            <table className="min-w-full text-sm">
              <thead className="border-b border-gray-700 text-text-secondary">
                <tr>
                  <th className="text-left p-3 font-semibold">Symbol</th>
                  <th className="text-left p-3 font-semibold">P/L</th>
                  <th className="text-left p-3 font-semibold">Entry Price</th>
                  <th className="text-left p-3 font-semibold">Exit Price</th>
                  <th className="text-left p-3 font-semibold">Exit Date</th>
                </tr>
              </thead>
              <tbody className="text-text-primary">
                {closedTrades.map(trade => (
                  <tr key={trade.id} className="border-b border-gray-700 hover:bg-primary transition">
                    <td className="p-3 font-bold">{trade.symbol}</td>
                    <td className={`p-3 font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.pnl >= 0 ? '+' : ''}₹{trade.pnl.toFixed(2)}
                    </td>
                    <td className="p-3">₹{trade.entryPrice.toFixed(2)}</td>
                    <td className="p-3">₹{trade.exitPrice.toFixed(2)}</td>
                    <td className="p-3 text-text-secondary">{new Date(trade.exitDate.seconds * 1000).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="text-text-secondary">No closed trades yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default PaperTradePage;

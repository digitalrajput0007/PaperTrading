import React, { useState, useEffect } from 'react';

const Heatmap = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHeatmapData = async () => {
      setLoading(true);
      setError(null);
      try {
        // This API provides the constituents of the NIFTY 50 index
        const apiUrl = 'https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050';
        // Using a more reliable proxy
        const proxyUrl = 'https://api.allorigins.win/get?url=';

        const response = await fetch(proxyUrl + encodeURIComponent(apiUrl));
        if (!response.ok) throw new Error('Network response was not ok');

        const contents = await response.json();
        // The proxy wraps the actual response in a 'contents' string
        const data = JSON.parse(contents.contents);

        if (data.data) {
          // Sort by percentage change to show the most impactful stocks
          const sortedStocks = data.data.sort((a, b) => Math.abs(b.pChange) - Math.abs(a.pChange));
          setStocks(sortedStocks.slice(0, 20)); // Display the top 20 movers
        } else {
          throw new Error('Invalid API response for heatmap data.');
        }
      } catch (err) {
        console.warn("Heatmap data fetch failed.", err);
        setError("Could not load live heatmap data.");
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();
    const interval = setInterval(fetchHeatmapData, 180000); // Refresh every 3 minutes
    return () => clearInterval(interval);
  }, []);

  const getBackgroundColor = (pChange) => {
    if (pChange > 1.5) return 'bg-green-700';
    if (pChange > 0.5) return 'bg-green-500';
    if (pChange > 0) return 'bg-green-300 text-gray-800';
    if (pChange < -1.5) return 'bg-red-700';
    if (pChange < -0.5) return 'bg-red-500';
    if (pChange < 0) return 'bg-red-300 text-gray-800';
    return 'bg-gray-500'; // Neutral color for 0 change
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold text-white mb-4">NIFTY 50 Heatmap</h2>
      {loading ? (
        <p className="text-gray-400 text-center">Loading Heatmap...</p>
      ) : error ? (
        <p className="text-red-400 text-center">{error}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
          {stocks.map((stock) => (
            <div 
              key={stock.symbol}
              className={`p-2 rounded-md flex flex-col justify-center items-center text-center ${getBackgroundColor(stock.pChange)}`}
              title={`Last Price: ₹${stock.lastPrice.toFixed(2)}`}
            >
              <p className="font-bold text-sm truncate">{stock.symbol}</p>
              <p className="text-xs">{stock.pChange.toFixed(2)}%</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Heatmap;
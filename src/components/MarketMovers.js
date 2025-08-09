import React, { useState, useEffect } from 'react';

// IMPORTANT: Paste your new Alpha Vantage API key here
const API_KEY = 'P2HWNE9Z73J93JE2';

const MarketMovers = () => {
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMarketMovers = async () => {
      setLoading(true);
      setError(null);
      const url = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${API_KEY}`;
      
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();

        if (data.top_gainers && data.top_losers) {
          setGainers(data.top_gainers.slice(0, 5));
          setLosers(data.top_losers.slice(0, 5));
        } else {
           throw new Error('Invalid API response structure for movers.');
        }
      } catch (err) {
        console.warn("Market Movers fetch failed. Note: The free Alpha Vantage API has a limit of 25 requests per day.", err);
        setError("Could not load live market data.");
      } finally {
        setLoading(false);
      }
    };

    fetchMarketMovers();
  }, []);

  const StockList = ({ title, stocks, colorClass }) => (
    <div>
      <h3 className={`text-lg font-semibold mb-2 ${colorClass}`}>{title}</h3>
      <ul className="space-y-2">
        {stocks.map(stock => (
          <li key={stock.ticker} className="flex justify-between items-center text-sm">
            <span className="font-medium">{stock.ticker}</span>
            <div className="text-right">
              <span className="font-bold">${parseFloat(stock.price).toFixed(2)}</span>
              <span className={`ml-2 ${colorClass}`}>
                {parseFloat(stock.change_percentage).toFixed(2)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-full">
      <h2 className="text-xl font-semibold text-white mb-4">Top Market Movers (US Market)</h2>
       {loading ? (
        <p className="text-gray-400 text-center">Fetching market data...</p>
      ) : error ? (
        <p className="text-red-400 text-center">{error}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StockList title="Top Gainers" stocks={gainers} colorClass="text-green-500" />
          <StockList title="Top Losers" stocks={losers} colorClass="text-red-500" />
        </div>
      )}
    </div>
  );
};

export default MarketMovers;
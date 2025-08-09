
import React, { useState, useEffect } from 'react';

// IMPORTANT: Paste your new Alpha Vantage API key here
const API_KEY = 'P2HWNE9Z73J93JE2';

const MarketMood = () => {
  const [marketData, setMarketData] = useState({ change: 0, points: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarketMood = async () => {
      setLoading(true);
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=NSEI&apikey=${API_KEY}`;
      
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        const quote = data['Global Quote'];

        if (quote && quote['09. change']) {
          const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
          const changePoints = parseFloat(quote['09. change']);
          setMarketData({ change: changePercent, points: changePoints.toFixed(2) });
        } else {
          throw new Error('Invalid API response structure');
        }
      } catch (error) {
        console.warn("Market Mood fetch failed. Note: The free Alpha Vantage API has a limit of 25 requests per day.", error);
        setMarketData({ change: 0, points: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchMarketMood();
  }, []);

  const clampedChange = Math.max(-2, Math.min(2, marketData.change));
  const rotation = (clampedChange / 2) * 90;
  const arcLength = 125.6;
  const offset = arcLength - ((clampedChange + 2) / 4) * arcLength;

  let moodColor = 'text-amber-400';
  if (marketData.change > 0.5) moodColor = 'text-green-500';
  if (marketData.change < -0.5) moodColor = 'text-red-500';

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-full flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Market Mood: NIFTY 50</h2>
        {loading ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : (
          <div className="flex justify-center items-center h-48">
            <div className="relative w-48 h-24">
              <svg className="w-full h-full" viewBox="0 0 100 50">
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#374151" strokeWidth="8" />
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="url(#mood-gradient)" strokeWidth="8" strokeDasharray="125.6" style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 0.7s ease-in-out' }}/>
                <defs>
                  <linearGradient id="mood-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="50%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                </defs>
                <line x1="50" y1="50" x2="50" y2="10" stroke="#9ca3af" strokeWidth="2" transform-origin="50 50" style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.7s cubic-bezier(0.68, -0.55, 0.27, 1.55)' }} />
              </svg>
              <div className={`absolute bottom-0 w-full text-center text-xl font-bold ${moodColor}`}>
                {marketData.change.toFixed(2)}%
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="text-center">
        <p className={`text-lg font-bold ${moodColor}`}>
          {marketData.points > 0 ? '+' : ''}{marketData.points} Points
        </p>
      </div>
    </div>
  );
};

export default MarketMood;
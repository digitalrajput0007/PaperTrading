import React, { useState, useEffect } from 'react';

// IMPORTANT: Paste your Alpha Vantage API key here
const API_KEY = 'P2HWNE9Z73J93JE2';

const SectorPerformance = () => {
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSectorPerformance = async () => {
      setLoading(true);
      setError(null);
      const url = `https://www.alphavantage.co/query?function=SECTOR&apikey=${API_KEY}`;

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        const performanceData = data['Rank B: Day Performance'];

        if (performanceData) {
          // Convert the object into an array of sectors
          const sectorArray = Object.entries(performanceData).map(([name, change]) => ({
            name,
            change: parseFloat(change.replace('%', '')),
          }));
          setSectors(sectorArray);
        } else {
           throw new Error('Invalid API response for sector performance.');
        }
      } catch (err) {
        console.warn("Sector Performance fetch failed. Note: The free Alpha Vantage API has a limit of 25 requests per day.", err);
        setError("Could not load live sector data.");
      } finally {
        setLoading(false);
      }
    };

    fetchSectorPerformance();
  }, []);

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-full">
      <h2 className="text-xl font-semibold text-white mb-4">Indian Sector Performance</h2>
      {loading ? (
        <p className="text-gray-400 text-center">Fetching sector data...</p>
      ) : error ? (
        <p className="text-red-400 text-center">{error}</p>
      ) : (
        <ul className="space-y-3">
          {sectors.map(sector => {
            const isPositive = sector.change >= 0;
            const colorClass = isPositive ? 'text-green-500' : 'text-red-500';
            const width = Math.min(Math.abs(sector.change) * 20, 100); // Scale width for visual effect

            return (
              <li key={sector.name} className="text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-300">{sector.name}</span>
                  <span className={`font-bold ${colorClass}`}>
                    {isPositive ? '+' : ''}{sector.change.toFixed(2)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${width}%` }}
                  ></div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default SectorPerformance;

import React, { useMemo } from 'react';

const SectorPerformance = ({ data }) => {
    const sectorData = useMemo(() => {
        const sectors = {};
        data.forEach(stock => {
            if (!sectors[stock.sector]) {
                sectors[stock.sector] = { totalChange: 0, count: 0 };
            }
            sectors[stock.sector].totalChange += stock.changePercent;
            sectors[stock.sector].count++;
        });

        return Object.entries(sectors)
            .map(([name, { totalChange, count }]) => ({
                name,
                avgChange: totalChange / count,
            }))
            .sort((a, b) => b.avgChange - a.avgChange);
    }, [data]);

    return (
        <div className="bg-primary-light p-6 rounded-lg shadow-lg border border-gray-700 h-full">
            <h2 className="text-xl font-bold text-text-primary mb-4">Sector Performance</h2>
            <div className="space-y-3">
                {sectorData.map(sector => (
                    <div key={sector.name} className="flex items-center">
                        <span className="w-24 text-sm font-semibold text-text-secondary">{sector.name}</span>
                        <div className="flex-1 bg-primary rounded-full h-6 mr-2">
                            <div 
                                className={`h-6 rounded-full text-white text-xs flex items-center justify-end pr-2 ${sector.avgChange >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(Math.abs(sector.avgChange) * 25, 100)}%` }} // Scaling factor for visual
                            >
                                {sector.avgChange.toFixed(2)}%
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SectorPerformance;

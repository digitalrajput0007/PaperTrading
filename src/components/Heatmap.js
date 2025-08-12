import React from 'react';

// Helper function to determine color based on percentage change
const getColorForPercentage = (percent) => {
    if (percent > 2) return 'bg-green-700 hover:bg-green-600';
    if (percent > 0) return 'bg-green-500 hover:bg-green-400';
    if (percent < -2) return 'bg-red-700 hover:bg-red-600';
    if (percent < 0) return 'bg-red-500 hover:bg-red-400';
    return 'bg-gray-500 hover:bg-gray-400';
};

const Heatmap = ({ data }) => {
    return (
        <div className="bg-primary-light p-6 rounded-lg shadow-lg border border-gray-700">
            <h2 className="text-xl font-bold text-text-primary mb-4">Nifty 50 Heatmap</h2>
            <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-2">
                {data.map(stock => (
                    <div 
                        key={stock.symbol} 
                        className={`p-2 rounded-md text-white text-center flex flex-col justify-center items-center transition-all duration-200 cursor-pointer ${getColorForPercentage(stock.changePercent)}`}
                        title={`₹${stock.price.toFixed(2)}`}
                    >
                        <p className="text-xs font-bold">{stock.symbol}</p>
                        <p className="text-xs">{stock.changePercent.toFixed(2)}%</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Heatmap;

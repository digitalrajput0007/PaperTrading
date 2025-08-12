import React from 'react';

// --- Helper Icon Components ---
const ArrowUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>;
const ArrowDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>;

const MoverItem = ({ stock, isGainer }) => (
    <div className="flex justify-between items-center p-3 hover:bg-primary transition-colors duration-200 rounded-md">
        <span className="font-semibold text-text-primary">{stock.symbol}</span>
        <div className="flex items-center space-x-2">
            <span className="text-text-secondary">₹{stock.price.toFixed(2)}</span>
            <span className={`font-bold ${isGainer ? 'text-green-400' : 'text-red-400'}`}>
                {isGainer ? '+' : ''}{stock.changePercent.toFixed(2)}%
            </span>
            {isGainer ? <ArrowUpIcon /> : <ArrowDownIcon />}
        </div>
    </div>
);

const MarketMovers = ({ data }) => {
    // Sort stocks to find top 5 gainers and losers
    const sortedStocks = [...data].sort((a, b) => b.changePercent - a.changePercent);
    const topGainers = sortedStocks.slice(0, 5);
    const topLosers = sortedStocks.slice(-5).reverse();

    return (
        <div className="bg-primary-light p-6 rounded-lg shadow-lg border border-gray-700 h-full">
            <h2 className="text-xl font-bold text-text-primary mb-4">Market Movers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg font-semibold text-green-400 mb-2">Top Gainers</h3>
                    <div className="space-y-2">
                        {topGainers.map(stock => <MoverItem key={stock.symbol} stock={stock} isGainer={true} />)}
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-red-400 mb-2">Top Losers</h3>
                    <div className="space-y-2">
                        {topLosers.map(stock => <MoverItem key={stock.symbol} stock={stock} isGainer={false} />)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketMovers;

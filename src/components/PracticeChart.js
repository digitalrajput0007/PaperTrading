import React, { useState, useMemo, useCallback } from 'react';

// --- SVG Icons for Buttons ---
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const RefreshIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l16 16" /></svg>;

// --- Function to generate mock candlestick data forming a triangle pattern ---
const generateTrianglePatternData = () => {
    let candles = [];
    let price = 100 + Math.random() * 20;
    let upperTrend = price + 5;
    let lowerTrend = price - 5;

    for (let i = 0; i < 40; i++) {
        const open = price;
        const high = Math.min(upperTrend, open + Math.random() * 3);
        const low = Math.max(lowerTrend, open - Math.random() * 3);
        const close = low + Math.random() * (high - low);
        
        candles.push({ open, high, low, close });

        // Next price point
        price = close;
        
        // Squeeze the trendlines
        upperTrend -= 0.2;
        lowerTrend += 0.2;
    }
    return candles;
};


const PracticeChart = () => {
    const [candles, setCandles] = useState(generateTrianglePatternData());
    const [showPattern, setShowPattern] = useState(false);

    const generateNewPattern = useCallback(() => {
        setShowPattern(false);
        setCandles(generateTrianglePatternData());
    }, []);

    const chartDimensions = { width: 800, height: 400, padding: 40 };

    const { priceMin, priceMax, xScale, yScale } = useMemo(() => {
        if (!candles.length) return { priceMin: 0, priceMax: 0, xScale: 1, yScale: 1 };
        
        const priceMin = Math.min(...candles.map(c => c.low));
        const priceMax = Math.max(...candles.map(c => c.high));
        const priceRange = priceMax - priceMin;

        const xScale = (chartDimensions.width - chartDimensions.padding * 2) / (candles.length - 1);
        const yScale = (chartDimensions.height - chartDimensions.padding * 2) / priceRange;

        return { priceMin, priceMax, xScale, yScale };
    }, [candles, chartDimensions]);

    return (
        <div className="bg-primary-light p-6 rounded-lg shadow-lg border border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-text-primary">Pattern Practice Chart (5-min Candles)</h2>
                <div className="flex space-x-2">
                    <button onClick={generateNewPattern} className="flex items-center bg-secondary hover:bg-secondary-dark text-white font-bold py-2 px-4 rounded-lg transition">
                        <RefreshIcon /> New Pattern
                    </button>
                    <button onClick={() => setShowPattern(!showPattern)} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition">
                        <EyeIcon /> {showPattern ? 'Hide' : 'Reveal'} Pattern
                    </button>
                </div>
            </div>

            <svg viewBox={`0 0 ${chartDimensions.width} ${chartDimensions.height}`} className="w-full h-auto">
                {/* Y-Axis Labels */}
                {[...Array(5)].map((_, i) => {
                    const price = priceMin + (i * (priceMax - priceMin) / 4);
                    const y = chartDimensions.height - chartDimensions.padding - (price - priceMin) * yScale;
                    return (
                        <g key={i}>
                            <text x={chartDimensions.padding - 10} y={y} fill="#9CA3AF" textAnchor="end" fontSize="12" alignmentBaseline="middle">{price.toFixed(2)}</text>
                            <line x1={chartDimensions.padding} y1={y} x2={chartDimensions.width - chartDimensions.padding} y2={y} stroke="#4B5563" strokeDasharray="2,2" />
                        </g>
                    );
                })}

                {/* Candlesticks */}
                {candles.map((candle, i) => {
                    const x = chartDimensions.padding + i * xScale;
                    const yOpen = chartDimensions.height - chartDimensions.padding - (candle.open - priceMin) * yScale;
                    const yClose = chartDimensions.height - chartDimensions.padding - (candle.close - priceMin) * yScale;
                    const yHigh = chartDimensions.height - chartDimensions.padding - (candle.high - priceMin) * yScale;
                    const yLow = chartDimensions.height - chartDimensions.padding - (candle.low - priceMin) * yScale;
                    const isGreen = candle.close >= candle.open;

                    return (
                        <g key={i}>
                            <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={isGreen ? '#22C55E' : '#EF4444'} strokeWidth="1" />
                            <rect 
                                x={x - xScale / 4} 
                                y={isGreen ? yClose : yOpen} 
                                width={xScale / 2} 
                                height={Math.abs(yOpen - yClose)} 
                                fill={isGreen ? '#22C55E' : '#EF4444'} 
                            />
                        </g>
                    );
                })}

                {/* Triangle Pattern Overlay */}
                {showPattern && (
                    <polygon 
                        points={`
                            ${chartDimensions.padding},${chartDimensions.height - chartDimensions.padding - (candles[0].high - priceMin) * yScale}
                            ${chartDimensions.width - chartDimensions.padding},${chartDimensions.height - chartDimensions.padding - (candles[candles.length - 1].high - priceMin) * yScale}
                            ${chartDimensions.width - chartDimensions.padding},${chartDimensions.height - chartDimensions.padding - (candles[candles.length - 1].low - priceMin) * yScale}
                            ${chartDimensions.padding},${chartDimensions.height - chartDimensions.padding - (candles[0].low - priceMin) * yScale}
                        `}
                        fill="rgba(75, 85, 99, 0.2)"
                        stroke="#FBBF24"
                        strokeWidth="2"
                        strokeDasharray="4,4"
                    />
                )}
            </svg>
        </div>
    );
};

export default PracticeChart;

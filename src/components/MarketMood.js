import React, { useState, useEffect } from 'react';

const MarketMood = () => {
    const [moodValue, setMoodValue] = useState(50); // Initial value (Neutral)

    useEffect(() => {
        // Simulate live updates for the mood index
        const interval = setInterval(() => {
            setMoodValue(Math.floor(Math.random() * 101)); // Random value between 0 and 100
        }, 5000); // Update every 5 seconds

        return () => clearInterval(interval);
    }, []);

    const getMoodData = (value) => {
        if (value <= 20) return { label: 'Extreme Fear', color: 'text-red-500' };
        if (value <= 40) return { label: 'Fear', color: 'text-orange-500' };
        if (value <= 60) return { label: 'Neutral', color: 'text-yellow-400' };
        if (value <= 80) return { label: 'Greed', color: 'text-green-400' };
        return { label: 'Extreme Greed', color: 'text-green-500' };
    };

    const mood = getMoodData(moodValue);
    const rotation = (moodValue / 100) * 180 - 90;

    return (
        <div className="bg-primary-light p-6 rounded-lg shadow-lg border border-gray-700 h-full">
            <h2 className="text-xl font-bold text-text-primary mb-4">Market Mood</h2>
            <div className="flex flex-col items-center justify-center">
                <div className="relative w-64 h-32 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full">
                        <div className="w-full h-full rounded-t-full border-t-[60px] border-l-[60px] border-r-[60px] border-b-0 border-solid border-transparent">
                            <div className="absolute w-full h-full rounded-t-full border-t-[60px] border-l-[60px] border-r-[60px] border-b-0 border-solid border-red-500" style={{ clipPath: 'polygon(0% 0%, 20% 0%, 20% 100%, 0% 100%)' }}></div>
                            <div className="absolute w-full h-full rounded-t-full border-t-[60px] border-l-[60px] border-r-[60px] border-b-0 border-solid border-orange-500" style={{ clipPath: 'polygon(20% 0%, 40% 0%, 40% 100%, 20% 100%)' }}></div>
                            <div className="absolute w-full h-full rounded-t-full border-t-[60px] border-l-[60px] border-r-[60px] border-b-0 border-solid border-yellow-400" style={{ clipPath: 'polygon(40% 0%, 60% 0%, 60% 100%, 40% 100%)' }}></div>
                            <div className="absolute w-full h-full rounded-t-full border-t-[60px] border-l-[60px] border-r-[60px] border-b-0 border-solid border-green-400" style={{ clipPath: 'polygon(60% 0%, 80% 0%, 80% 100%, 60% 100%)' }}></div>
                            <div className="absolute w-full h-full rounded-t-full border-t-[60px] border-l-[60px] border-r-[60px] border-b-0 border-solid border-green-500" style={{ clipPath: 'polygon(80% 0%, 100% 0%, 100% 100%, 80% 100%)' }}></div>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-32 origin-bottom transition-transform duration-500" style={{ transform: `rotate(${rotation}deg)` }}>
                        <div className="w-1 h-16 bg-text-primary rounded-t-full mx-auto"></div>
                        <div className="w-4 h-4 bg-text-primary rounded-full absolute bottom-0"></div>
                    </div>
                </div>
                <div className="text-center mt-4">
                    <p className={`text-2xl font-bold ${mood.color}`}>{mood.label}</p>
                    <p className="text-4xl font-bold text-text-primary">{moodValue}</p>
                </div>
            </div>
        </div>
    );
};

export default MarketMood;

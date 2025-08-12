import React, { useState, useMemo, useEffect } from 'react';

// --- Reusable UI Components ---
const InputGroup = ({ label, children }) => (
    <div className="bg-primary-light border border-gray-700 rounded-lg flex items-center shadow-sm">
        <span className="py-3 px-4 text-sm font-semibold text-text-secondary border-r border-gray-700 whitespace-nowrap">{label}</span>
        {children}
    </div>
);

const OutputBox = ({ label, value, unit, large = false }) => (
    <div className="bg-primary-light border border-gray-700 rounded-lg p-4 text-center shadow-sm h-full flex flex-col justify-center">
        <p className="text-sm font-medium text-text-secondary">{label}</p>
        <p className={`font-bold text-text-primary ${large ? 'text-5xl mt-2' : 'text-3xl mt-1'}`}>
            {unit}{value}
        </p>
    </div>
);

const PieChart = ({ percentage }) => {
    const angle = (percentage / 100) * 360;
    return (
        <div className="flex flex-col items-center">
            <div 
                className="w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500"
                style={{ background: `conic-gradient(#22c55e ${angle}deg, #374151 ${angle}deg)` }}
            >
                <div className="w-32 h-32 bg-primary-light rounded-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-text-primary">{percentage.toFixed(0)}%</span>
                </div>
            </div>
            <p className="mt-3 font-semibold text-green-400">Win % You Need</p>
        </div>
    );
};

// --- Risk Profile Configuration (Moved outside component) ---
const RISK_PROFILES = {
    low: { percent: 0.02, label: '2.00%' },
    medium: { percent: 0.03, label: '3.00%' },
    high: { percent: 0.04, label: '4.00%' },
};

const RiskManagementPage = () => {
    // --- State for Inputs (Using strings to avoid input issues) ---
    const [capital, setCapital] = useState('100000');
    const [riskProfile, setRiskProfile] = useState('high');
    const [maxTrades, setMaxTrades] = useState('3');
    const [lotSize, setLotSize] = useState('50');
    const [riskRatio, setRiskRatio] = useState('1');
    const [rewardRatio, setRewardRatio] = useState('2');
    
    // --- State for editable risk percentage ---
    const [dailyRiskPercent, setDailyRiskPercent] = useState(RISK_PROFILES.high.percent);

    // --- Effect to update risk percentage when profile changes ---
    useEffect(() => {
        setDailyRiskPercent(RISK_PROFILES[riskProfile].percent);
    }, [riskProfile]);


    // --- Memoized Calculations (Updated) ---
    const calculations = useMemo(() => {
        const numCapital = parseFloat(capital) || 0;
        const numMaxTrades = parseInt(maxTrades) || 0;
        const numLotSize = parseInt(lotSize) || 0;
        const numRiskRatio = parseFloat(riskRatio) || 0;
        const numRewardRatio = parseFloat(rewardRatio) || 0;

        const dailyRiskLimit = numCapital * dailyRiskPercent;
        const riskPerTrade = numMaxTrades > 0 ? dailyRiskLimit / numMaxTrades : 0;
        
        const quantity = numLotSize > 0 ? numLotSize : 0;
        
        const stopLossPoints = quantity > 0 ? riskPerTrade / quantity : 0;
        const targetPoints = quantity > 0 ? (stopLossPoints * numRewardRatio) / numRiskRatio : 0;
        
        const winRateNeeded = (numRiskRatio > 0 && numRewardRatio > 0) ? (numRiskRatio / (numRiskRatio + numRewardRatio)) * 100 : 0;

        return {
            dailyRiskLimit,
            riskPerTrade,
            stopLossPoints,
            targetPoints,
            winRateNeeded,
        };
    }, [capital, dailyRiskPercent, maxTrades, lotSize, riskRatio, rewardRatio]);

    return (
        <div className="p-4 md:p-6">
            <h1 className="text-3xl font-bold text-text-primary mb-8 md:hidden">Risk & Money Management</h1>

            {/* --- Main Inputs (Updated) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <InputGroup label="Enter Your Capital ₹">
                    <input type="number" value={capital} onChange={e => setCapital(e.target.value)} className="w-full p-3 bg-primary rounded-r-lg focus:outline-none focus:ring-2 focus:ring-secondary transition text-text-primary font-semibold" />
                </InputGroup>
                <InputGroup label="Select Your Risk Profile">
                    <select value={riskProfile} onChange={e => setRiskProfile(e.target.value)} className="w-full p-3 bg-primary rounded-r-lg focus:outline-none focus:ring-2 focus:ring-secondary transition text-text-primary font-semibold">
                        <option value="low">Low Risk</option>
                        <option value="medium">Medium Risk</option>
                        <option value="high">High Risk</option>
                    </select>
                </InputGroup>
                <InputGroup label="Enter Max Trades Per Day">
                    <input type="number" value={maxTrades} onChange={e => setMaxTrades(e.target.value)} className="w-full p-3 bg-primary rounded-r-lg focus:outline-none focus:ring-2 focus:ring-secondary transition text-text-primary font-semibold" />
                </InputGroup>
                <InputGroup label="Enter Lot Size">
                    <input type="number" value={lotSize} onChange={e => setLotSize(e.target.value)} className="w-full p-3 bg-primary rounded-r-lg focus:outline-none focus:ring-2 focus:ring-secondary transition text-text-primary font-semibold" />
                </InputGroup>
            </div>

            {/* --- Calculated Outputs (Updated) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <InputGroup label="Daily Risk Limit %">
                    <input 
                        type="number" 
                        value={(dailyRiskPercent * 100).toFixed(2)} 
                        onChange={e => setDailyRiskPercent(parseFloat(e.target.value) / 100 || 0)} 
                        className="w-full p-3 bg-primary rounded-r-lg focus:outline-none focus:ring-2 focus:ring-secondary transition text-text-primary font-semibold" 
                    />
                </InputGroup>
                <OutputBox label="Your Daily Risk Limit" unit="₹" value={calculations.dailyRiskLimit.toLocaleString('en-IN', { maximumFractionDigits: 0 })} />
                <OutputBox label="Risk Per Trade" unit="₹" value={calculations.riskPerTrade.toLocaleString('en-IN', { maximumFractionDigits: 2 })} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* --- Left Side: SL/Target & R:R --- */}
                <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                       <OutputBox label="StopLoss Points" value={calculations.stopLossPoints.toFixed(2)} />
                       <OutputBox label="Target Points" value={calculations.targetPoints.toFixed(2)} />
                    </div>
                    
                    <div className="bg-primary-light p-6 rounded-lg shadow-lg border border-gray-700">
                        <h3 className="text-xl font-semibold text-text-primary mb-4 text-center">Risk / Reward Ratio</h3>
                        <div className="flex items-center justify-center gap-4">
                            <InputGroup label="Risk">
                                <input type="number" value={riskRatio} onChange={e => setRiskRatio(e.target.value)} className="w-full p-3 bg-primary rounded-r-lg focus:outline-none focus:ring-2 focus:ring-secondary transition text-text-primary font-semibold" />
                            </InputGroup>
                            <InputGroup label="Reward">
                                <input type="number" value={rewardRatio} onChange={e => setRewardRatio(e.target.value)} className="w-full p-3 bg-primary rounded-r-lg focus:outline-none focus:ring-2 focus:ring-secondary transition text-text-primary font-semibold" />
                            </InputGroup>
                        </div>
                    </div>
                </div>

                {/* --- Right Side: Pie Chart --- */}
                <div className="flex justify-center">
                    <PieChart percentage={calculations.winRateNeeded} />
                </div>
            </div>
        </div>
    );
};

export default RiskManagementPage;

import React, { useState, useEffect } from 'react';

// --- SVG Icons ---
const SwapIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
const LoadingSpinner = () => <div className="border-4 border-t-4 border-gray-200 border-t-secondary rounded-full w-8 h-8 animate-spin"></div>;

// List of major currencies for the dropdown (Moved outside the component)
const majorCurrencies = [
    'USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'HKD', 'NZD', 'SEK', 'KRW', 'SGD', 'NOK', 'MXN', 'INR', 'RUB', 'ZAR', 'TRY', 'BRL'
];

const CurrencyConverterPage = () => {
    const [amount, setAmount] = useState(1);
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState('INR');
    const [rates, setRates] = useState({});
    const [currencies, setCurrencies] = useState([]);
    const [convertedAmount, setConvertedAmount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setCurrencies(majorCurrencies);
    }, []);

    useEffect(() => {
        if (fromCurrency) {
            setLoading(true);
            setError('');
            fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`)
                .then(res => {
                    if (!res.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return res.json();
                })
                .then(data => {
                    setRates(data.rates);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Failed to fetch rates:", err);
                    setError('Failed to load exchange rates. Please try again later.');
                    setLoading(false);
                });
        }
    }, [fromCurrency]);

    useEffect(() => {
        if (rates && rates[toCurrency]) {
            const rate = rates[toCurrency];
            setConvertedAmount((amount * rate).toFixed(4));
        }
    }, [amount, rates, toCurrency]);

    const handleSwapCurrencies = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    };

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-primary-light p-8 rounded-2xl shadow-2xl border border-gray-700">
                <h1 className="text-3xl font-bold text-text-primary mb-6 text-center md:hidden">Currency Converter</h1>
                <p className="text-text-secondary text-center mb-8">Get real-time exchange rates for international trading.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    {/* From Currency */}
                    <div className="flex flex-col">
                        <label htmlFor="from" className="text-sm font-semibold text-text-secondary mb-2">From</label>
                        <div className="flex">
                            <input 
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-2/3 p-3 bg-primary rounded-l-lg focus:outline-none focus:ring-2 focus:ring-secondary transition text-lg"
                            />
                            <select 
                                id="from"
                                value={fromCurrency} 
                                onChange={(e) => setFromCurrency(e.target.value)}
                                className="w-1/3 p-3 bg-primary rounded-r-lg focus:outline-none focus:ring-2 focus:ring-secondary transition appearance-none text-center font-semibold"
                            >
                                {currencies.map(currency => <option key={currency} value={currency}>{currency}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Swap Button */}
                    <div className="flex justify-center items-end">
                       <button onClick={handleSwapCurrencies} className="p-3 bg-secondary rounded-full hover:bg-secondary-dark transition-transform duration-300 hover:rotate-180">
                           <SwapIcon />
                       </button>
                    </div>

                    {/* To Currency */}
                    <div className="flex flex-col">
                        <label htmlFor="to" className="text-sm font-semibold text-text-secondary mb-2">To</label>
                        <select 
                            id="to"
                            value={toCurrency} 
                            onChange={(e) => setToCurrency(e.target.value)}
                            className="w-full p-3 bg-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition appearance-none text-center font-semibold text-lg"
                        >
                            {currencies.map(currency => <option key={currency} value={currency}>{currency}</option>)}
                        </select>
                    </div>
                </div>

                {/* Results */}
                <div className="mt-8 text-center">
                    {loading ? (
                        <div className="flex justify-center"><LoadingSpinner /></div>
                    ) : error ? (
                        <p className="text-red-400">{error}</p>
                    ) : convertedAmount !== null && (
                        <div>
                            <p className="text-xl text-text-secondary">{amount} {fromCurrency} =</p>
                            <p className="text-4xl font-bold text-secondary my-2">{convertedAmount} {toCurrency}</p>
                            <p className="text-sm text-text-secondary">1 {fromCurrency} = {rates[toCurrency]?.toFixed(6)} {toCurrency}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CurrencyConverterPage;

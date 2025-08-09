import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        // --- THIS IS THE IMPORTANT PART ---
        // We define the specific URL for the password reset link.
        const actionCodeSettings = {
            url: 'http://localhost:3000/action',
            handleCodeInApp: true,
        };
        // ------------------------------------

        try {
            await sendPasswordResetEmail(auth, email, actionCodeSettings); // Pass the settings here
            setMessage('Password reset link sent! Please check your email.');
        } catch (err) {
            setError('Failed to send password reset email. Please check the address and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-primary flex items-center justify-center p-4">
            <div className="bg-primary-light p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-700">
                <h2 className="text-3xl font-bold mb-6 text-center text-text-primary">Reset Password</h2>
                {message && <p className="bg-green-900 border border-green-700 text-green-300 p-3 rounded-lg mb-4 text-center">{message}</p>}
                {error && <p className="bg-red-900 border border-red-700 text-red-300 p-3 rounded-lg mb-4 text-center">{error}</p>}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 bg-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition text-text-primary"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-secondary hover:bg-secondary-dark text-white font-bold py-3 rounded-lg transition duration-300 disabled:bg-gray-500"
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>
                <p className="mt-6 text-center text-sm text-text-secondary">
                    Remember your password?{' '}
                    <Link to="/login" className="font-medium text-secondary hover:underline">Log In</Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
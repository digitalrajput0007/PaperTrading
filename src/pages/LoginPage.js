import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase';

// --- Helper Components & Icons ---
const EyeIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const EyeSlashIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L6.228 6.228" /></svg>);

const LoginPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams(); // Hook to read URL parameters
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [verificationMessage, setVerificationMessage] = useState('');

    // --- THIS IS THE NEW PART ---
    // When the page loads, check for the 'verified' parameter in the URL
    useEffect(() => {
        if (searchParams.get('verified') === 'true') {
            setVerificationMessage('Email verified successfully! You can now log in.');
        }
    }, [searchParams]);
    // ----------------------------

    const handleResendVerification = async () => {
        if (!auth.currentUser) {
            setError("You must be logged in to resend a verification email.");
            return;
        }
        try {
            await sendEmailVerification(auth.currentUser);
            setError("A new verification email has been sent.");
        } catch (err) {
            setError("Failed to send verification email.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (!user.emailVerified) {
                setError('Please verify your email address before logging in.');
                // Optionally, give them a way to resend the email
                // For simplicity, we can just show the error.
                // You could add a button that calls handleResendVerification.
                setLoading(false);
                return;
            }

            navigate('/');
        } catch (err) {
            setError('Failed to log in. Please check your email and password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-primary flex items-center justify-center p-4">
            <div className="bg-primary-light p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-700">
                <h2 className="text-3xl font-bold mb-6 text-center text-text-primary">Welcome Back</h2>
                
                {/* --- Display the success message here --- */}
                {verificationMessage && <p className="bg-green-900 border border-green-700 text-green-300 p-3 rounded-lg mb-4 text-center">{verificationMessage}</p>}
                {error && <p className="bg-red-900 border border-red-700 text-red-300 p-3 rounded-lg mb-4 text-center">{error}</p>}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">Email Address</label>
                        <input type="email" name="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition text-text-primary" required />
                    </div>
                    <div className="relative">
                        <label htmlFor="password"className="block text-sm font-medium text-text-secondary mb-2">Password</label>
                        <input type={showPassword ? "text" : "password"} name="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition text-text-primary" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 top-7 px-3 flex items-center text-gray-400 hover:text-secondary">
                            {showPassword ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
                        </button>
                    </div>
                    <div className="text-right">
                        <Link to="/forgot-password" className="text-sm text-secondary hover:underline">Forgot Password?</Link>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-secondary hover:bg-secondary-dark text-white font-bold py-3 rounded-lg transition duration-300 disabled:bg-gray-500">
                        {loading ? 'Logging In...' : 'Log In'}
                    </button>
                </form>
                <p className="mt-6 text-center text-sm text-text-secondary">
                    Don't have an account?{' '}
                    <Link to="/signup" className="font-medium text-secondary hover:underline">Sign Up</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
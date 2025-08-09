import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../firebase';

// --- Helper Components & Icons (Copied from SignupPage) ---
const EyeIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const EyeSlashIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L6.228 6.228" /></svg>);
const CheckIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>);
const CrossIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>);
const PasswordStrengthMeter = ({ validation }) => {
    const { length, uppercase, lowercase, number, specialChar } = validation;
    const strength = [length, uppercase, lowercase, number, specialChar].filter(Boolean).length;
    const strengthColors = { 0: 'bg-gray-700', 1: 'bg-red-500', 2: 'bg-orange-500', 3: 'bg-yellow-500', 4: 'bg-blue-500', 5: 'bg-green-500' };
    const strengthText = { 0: '', 1: 'Very Weak', 2: 'Weak', 3: 'Medium', 4: 'Strong', 5: 'Very Strong' }
    return (<div className="space-y-2 mt-2"><div className="w-full bg-gray-700 rounded-full h-2"><div className={`h-2 rounded-full transition-all duration-300 ${strengthColors[strength]}`} style={{ width: `${strength * 20}%` }}></div></div><p className={`text-xs font-semibold ${strength > 3 ? 'text-green-400' : 'text-gray-400'}`}>{strengthText[strength]}</p><ul className="text-xs text-gray-400 space-y-1 text-left"><li className={`flex items-center ${length ? 'text-green-400' : ''}`}>{length ? <CheckIcon /> : <CrossIcon />}<span className="ml-2">At least 8 characters</span></li><li className={`flex items-center ${uppercase ? 'text-green-400' : ''}`}>{uppercase ? <CheckIcon /> : <CrossIcon />}<span className="ml-2">One uppercase letter</span></li><li className={`flex items-center ${lowercase ? 'text-green-400' : ''}`}>{lowercase ? <CheckIcon /> : <CrossIcon />}<span className="ml-2">One lowercase letter</span></li><li className={`flex items-center ${number ? 'text-green-400' : ''}`}>{number ? <CheckIcon /> : <CrossIcon />}<span className="ml-2">One number</span></li><li className={`flex items-center ${specialChar ? 'text-green-400' : ''}`}>{specialChar ? <CheckIcon /> : <CrossIcon />}<span className="ml-2">One special character</span></li></ul></div>);
};

// A helper to get URL parameters
function useQuery() {
  return new URLSearchParams(useSearchParams()[0]);
}

const ActionHandlerPage = () => {
  const query = useQuery();
  const navigate = useNavigate();
  
  const mode = query.get('mode');
  const actionCode = query.get('oobCode');

  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // --- NEW state for the advanced form ---
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({ length: false, uppercase: false, lowercase: false, number: false, specialChar: false });

  const actionHandled = useRef(false);

  // Validate password in real-time
  useEffect(() => {
    setPasswordValidation({
        length: newPassword.length >= 8,
        uppercase: /[A-Z]/.test(newPassword),
        lowercase: /[a-z]/.test(newPassword),
        number: /[0-9]/.test(newPassword),
        specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    });
  }, [newPassword]);

  useEffect(() => {
    if (actionHandled.current) return;
    actionHandled.current = true;

    if (!mode || !actionCode) {
      setStatus('error');
      setMessage('Invalid link. Please try again.');
      return;
    }

    const handleAction = async () => {
      try {
        switch (mode) {
          case 'verifyEmail':
            await applyActionCode(auth, actionCode);
            setStatus('success');
            setMessage('Your email has been verified successfully!');
            break;
          case 'resetPassword':
            await verifyPasswordResetCode(auth, actionCode);
            setStatus('passwordReset');
            setMessage('Please enter your new password.');
            break;
          default:
            setStatus('error');
            setMessage('Invalid action. Please try again.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Invalid or expired link. Please request a new one.');
      }
    };

    handleAction();
  }, [mode, actionCode]);

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const isPasswordValid = Object.values(passwordValidation).every(Boolean);

    if (!isPasswordValid) {
        return setError("Password does not meet all the requirements.");
    }
    if (newPassword !== confirmPassword) {
        return setError("Passwords do not match.");
    }

    setStatus('loading');
    try {
      await confirmPasswordReset(auth, actionCode, newPassword);
      setStatus('success');
      setMessage('Your password has been reset successfully!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setStatus('error');
      setMessage('Failed to reset password. The link may have expired.');
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return <p className="text-text-primary">Verifying...</p>;
      case 'success':
        return (
          <>
            <h2 className="text-2xl font-bold text-green-400 mb-4">Success!</h2>
            <p className="text-text-primary mb-6">{message}</p>
            <Link to="/login" className="w-full bg-secondary hover:bg-secondary-dark text-white font-bold py-3 rounded-lg transition duration-300 inline-block text-center">
              Go to Login
            </Link>
          </>
        );
      case 'error':
        return (
          <>
            <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
            <p className="text-text-primary">{message}</p>
          </>
        );
      case 'passwordReset':
        const isPasswordValid = Object.values(passwordValidation).every(Boolean);
        return (
          <>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Reset Your Password</h2>
            {error && <p className="bg-red-900 border border-red-700 text-red-300 p-3 rounded-lg mb-4 text-center text-sm">{error}</p>}
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="relative">
                <label className="block text-text-secondary text-sm font-bold mb-2 text-left" htmlFor="newPassword">New Password</label>
                <input id="newPassword" type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-3 bg-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition text-text-primary" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 top-7 px-3 flex items-center text-gray-400 hover:text-secondary">{showPassword ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}</button>
              </div>
              {newPassword && <PasswordStrengthMeter validation={passwordValidation} />}
              <div className="relative">
                <label className="block text-text-secondary text-sm font-bold mb-2 text-left" htmlFor="confirmPassword">Confirm New Password</label>
                <input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-3 bg-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition text-text-primary" required />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 top-7 px-3 flex items-center text-gray-400 hover:text-secondary">{showConfirmPassword ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}</button>
              </div>
              <button type="submit" disabled={!isPasswordValid} className="w-full bg-secondary hover:bg-secondary-dark text-white font-bold py-3 rounded-lg transition duration-300 disabled:bg-gray-500">
                Save New Password
              </button>
            </form>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="bg-primary-light p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-700 text-center">
        {renderContent()}
      </div>
    </div>
  );
};

export default ActionHandlerPage;
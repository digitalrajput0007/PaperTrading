import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../firebase'; // Ensure this path is correct

// --- Helper Components & Icons ---

// Eye icon for password visibility toggle
const EyeIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// Eye-slash icon for password visibility toggle
const EyeSlashIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L6.228 6.228" />
  </svg>
);

// Checkmark icon for validation checklist
const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

// Cross icon for validation checklist
const CrossIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// Password strength meter and validation checklist component
const PasswordStrengthMeter = ({ validation }) => {
    const { length, uppercase, lowercase, number, specialChar } = validation;
    const strength = [length, uppercase, lowercase, number, specialChar].filter(Boolean).length;
    
    const strengthColors = {
        0: 'bg-gray-700', 1: 'bg-red-500', 2: 'bg-orange-500',
        3: 'bg-yellow-500', 4: 'bg-blue-500', 5: 'bg-green-500'
    };
    const strengthText = {
        0: '', 1: 'Very Weak', 2: 'Weak', 3: 'Medium', 4: 'Strong', 5: 'Very Strong'
    }

    return (
        <div className="space-y-2 mt-2">
            <div className="w-full bg-gray-700 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all duration-300 ${strengthColors[strength]}`} style={{ width: `${strength * 20}%` }}></div>
            </div>
            <p className={`text-xs font-semibold ${strength > 3 ? 'text-green-400' : 'text-gray-400'}`}>{strengthText[strength]}</p>
            <ul className="text-xs text-gray-400 space-y-1">
                <li className={`flex items-center ${length ? 'text-green-400' : ''}`}>{length ? <CheckIcon /> : <CrossIcon />}<span className="ml-2">At least 8 characters</span></li>
                <li className={`flex items-center ${uppercase ? 'text-green-400' : ''}`}>{uppercase ? <CheckIcon /> : <CrossIcon />}<span className="ml-2">One uppercase letter</span></li>
                <li className={`flex items-center ${lowercase ? 'text-green-400' : ''}`}>{lowercase ? <CheckIcon /> : <CrossIcon />}<span className="ml-2">One lowercase letter</span></li>
                <li className={`flex items-center ${number ? 'text-green-400' : ''}`}>{number ? <CheckIcon /> : <CrossIcon />}<span className="ml-2">One number</span></li>
                <li className={`flex items-center ${specialChar ? 'text-green-400' : ''}`}>{specialChar ? <CheckIcon /> : <CrossIcon />}<span className="ml-2">One special character</span></li>
            </ul>
        </div>
    );
};


const ResetPasswordPage = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isValidCode, setIsValidCode] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordValidation, setPasswordValidation] = useState({
    length: false, uppercase: false, lowercase: false, number: false, specialChar: false,
  });

  const location = useLocation();
  const navigate = useNavigate();
  
  const oobCode = React.useMemo(() => {
    const queryParams = new URLSearchParams(location.search);
    return queryParams.get('oobCode');
  }, [location.search]);

  useEffect(() => {
    if (!oobCode) {
      setError('Invalid or missing password reset code.');
      setLoading(false);
      return;
    }
    const verifyCode = async () => {
      try {
        await verifyPasswordResetCode(auth, oobCode);
        setIsValidCode(true);
      } catch (err) {
        setError('The password reset link is invalid, expired, or has already been used.');
        setIsValidCode(false);
      } finally {
        setLoading(false);
      }
    };
    verifyCode();
  }, [oobCode]);

  // Effect to validate password in real-time
  useEffect(() => {
    setPasswordValidation({
        length: newPassword.length >= 8,
        uppercase: /[A-Z]/.test(newPassword),
        lowercase: /[a-z]/.test(newPassword),
        number: /[0-9]/.test(newPassword),
        specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    });
  }, [newPassword]);

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!isPasswordValid) {
        setError('Password does not meet all the requirements.');
        return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setMessage('Your password has been successfully reset.');
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    } catch (err) {
      setError('Failed to reset password. The link may have expired or been used.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isValidCode) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <p>Verifying reset link...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4 font-sans">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-sm border border-gray-700">
        <h2 className="text-3xl font-bold mb-6 text-center text-cyan-400">Set New Password</h2>
        
        {error && !isValidCode && (
          <div>
            <p className="bg-red-900 border border-red-700 text-red-300 p-3 rounded-lg mb-4 text-center text-sm">{error}</p>
            <p className="mt-4 text-center text-sm text-gray-400">
              <Link to="/forgot-password" className="font-medium text-cyan-400 hover:underline">
                Request a new password reset link.
              </Link>
            </p>
          </div>
        )}
        
        {message && (
          <div>
            <p className="bg-green-900 border border-green-700 text-green-300 p-3 rounded-lg mb-4 text-center text-sm">{message}</p>
            <p className="mt-4 text-center text-sm text-gray-400">
              <Link to="/login" className="font-medium text-cyan-400 hover:underline">
                Click here to log in.
              </Link>
            </p>
          </div>
        )}

        {isValidCode && !message && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-sm text-gray-400 text-center">
              Please enter and confirm your new password.
            </p>
            {error && <p className="bg-red-900 border border-red-700 text-red-300 p-3 rounded-lg text-center text-sm">{error}</p>}
            
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                required
              />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-cyan-400">
                  {showNewPassword ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
              </button>
            </div>

            {newPassword && <PasswordStrengthMeter validation={passwordValidation} />}

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                required
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-cyan-400">
                  {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordValid}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-lg transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Set New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;

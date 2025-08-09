import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

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

const ChangePasswordPage = () => {
  const { reauthenticate, updatePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({ length: false, uppercase: false, lowercase: false, number: false, specialChar: false });

  useEffect(() => {
    setPasswordValidation({
        length: newPassword.length >= 8,
        uppercase: /[A-Z]/.test(newPassword),
        lowercase: /[a-z]/.test(newPassword),
        number: /[0-9]/.test(newPassword),
        specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    });
  }, [newPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const isPasswordValid = Object.values(passwordValidation).every(Boolean);

    if (!isPasswordValid) {
        return setError("New password does not meet all the requirements.");
    }
    if (newPassword !== confirmPassword) {
        return setError("New passwords do not match.");
    }

    setIsLoading(true);
    try {
      // Step 1: Re-authenticate the user with their current password
      await reauthenticate(currentPassword);
      
      // Step 2: If re-authentication is successful, update to the new password
      await updatePassword(newPassword);

      setMessage('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      // Handle specific error for wrong password
      if (err.code === 'auth/wrong-password') {
        setError('Incorrect current password. Please try again.');
      } else {
        setError('Failed to update password. Please try again.');
        console.error(err);
      }
    }
    setIsLoading(false);
  };

  const isNewPasswordValid = Object.values(passwordValidation).every(Boolean);

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-6">Change Your Password</h1>
      <div className="bg-primary-light p-8 rounded-lg shadow-lg max-w-lg mx-auto">
        {error && <p className="text-center mb-4 text-red-500">{error}</p>}
        {message && <p className="text-center mb-4 text-green-500">{message}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="relative">
            <label className="block text-text-secondary text-sm font-bold mb-2" htmlFor="current-password">Current Password</label>
            <input id="current-password" type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 bg-primary text-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-secondary" required />
            <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute inset-y-0 right-0 top-7 px-3 flex items-center text-gray-400 hover:text-secondary">{showCurrentPassword ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}</button>
          </div>

          <div className="relative">
            <label className="block text-text-secondary text-sm font-bold mb-2" htmlFor="new-password">New Password</label>
            <input id="new-password" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 bg-primary text-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-secondary" required />
            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 top-7 px-3 flex items-center text-gray-400 hover:text-secondary">{showNewPassword ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}</button>
          </div>
          
          {newPassword && <PasswordStrengthMeter validation={passwordValidation} />}

          <div className="relative">
            <label className="block text-text-secondary text-sm font-bold mb-2" htmlFor="confirm-password">Confirm New Password</label>
            <input id="confirm-password" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 bg-primary text-text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-secondary" required />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 top-7 px-3 flex items-center text-gray-400 hover:text-secondary">{showConfirmPassword ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}</button>
          </div>

          <div className="pt-4">
            <button type="submit" disabled={isLoading || !isNewPasswordValid} className="bg-secondary hover:bg-secondary-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:bg-gray-500">
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
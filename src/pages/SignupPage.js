import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// --- Helper Components & Icons (No changes needed here) ---
const EyeIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const EyeSlashIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L6.228 6.228" /></svg>);
const CheckIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>);
const CrossIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>);
const PasswordStrengthMeter = ({ validation }) => {
    const { length, uppercase, lowercase, number, specialChar } = validation;
    const strength = [length, uppercase, lowercase, number, specialChar].filter(Boolean).length;
    const strengthColors = { 0: 'bg-gray-700', 1: 'bg-red-500', 2: 'bg-orange-500', 3: 'bg-yellow-500', 4: 'bg-blue-500', 5: 'bg-green-500' };
    const strengthText = { 0: '', 1: 'Very Weak', 2: 'Weak', 3: 'Medium', 4: 'Strong', 5: 'Very Strong' }
    return (<div className="space-y-2 mt-2"><div className="w-full bg-gray-700 rounded-full h-2"><div className={`h-2 rounded-full transition-all duration-300 ${strengthColors[strength]}`} style={{ width: `${strength * 20}%` }}></div></div><p className={`text-xs font-semibold ${strength > 3 ? 'text-green-400' : 'text-gray-400'}`}>{strengthText[strength]}</p><ul className="text-xs text-text-secondary space-y-1"><li className={`flex items-center ${length ? 'text-green-400' : ''}`}>{length ? <CheckIcon /> : <CrossIcon />}<span className="ml-2">At least 8 characters long</span></li><li className={`flex items-center ${uppercase ? 'text-green-400' : ''}`}>{uppercase ? <CheckIcon /> : <CrossIcon />}<span className="ml-2">At least one uppercase letter (A-Z)</span></li><li className={`flex items-center ${lowercase ? 'text-green-400' : ''}`}>{lowercase ? <CheckIcon /> : <CrossIcon />}<span className="ml-2">At least one lowercase letter (a-z)</span></li><li className={`flex items-center ${number ? 'text-green-400' : ''}`}>{number ? <CheckIcon /> : <CrossIcon />}<span className="ml-2">At least one number (0-9)</span></li><li className={`flex items-center ${specialChar ? 'text-green-400' : ''}`}>{specialChar ? <CheckIcon /> : <CrossIcon />}<span className="ml-2">At least one special character (!@#$%)</span></li></ul></div>);
};


const SignupPage = () => {
    const navigate = useNavigate();
    const { signup } = useAuth();
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', mobile: '', gender: '', password: '', confirmPassword: '' });
    const [agree, setAgree] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordValidation, setPasswordValidation] = useState({ length: false, uppercase: false, lowercase: false, number: false, specialChar: false });

    useEffect(() => {
        const password = formData.password;
        setPasswordValidation({ 
            length: password.length >= 8, 
            uppercase: /[A-Z]/.test(password), 
            lowercase: /[a-z]/.test(password), 
            number: /[0-9]/.test(password), 
            specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password) 
        });
    }, [formData.password]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'mobile') {
            if (/^[0-9\b]{0,10}$/.test(value)) {
                setFormData({ ...formData, [name]: value });
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };
    
    const isPasswordValid = Object.values(passwordValidation).every(Boolean);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!isPasswordValid) {
            toast.error("Password does not meet all the requirements.");
            setLoading(false);
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match.");
            setLoading(false);
            return;
        }
        if (!agree) {
            toast.error("You must agree to the terms and conditions.");
            setLoading(false);
            return;
        }

        try {
            await signup(
                formData.email, 
                formData.password, 
                formData.firstName, 
                formData.lastName,
                formData.mobile,
                formData.gender
            );
            
            navigate('/login');

        } catch (err) {
            console.error("Signup failed on page:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-primary flex items-center justify-center p-4">
            <div className="bg-primary-light p-8 rounded-lg shadow-lg w-full max-w-lg border border-gray-700">
                <h2 className="text-3xl font-bold mb-6 text-center text-text-primary">Create Your Account</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} className="w-full p-3 bg-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition text-text-primary" required />
                        <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} className="w-full p-3 bg-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition text-text-primary" required />
                    </div>
                    <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} className="w-full p-3 bg-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition text-text-primary" required />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="tel" name="mobile" placeholder="Mobile Number" value={formData.mobile} onChange={handleChange} className="w-full p-3 bg-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition text-text-primary" />
                        <select 
                            name="gender" 
                            value={formData.gender} 
                            onChange={handleChange} 
                            className={`w-full p-3 bg-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition ${formData.gender ? 'text-text-primary' : 'text-gray-500'}`} 
                            required
                        >
                            <option value="" disabled>Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                    <div className="relative">
                        <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full p-3 bg-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition text-text-primary" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-text-secondary hover:text-secondary">{showPassword ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}</button>
                    </div>
                    {formData.password && <PasswordStrengthMeter validation={passwordValidation} />}
                    <div className="relative">
                        <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} className="w-full p-3 bg-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition text-text-primary" required />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-text-secondary hover:text-secondary">{showConfirmPassword ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}</button>
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" id="agree" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="h-4 w-4 text-secondary bg-gray-700 border-gray-600 rounded focus:ring-secondary" />
                        <label htmlFor="agree" className="ml-2 block text-sm text-text-secondary">
                            I agree to the <button type="button" className="font-medium text-secondary hover:underline" onClick={() => toast('Terms and Conditions page is not yet implemented.')}>Terms and Conditions</button>
                        </label>
                    </div>
                    <button type="submit" disabled={loading || !isPasswordValid} className="w-full bg-secondary hover:bg-secondary-dark text-white font-bold py-3 rounded-lg transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed">{loading ? 'Creating Account...' : 'Sign Up'}</button>
                </form>
                <p className="mt-6 text-center text-sm text-text-secondary">Already have an account?{' '}<Link to="/login" className="font-medium text-secondary hover:underline">Log In</Link></p>
            </div>
        </div>
    );
};

export default SignupPage;

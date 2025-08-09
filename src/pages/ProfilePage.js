import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { currentUser, userData, updateUserDetails } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    photoURL: '',
    gender: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  // This effect will correctly populate the form when userData loads
  useEffect(() => {
    if (userData) {
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        mobile: userData.mobile || '',
        photoURL: userData.photoURL || '',
        gender: userData.gender || '',
      });
    }
  }, [userData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Only editable fields can be changed
    if (name === 'firstName' || name === 'lastName' || name === 'photoURL') {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. ADDED VALIDATION: Check for empty required fields
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
        toast.error("First Name and Last Name cannot be empty.");
        return; // Stop the submission if validation fails
    }

    setIsLoading(true);
    
    // We only want to update the fields that are editable on this form
    const dataToUpdate = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        photoURL: formData.photoURL,
    };

    try {
      await updateUserDetails(currentUser.uid, dataToUpdate);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update details. Please try again.');
      console.error("Profile update error:", error);
    }

    setIsLoading(false);
  };

  if (!userData) {
      return <p className="text-center text-text-secondary">Loading Profile...</p>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-6">Edit Your Profile</h1>
      
      <div className="bg-primary-light p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
        
        <div className="flex flex-col items-center mb-8">
          <img 
            src={formData.photoURL || `https://ui-avatars.com/api/?name=${formData.firstName || 'User'}&background=0D8ABC&color=fff&size=128`} 
            alt="Profile" 
            className="w-32 h-32 rounded-full object-cover border-4 border-gray-600"
            onError={(e) => { e.target.onerror = null; e.target.src=`https://ui-avatars.com/api/?name=${formData.firstName || 'U'}&background=dc2626&color=fff&size=128`}}
          />
           <h2 className="text-2xl font-bold text-text-primary mt-4">{`${formData.firstName} ${formData.lastName}`}</h2>
           <p className="text-text-secondary">{currentUser?.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* --- Editable Fields --- */}
          <div>
            <label className="block text-text-secondary text-sm font-bold mb-2" htmlFor="photoURL">Profile Picture URL</label>
            <input id="photoURL" name="photoURL" type="url" placeholder="https://example.com/image.png" value={formData.photoURL} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 bg-primary text-text-primary leading-tight focus:outline-none focus:shadow-outline" />
          </div>

          <div>
            <label className="block text-text-secondary text-sm font-bold mb-2" htmlFor="firstName">First Name</label>
            <input id="firstName" name="firstName" type="text" value={formData.firstName} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 bg-primary text-text-primary leading-tight focus:outline-none focus:shadow-outline" required />
          </div>

          <div>
            <label className="block text-text-secondary text-sm font-bold mb-2" htmlFor="lastName">Last Name</label>
            <input id="lastName" name="lastName" type="text" value={formData.lastName} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 bg-primary text-text-primary leading-tight focus:outline-none focus:shadow-outline" required />
          </div>
          
          {/* --- 2. NON-EDITABLE FIELDS --- */}
          <div>
            <label className="block text-text-secondary text-sm font-bold mb-2" htmlFor="email">Email Address</label>
            <input id="email" type="email" value={currentUser?.email || ''} disabled className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-600 text-gray-400 leading-tight focus:outline-none focus:shadow-outline cursor-not-allowed" />
          </div>

          <div>
            <label className="block text-text-secondary text-sm font-bold mb-2" htmlFor="mobile">Mobile Number</label>
            <input id="mobile" type="tel" value={formData.mobile} disabled className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-600 text-gray-400 leading-tight focus:outline-none focus:shadow-outline cursor-not-allowed" />
          </div>
          
          <div>
              <label className="block text-text-secondary text-sm font-bold mb-2" htmlFor="gender">Gender</label>
              <input id="gender" type="text" value={formData.gender} disabled className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-600 text-gray-400 leading-tight focus:outline-none focus:shadow-outline cursor-not-allowed" />
          </div>
          
          <div className="flex items-center justify-end pt-4">
            <button type="submit" disabled={isLoading} className="bg-secondary hover:bg-secondary-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full md:w-auto">
              {isLoading ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;

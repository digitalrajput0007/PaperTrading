import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';

// --- SVG Icons (no changes) ---
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const SizerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>;
const PaperTradeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const PortfolioIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const ProfileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const PasswordIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const DownArrowIcon = () => <svg className="w-4 h-4 ml-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>;

const AppShell = ({ children }) => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const navLinkClasses = "flex items-center p-3 my-1 rounded-lg text-text-secondary hover:bg-primary-light hover:text-text-primary transition-colors duration-200";
  const activeNavLinkClasses = "bg-secondary text-white shadow-lg";
  const userFullName = userData ? `${userData.firstName} ${userData.lastName}` : (currentUser?.email);

  return (
    <div className="flex h-screen bg-primary">
      <aside className="w-64 flex-shrink-0 bg-primary-light p-4 flex flex-col justify-between border-r border-gray-700">
        <div>
          <div className="flex items-center mb-10">
            <svg className="h-8 w-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            <h1 className="text-xl font-bold ml-2 text-text-primary">TradeDash</h1>
          </div>
          <nav>
            <NavLink to="/" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`} end><DashboardIcon /><span className="ml-4">Dashboard</span></NavLink>
            <NavLink to="/position-sizer" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}><SizerIcon /><span className="ml-4">Position Sizer</span></NavLink>
            <NavLink to="/paper-trade" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}><PaperTradeIcon /><span className="ml-4">Paper Trade</span></NavLink>
            <NavLink to="/portfolio" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}><PortfolioIcon /><span className="ml-4">Portfolio</span></NavLink>
          </nav>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-primary-light border-b border-gray-700 p-4 flex justify-end items-center">
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center focus:outline-none">
              {/* --- THIS IS THE UPDATED PROFILE PICTURE SECTION --- */}
              {userData?.photoURL ? (
                <img src={userData.photoURL} alt="Profile" className="w-10 h-10 rounded-full object-cover mr-3" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-white mr-3">
                  {userData?.firstName?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <span className="text-text-primary font-semibold hidden md:inline">{userFullName}</span>
              <DownArrowIcon />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-primary-light rounded-lg shadow-xl py-2 border border-gray-700">
                <Link to="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center px-4 py-2 text-sm text-text-secondary hover:bg-primary hover:text-text-primary">
                  <ProfileIcon />
                  Edit Profile
                </Link>
                <Link to="/change-password" onClick={() => setDropdownOpen(false)} className="flex items-center px-4 py-2 text-sm text-text-secondary hover:bg-primary hover:text-text-primary">
                  <PasswordIcon />
                  Change Password
                </Link>
                <div className="border-t border-gray-600 my-1"></div>
                <button onClick={handleLogout} className="flex items-center w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-primary hover:text-text-primary">
                  <LogoutIcon />
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
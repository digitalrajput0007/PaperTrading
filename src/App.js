import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// --- Import Your Page Components ---
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage'; 
import PaperTradePage from './pages/PaperTradePage';
import PositionSizerPage from './pages/PositionSizerPage';
import CurrencyConverterPage from './pages/CurrencyConverterPage';
import RiskManagementPage from './pages/RiskManagementPage';
import AdminPage from './pages/AdminPage';
import ActionHandlerPage from './pages/ActionHandlerPage';
import ProfilePage from './pages/ProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import RankingPage from './pages/RankingPage'; // <-- Import the new RankingPage

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          
          {/* Action Handler Routes */}
          <Route path="/action" element={<ActionHandlerPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Private User Routes */}
          <Route path="/" element={<ProtectedRoute><PaperTradePage /></ProtectedRoute>} />
          <Route path="/position-sizer" element={<ProtectedRoute><PositionSizerPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
          <Route path="/currency-converter" element={<ProtectedRoute><CurrencyConverterPage /></ProtectedRoute>} />
          <Route path="/risk-management" element={<ProtectedRoute><RiskManagementPage /></ProtectedRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          {/* --- ADD THIS NEW ROUTE FOR RANKING --- */}
          <Route path="/ranking" element={<AdminRoute><RankingPage /></AdminRoute>} />

        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

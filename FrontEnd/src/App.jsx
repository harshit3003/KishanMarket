import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LandingPage from './pages/LandingPage';
import NotFound from './pages/NotFound';
import RegistrationPage from './pages/RegistrationPage';
import LoginPage from './pages/LoginPage';
import BuyerPage from './pages/BuyerPage';
import SellerPage from './pages/SellerPage';
import BuyyersProfile from './pages/BuyyersProfile';
import SellersProfile from './pages/SellersProfile';
import MyOrder from './pages/MyOrder';
import BackgroundLayer from './components/BackgroundLayer';

// A simple wrapper to protect dashboard routes
const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem('currentUser');
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Wrapper to prevent logged-in users from seeing login/register
const AuthRoute = ({ children }) => {
  const userStr = localStorage.getItem('currentUser');
  if (userStr) {
    const user = JSON.parse(userStr);
    return <Navigate to={user.role === 'seller' ? '/seller' : '/buyer'} replace />;
  }
  return children;
};

function App() {
  return (
    <>
      <BackgroundLayer />
      <Toaster position="top-right" toastOptions={{ className: 'glass-card-premium fw-bold text-dark' }} />
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<AuthRoute><LandingPage /></AuthRoute>} />
          
          {/* Public authentication pages */}
          <Route path="/register" element={<AuthRoute><RegistrationPage /></AuthRoute>} />
          <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
          
          {/* Protected Dashboard Routes */}
          <Route path="/buyer" element={<ProtectedRoute><BuyerPage /></ProtectedRoute>} />
          <Route path="/seller" element={<ProtectedRoute><SellerPage /></ProtectedRoute>} />
          <Route path="/profile/buyer" element={<ProtectedRoute><BuyyersProfile /></ProtectedRoute>} />
          <Route path="/profile/seller" element={<ProtectedRoute><SellersProfile /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><MyOrder /></ProtectedRoute>} />

          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;

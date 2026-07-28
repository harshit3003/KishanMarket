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

const ProtectedRoute = ({ children }) => {
  const isAuth = sessionStorage.getItem('isAuthenticated') === 'true';
  const userStr = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
  if (!isAuth || !userStr) {
    toast.error("Please enter your credentials to log in.", { id: 'auth_err' });
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Strict Role Guard for Buyers
const BuyerRoute = ({ children }) => {
  const isAuth = sessionStorage.getItem('isAuthenticated') === 'true';
  const userStr = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
  if (!isAuth || !userStr) {
    toast.error("Please enter your credentials to log in.", { id: 'auth_buyer_err' });
    return <Navigate to="/login" replace />;
  }
  const user = JSON.parse(userStr);
  if (user.role !== 'buyer') return <Navigate to="/seller" replace />;
  return children;
};

// Strict Role Guard for Sellers
const SellerRoute = ({ children }) => {
  const isAuth = sessionStorage.getItem('isAuthenticated') === 'true';
  const userStr = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
  if (!isAuth || !userStr) {
    toast.error("Please enter your credentials to log in.", { id: 'auth_seller_err' });
    return <Navigate to="/login" replace />;
  }
  const user = JSON.parse(userStr);
  if (user.role !== 'seller') return <Navigate to="/buyer" replace />;
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
          <Route path="/" element={<LandingPage />} />
          
          {/* Public authentication pages - Always accessible for credential entry */}
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Dashboard Routes - Strict Role Isolation */}
          <Route path="/buyer" element={<BuyerRoute><BuyerPage /></BuyerRoute>} />
          <Route path="/profile/buyer" element={<BuyerRoute><BuyyersProfile /></BuyerRoute>} />
          
          <Route path="/seller" element={<SellerRoute><SellerPage /></SellerRoute>} />
          <Route path="/profile/seller" element={<SellerRoute><SellersProfile /></SellerRoute>} />
          
          <Route path="/orders" element={<ProtectedRoute><MyOrder /></ProtectedRoute>} />

          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;

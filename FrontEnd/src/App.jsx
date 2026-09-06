import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import BackgroundLayer from './components/BackgroundLayer';
import PageTransition from './components/PageTransition';

// Lazy-loaded page components for optimal bundle splitting & fast load times
const LandingPage = lazy(() => import('./pages/LandingPage'));
const NotFound = lazy(() => import('./pages/NotFound'));
const RegistrationPage = lazy(() => import('./pages/RegistrationPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const BuyerPage = lazy(() => import('./pages/BuyerPage'));
const SellerPage = lazy(() => import('./pages/SellerPage'));
const BuyyersProfile = lazy(() => import('./pages/BuyyersProfile'));
const SellersProfile = lazy(() => import('./pages/SellersProfile'));
const MyOrder = lazy(() => import('./pages/MyOrder'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

const PageLoader = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
    <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}></div>
  </div>
);

const getUser = () => {
  const userStr = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
};

const ProtectedRoute = ({ children }) => {
  const user = getUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Dedicated Guard for Admin
const AdminRoute = ({ children }) => {
  const user = getUser();
  const token = sessionStorage.getItem('adminToken');
  if (!user && token !== 'KM_ADMIN_AUTHORIZED_TOKEN_2026') {
    return <Navigate to="/login" replace />;
  }
  if (user && user.role !== 'admin' && token !== 'KM_ADMIN_AUTHORIZED_TOKEN_2026') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Strict Role Guard for Buyers
const BuyerRoute = ({ children }) => {
  const user = getUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role !== 'buyer') return <Navigate to="/seller" replace />;
  return children;
};

// Strict Role Guard for Sellers
const SellerRoute = ({ children }) => {
  const user = getUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role !== 'seller') return <Navigate to="/buyer" replace />;
  return children;
};

function App() {
  return (
    <>
      <BackgroundLayer />
      <Toaster position="top-right" toastOptions={{ className: 'glass-card-premium fw-bold text-dark' }} />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
            
            {/* Public authentication pages - Always accessible for credential entry */}
            <Route path="/register" element={<PageTransition><RegistrationPage /></PageTransition>} />
            <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
            
            {/* Dedicated Admin Portal Route */}
            <Route path="/admin" element={<AdminRoute><PageTransition><AdminPage /></PageTransition></AdminRoute>} />

            {/* Protected Dashboard Routes - Strict Role Isolation */}
            <Route path="/buyer" element={<BuyerRoute><PageTransition><BuyerPage /></PageTransition></BuyerRoute>} />
            <Route path="/profile/buyer" element={<BuyerRoute><PageTransition><BuyyersProfile /></PageTransition></BuyerRoute>} />
            
            <Route path="/seller" element={<SellerRoute><PageTransition><SellerPage /></PageTransition></SellerRoute>} />
            <Route path="/profile/seller" element={<SellerRoute><PageTransition><SellersProfile /></PageTransition></SellerRoute>} />
            
            <Route path="/myorder" element={<ProtectedRoute><PageTransition><MyOrder /></PageTransition></ProtectedRoute>} />
            
            {/* Catch-all 404 */}
            <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  );
}

export default App;

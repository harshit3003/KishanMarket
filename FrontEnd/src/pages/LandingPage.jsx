import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../assets/global.css';
import '../assets/dynamic-features.css';

const LandingPage = () => {
  const navigate = useNavigate();

  const [activeUser, setActiveUser] = React.useState(null);

  React.useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        setActiveUser(JSON.parse(userStr));
      } catch (e) {}
    }
  }, []);

  return (
    <>
            
      {/* Premium Navbar */}
      <nav className="navbar" style={{ position: 'fixed', top: 0, width: '100%', zIndex: 1000, background: 'rgba(27, 67, 50, 0.8)', backdropFilter: 'blur(15px)' }}>
        <div className="container d-flex justify-content-between align-items-center">
          <Link className="navbar-brand fw-bold text-decoration-none" to="/" style={{ color: 'white' }}>
            <i className="fas fa-seedling me-2"></i>Kishan<span style={{ color: '#f59e0b' }}>Market</span>
          </Link>
          <div className="d-flex gap-3 align-items-center">
            {activeUser ? (
              <Link to={activeUser.role === 'seller' ? '/seller' : '/buyer'} className="btn btn-warning rounded-pill px-4 fw-bold shadow">
                Dashboard ({activeUser.name}) <i className="fas fa-arrow-right ms-1"></i>
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-light rounded-pill px-4 fw-bold">
                  Login
                </Link>
                <Link to="/register" className="btn btn-success rounded-pill px-4 fw-bold shadow">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container d-flex flex-column justify-content-center align-items-center text-center" style={{ minHeight: '100vh', paddingTop: '80px' }}>
        <div className="glass-card-premium p-5 mb-5" style={{ maxWidth: '800px', animation: 'fadeInUp 0.8s ease' }}>
          <h1 className="fw-bold mb-4" style={{ color: 'var(--primary)', fontSize: '3rem', letterSpacing: '-1px' }}>
            Kisaan aur Vyapari ka<br />
            <span style={{ color: '#f59e0b' }}>Sahi Sangam</span>
          </h1>
          <p className="lead text-muted mb-5 px-md-4">
            India's most advanced digital marketplace for agriculture. Direct bidding, live mandi rates, transparent logistics, and AI-powered weather & price predictions.
          </p>
          <div className="d-flex justify-content-center gap-4 flex-wrap">
            <Link to="/register" className="btn btn-success btn-lg rounded-pill px-5 fw-bold shadow-lg btn-premium-hover">
              Get Started Now <i className="fas fa-arrow-right ms-2"></i>
            </Link>
            <Link to="/login" className="btn btn-lg rounded-pill px-4 fw-bold text-white shadow-lg btn-premium-hover" style={{ backgroundColor: '#1b4332', border: '2px solid #081c15' }}>
              I already have an account
            </Link>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="row g-4 w-100" style={{ maxWidth: '1000px' }}>
          <div className="col-md-4">
            <div className="glass-card-premium p-4 text-center h-100" style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}>
              <div className="mb-3" style={{ transform: 'translateZ(20px)' }}>
                <i className="fas fa-hand-holding-dollar fa-3x text-success"></i>
              </div>
              <h5 className="fw-bold" style={{ transform: 'translateZ(30px)' }}>Direct Bidding</h5>
              <p className="text-muted small m-0" style={{ transform: 'translateZ(10px)' }}>Negotiate directly without middlemen. Real-time chat and counter-offers.</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="glass-card-premium p-4 text-center h-100" style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}>
              <div className="mb-3" style={{ transform: 'translateZ(20px)' }}>
                <i className="fas fa-chart-line fa-3x text-success"></i>
              </div>
              <h5 className="fw-bold" style={{ transform: 'translateZ(30px)' }}>Live Analytics</h5>
              <p className="text-muted small m-0" style={{ transform: 'translateZ(10px)' }}>Access local Mandi prices, profit trends, and AI price predictions.</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="glass-card-premium p-4 text-center h-100" style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}>
              <div className="mb-3" style={{ transform: 'translateZ(20px)' }}>
                <i className="fas fa-truck fa-3x text-success"></i>
              </div>
              <h5 className="fw-bold" style={{ transform: 'translateZ(30px)' }}>Live Logistics</h5>
              <p className="text-muted small m-0" style={{ transform: 'translateZ(10px)' }}>Track your orders via GPS with beautiful progress tracking dashboards.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LandingPage;

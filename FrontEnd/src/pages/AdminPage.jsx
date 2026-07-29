import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminDashboardModal from '../components/AdminDashboardModal';
import '../assets/global.css';
import '../assets/dynamic-features.css';

const AdminPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setCurrentUser(u);
      } catch (e) {}
    }
  }, []);

  const handleLogout = (e) => {
    if (e) e.preventDefault();
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('isAuthenticated');
    toast.success("SuperAdmin session closed.");
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)', color: '#fff', paddingBottom: '40px' }}>
      {/* SuperAdmin Top Header */}
      <nav className="navbar navbar-dark shadow-sm mb-4" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="container d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <i className="fas fa-shield-halved text-warning fs-3"></i>
            <div>
              <h5 className="m-0 fw-bold text-white">Kishan<span style={{ color: '#f59e0b' }}>Market</span> Governance HQ</h5>
              <small className="text-success fw-bold"><i className="fas fa-circle text-success me-1" style={{ fontSize: '0.6rem' }}></i> Live SuperAdmin Active Session</small>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            <span className="badge bg-warning text-dark px-3 py-2 fw-bold rounded-pill">
              <i className="fas fa-user-shield me-1"></i> SuperAdmin
            </span>
            <button className="btn btn-outline-light btn-sm fw-bold px-3 rounded-pill" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt me-1"></i> Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        {/* Directly embed AdminDashboardModal in full view mode */}
        <AdminDashboardModal isOpen={true} onClose={() => navigate('/login')} />
      </div>
    </div>
  );
};

export default AdminPage;

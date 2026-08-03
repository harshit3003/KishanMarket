import React from 'react';

const AdminNavbar = ({ onLogout }) => {
  return (
    <nav className="navbar navbar-dark shadow" style={{ background: '#111827', borderBottom: '1px solid #1f2937', position: 'relative', zIndex: 999999 }}>
      <div className="container d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <i className="fas fa-shield-halved text-warning fs-2"></i>
          <div>
            <h4 className="m-0 fw-bold text-white">Kishan<span style={{ color: '#f59e0b' }}>Market</span> Governance HQ</h4>
            <span className="fw-semibold" style={{ color: '#34d399', fontSize: '0.85rem' }}>
              <i className="fas fa-circle text-success me-1" style={{ fontSize: '0.6rem' }}></i> Live SuperAdmin Active Session
            </span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3">
          <span className="badge bg-warning text-dark px-3 py-2 fw-bold rounded-pill shadow-sm" style={{ fontSize: '0.85rem' }}>
            <i className="fas fa-user-shield me-1"></i> SuperAdmin
          </span>
          <button className="btn btn-outline-light btn-sm fw-bold px-3 rounded-pill shadow-sm" onClick={onLogout}>
            <i className="fas fa-sign-out-alt me-1"></i> Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;

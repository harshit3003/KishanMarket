import React from 'react';

const AdminNavbar = ({ onLogout }) => {
  return (
    <nav className="navbar navbar-dark shadow km-navbar">
      <div className="container d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <i className="fas fa-shield-halved text-warning fs-2"></i>
          <div>
            <h4 className="m-0 fw-bold text-white">Kishan<span className="text-warning">Market</span> Governance HQ</h4>
            <span className="fw-semibold text-emerald-400 small">
              <i className="fas fa-circle text-success me-1"></i> Live SuperAdmin Active Session
            </span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3">
          <span className="badge bg-warning text-dark px-3 py-2 fw-bold rounded-pill shadow-sm small">
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

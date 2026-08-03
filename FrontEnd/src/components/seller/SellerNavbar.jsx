import React from 'react';

const SellerNavbar = ({
  sellerName,
  weatherLocation,
  onChangeLocation,
  onOpenWeatherModal,
  onToggleProfile,
  onLogout,
  onOpenOrdersModal,
  onOpenDisputesModal,
  onOpenBulkUploadModal
}) => {
  return (
    <nav className="navbar navbar-dark shadow" style={{ background: '#111827', borderBottom: '1px solid #1f2937', position: 'relative', zIndex: 999999 }}>
      <div className="container d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <i className="fas fa-wheat-awn text-emerald-400 fs-2" style={{ color: '#10b981' }}></i>
          <div>
            <h4 className="m-0 fw-bold text-white">Kishan<span style={{ color: '#f59e0b' }}>Market</span> Seller HQ</h4>
            <span className="fw-semibold" style={{ color: '#38bdf8', fontSize: '0.85rem' }}>
              <i className="fas fa-location-dot me-1"></i> {weatherLocation || 'Banda, UP'}
              <button className="btn btn-link btn-sm text-info p-0 ms-2 text-decoration-none fw-bold" onClick={onChangeLocation}>
                (Change)
              </button>
            </span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button className="btn btn-outline-info btn-sm rounded-pill px-3 fw-bold" onClick={onOpenWeatherModal}>
            <i className="fas fa-cloud-sun me-1"></i> Weather AI
          </button>
          <button className="btn btn-outline-warning btn-sm rounded-pill px-3 fw-bold" onClick={onOpenOrdersModal}>
            <i className="fas fa-truck-ramp-box me-1"></i> My Orders
          </button>
          <button className="btn btn-outline-success btn-sm rounded-pill px-3 fw-bold" onClick={onOpenBulkUploadModal}>
            <i className="fas fa-file-excel me-1"></i> Bulk Upload
          </button>
          <button className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold" onClick={onOpenDisputesModal}>
            <i className="fas fa-shield-cat me-1"></i> Disputes
          </button>
          <button className="btn btn-emerald btn-sm rounded-pill px-3 fw-bold text-white shadow-sm" style={{ background: '#059669', border: 'none' }} onClick={onToggleProfile}>
            <i className="fas fa-user-gear me-1"></i> {sellerName}
          </button>
          <button className="btn btn-outline-light btn-sm rounded-pill px-3 fw-bold" onClick={onLogout}>
            <i className="fas fa-sign-out-alt me-1"></i> Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default SellerNavbar;

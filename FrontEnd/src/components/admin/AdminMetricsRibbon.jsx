import React from 'react';

const AdminMetricsRibbon = ({ overview }) => {
  return (
    <div className="row g-3 mb-4">
      <div className="col-lg-2 col-md-4 col-6">
        <div className="admin-metric-card">
          <span className="admin-metric-label">REGISTERED USERS</span>
          <h3 className="admin-metric-value-users">{overview.activeUsers || 0}</h3>
        </div>
      </div>
      <div className="col-lg-2 col-md-4 col-6">
        <div className="admin-metric-card">
          <span className="admin-metric-label">CROP LISTINGS</span>
          <h3 className="admin-metric-value-crops">{overview.activeCrops || 0}</h3>
        </div>
      </div>
      <div className="col-lg-2 col-md-4 col-6">
        <div className="admin-metric-card">
          <span className="admin-metric-label">TOTAL ORDERS</span>
          <h3 className="admin-metric-value-orders">{overview.totalOrders || 0}</h3>
        </div>
      </div>
      <div className="col-lg-2 col-md-4 col-6">
        <div className="admin-metric-card">
          <span className="admin-metric-label">GMV VALUATION</span>
          <h3 className="admin-metric-value-gmv">₹{overview.totalGmv ? overview.totalGmv.toLocaleString('en-IN') : 0}</h3>
        </div>
      </div>
      <div className="col-lg-2 col-md-4 col-6">
        <div className="admin-metric-card">
          <span className="admin-metric-label">PENDING REPORTS</span>
          <h3 className="admin-metric-value-reports">{overview.pendingReports || 0}</h3>
        </div>
      </div>
      <div className="col-lg-2 col-md-4 col-6">
        <div className="admin-metric-card">
          <span className="admin-metric-label">OPEN TICKETS</span>
          <h3 className="admin-metric-value-tickets">{overview.openTickets || 0}</h3>
        </div>
      </div>
    </div>
  );
};

export default AdminMetricsRibbon;

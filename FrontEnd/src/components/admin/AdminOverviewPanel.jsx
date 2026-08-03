import React from 'react';
import AdminActivityLog from './AdminActivityLog';

const AdminOverviewPanel = ({ overview }) => {
  return (
    <div>
      <h5 className="fw-bold mb-3 text-emerald-400"><i className="fas fa-chart-line me-2"></i> Marketplace Analytics & System Status</h5>
      <div className="row g-4 mb-2">
        <div className="col-md-6">
          <div className="admin-panel-card">
            <h6 className="admin-panel-heading">Gross Merchandise Value (GMV) Summary</h6>
            <div className="fs-2 fw-bold mb-2 text-emerald-400">₹{overview.totalGmv ? overview.totalGmv.toLocaleString('en-IN') : 0}</div>
            <p className="admin-panel-subtext">Total volume of completed & confirmed agricultural crop trades processed on KishanMarket platform.</p>
          </div>
        </div>
        <div className="col-md-6">
          <div className="admin-panel-card">
            <h6 className="admin-panel-heading">System Health & Cloud Synchronization</h6>
            <ul className="list-unstyled mb-0">
              <li className="admin-list-item"><i className="fas fa-check-circle text-success me-2"></i> <strong className="text-white">MongoDB Cloud Atlas:</strong> Synchronized & Active</li>
              <li className="admin-list-item"><i className="fas fa-check-circle text-success me-2"></i> <strong className="text-white">WebSockets Realtime Engine:</strong> Operational</li>
              <li className="admin-list-item"><i className="fas fa-check-circle text-success me-2"></i> <strong className="text-white">Mandi Market Price Intelligence:</strong> Live Feed Updating</li>
              <li className="admin-list-item"><i className="fas fa-check-circle text-success me-2"></i> <strong className="text-white">SuperAdmin Authentication Guard:</strong> Enforced</li>
            </ul>
          </div>
        </div>
      </div>

      <AdminActivityLog />
    </div>
  );
};

export default AdminOverviewPanel;

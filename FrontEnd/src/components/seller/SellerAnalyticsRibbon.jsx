import React from 'react';

const SellerAnalyticsRibbon = ({ cropsCount, bidsCount, totalVolume, avgRate }) => {
  return (
    <div className="row g-3 mb-4">
      <div className="col-lg-3 col-6">
        <div className="admin-metric-card">
          <span className="admin-metric-label">ACTIVE CROPS LISTED</span>
          <h3 className="admin-metric-value-crops">{cropsCount || 0}</h3>
        </div>
      </div>
      <div className="col-lg-3 col-6">
        <div className="admin-metric-card">
          <span className="admin-metric-label">INCOMING BIDS</span>
          <h3 className="admin-metric-value-users">{bidsCount || 0}</h3>
        </div>
      </div>
      <div className="col-lg-3 col-6">
        <div className="admin-metric-card">
          <span className="admin-metric-label">AVG MANDI RATE</span>
          <h3 className="admin-metric-value-orders">₹{avgRate ? avgRate.toLocaleString('en-IN') : '2,450'}/Qt</h3>
        </div>
      </div>
      <div className="col-lg-3 col-6">
        <div className="admin-metric-card">
          <span className="admin-metric-label">TOTAL STOCK VOLUME</span>
          <h3 className="admin-metric-value-gmv">{totalVolume || 0} Quintals</h3>
        </div>
      </div>
    </div>
  );
};

export default SellerAnalyticsRibbon;

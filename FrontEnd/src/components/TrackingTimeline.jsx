import React from 'react';

const TrackingTimeline = ({ order }) => {
  if (!order || (order.status !== 'Shipped' && order.status !== 'Delivered')) {
    return null;
  }

  const isDelivered = order.status === 'Delivered';
  const vehicle = order.vehicle_no || 'Assigned Freight Vehicle';
  const transporter = order.transporter_name || 'VRL Logistics / Local Transport';
  const trackingId = order.tracking_id || `LR-2026-${order.id}`;
  const driverPhone = order.driver_phone || '';
  const estDate = order.est_delivery_date || '2-3 Days';

  return (
    <div className="p-3 bg-white border rounded-3 shadow-sm text-start my-3" style={{ borderLeft: '4px solid #16a34a' }}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="d-flex align-items-center gap-2">
          <i className="fas fa-truck-fast text-success fs-5"></i>
          <div>
            <h6 className="fw-bold text-dark m-0">Live Delivery & Transport Status</h6>
            <small className="text-muted">Tracking LR: <code className="fw-bold">{trackingId}</code></small>
          </div>
        </div>
        <span className={`badge ${isDelivered ? 'bg-success' : 'bg-primary'} fw-bold px-3 py-1`}>
          {isDelivered ? 'Delivered' : 'In Transit'}
        </span>
      </div>

      <div className="row g-2 my-2 bg-light p-2 rounded border small">
        <div className="col-md-6">
          <span className="text-muted d-block">Transport Partner:</span>
          <strong className="text-dark"><i className="fas fa-building text-primary me-1"></i> {transporter}</strong>
        </div>

        <div className="col-md-6">
          <span className="text-muted d-block">Vehicle Reg. Number:</span>
          <strong className="text-dark text-uppercase"><i className="fas fa-truck me-1 text-danger"></i> {vehicle}</strong>
        </div>

        <div className="col-md-6 mt-2">
          <span className="text-muted d-block">Est. Delivery Window:</span>
          <strong className="text-dark"><i className="fas fa-calendar-alt me-1 text-warning"></i> {estDate}</strong>
        </div>

        {driverPhone && (
          <div className="col-md-6 mt-2 d-flex align-items-end">
            <a href={`tel:${driverPhone}`} className="btn btn-sm btn-outline-success fw-bold w-100 py-1" style={{ fontSize: '0.75rem' }}>
              <i className="fas fa-phone-alt me-1"></i> Call Driver (+91 {driverPhone})
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackingTimeline;

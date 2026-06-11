import React from 'react';

const mockStorages = [
  { name: 'Kisan Cold Storage', distance: '12 km', rate: '₹20/q/day', available: true },
  { name: 'Punjab Fresh Vault', distance: '18 km', rate: '₹18/q/day', available: true },
  { name: 'AgriSafe Warehouse', distance: '25 km', rate: '₹15/q/day', available: false },
];

const ColdStorageFinder = () => {
  return (
    <div className="glass-card-premium p-4 h-100" style={{ transformStyle: 'preserve-3d' }}>
      <h5 className="section-title d-flex justify-content-between align-items-center" style={{ transform: 'translateZ(30px)' }}>
        <span><i className="fas fa-snowflake text-info me-2"></i> Cold Storages</span>
        <span className="badge bg-danger rounded-pill" style={{ fontSize: '10px' }}>MARKET DOWN</span>
      </h5>
      
      <p className="text-muted small mb-3" style={{ transform: 'translateZ(20px)' }}>Prices are low today. Store your perishable crops to sell later at a higher price.</p>
      
      <div className="d-flex flex-column gap-3" style={{ transform: 'translateZ(20px)' }}>
        {mockStorages.map((storage, idx) => (
          <div key={idx} className="p-3 border rounded bg-white shadow-sm d-flex justify-content-between align-items-center">
            <div>
              <h6 className="m-0 fw-bold">{storage.name}</h6>
              <small className="text-muted"><i className="fas fa-map-marker-alt text-danger"></i> {storage.distance} • {storage.rate}</small>
            </div>
            <button className={`btn btn-sm btn-premium-hover ${storage.available ? 'btn-outline-info' : 'btn-outline-secondary disabled'}`} style={{ transform: 'translateZ(10px)' }}>
              {storage.available ? 'Book' : 'Full'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColdStorageFinder;

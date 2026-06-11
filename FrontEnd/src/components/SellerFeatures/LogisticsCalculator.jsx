import React, { useState } from 'react';

const LogisticsCalculator = () => {
  const [distance, setDistance] = useState(50);
  const [weight, setWeight] = useState(10);
  
  // Rate: ₹25 per quintal per 10km
  const cost = ((distance / 10) * 25 * weight).toLocaleString('en-IN');

  return (
    <div className="glass-card-premium p-4 h-100" style={{ transformStyle: 'preserve-3d' }}>
      <h5 className="section-title" style={{ transform: 'translateZ(30px)' }}><i className="fas fa-truck text-accent me-2"></i> Transport Calculator</h5>
      
      <div className="mb-3" style={{ transform: 'translateZ(20px)' }}>
        <label className="form-label d-flex justify-content-between">
          <span>Distance to Buyer</span>
          <span className="fw-bold text-success">{distance} km</span>
        </label>
        <input type="range" className="form-range" min="10" max="500" step="10" value={distance} onChange={(e) => setDistance(e.target.value)} />
      </div>

      <div className="mb-4" style={{ transform: 'translateZ(20px)' }}>
        <label className="form-label d-flex justify-content-between">
          <span>Total Weight</span>
          <span className="fw-bold text-success">{weight} Quintals</span>
        </label>
        <input type="range" className="form-range" min="1" max="100" value={weight} onChange={(e) => setWeight(e.target.value)} />
      </div>

      <div className="p-3 bg-light rounded d-flex justify-content-between align-items-center border" style={{ transform: 'translateZ(30px)' }}>
        <div>
          <small className="text-muted d-block">Estimated Truck Fare</small>
          <span className="fs-4 fw-bold text-dark">₹{cost}</span>
        </div>
        <button className="btn btn-dark btn-sm rounded-pill px-3 btn-premium-hover">Book Tractor</button>
      </div>
    </div>
  );
};

export default LogisticsCalculator;

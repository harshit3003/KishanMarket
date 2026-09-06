import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

const mockStorages = [
  { name: 'Kisan Cold Storage', distance: '12 km', rate: '₹20/q/day', available: true },
  { name: 'Punjab Fresh Vault', distance: '18 km', rate: '₹18/q/day', available: true },
  { name: 'AgriSafe Warehouse', distance: '25 km', rate: '₹15/q/day', available: false },
];

const ColdStorageFinder = () => {
  const [modalData, setModalData] = useState({ open: false, storage: null, amount: '', days: '' });

  const handleBookClick = (storage) => {
    setModalData({ open: true, storage, amount: '', days: '' });
  };

  const handleConfirmBooking = (e) => {
    e.preventDefault();
    if (!modalData.amount || !modalData.days) {
      toast.error('Please enter both amount and days.');
      return;
    }
    toast.success(`Successfully booked ${modalData.amount}q at ${modalData.storage.name} for ${modalData.days} days!`);
    setModalData({ open: false, storage: null, amount: '', days: '' });
  };

  return (
    <>
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
            <button 
              className={`btn btn-sm btn-premium-hover ${storage.available ? 'btn-outline-info' : 'btn-outline-secondary disabled'}`} 
              style={{ transform: 'translateZ(10px)' }}
              onClick={() => storage.available && handleBookClick(storage)}
            >
              {storage.available ? 'Book' : 'Full'}
            </button>
          </div>
        ))}
      </div>
    </div>

    {/* Booking Modal */}
    {modalData.open && createPortal(
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', zIndex: 10000000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-card-premium p-4" style={{ width: '90%', maxWidth: '400px', background: 'white' }}>
          <h4 className="fw-bold mb-3 text-info"><i className="fas fa-snowflake me-2"></i>Book Storage</h4>
          <p className="mb-3"><strong>{modalData.storage.name}</strong><br/><small className="text-muted">Rate: {modalData.storage.rate}</small></p>
          
          <form onSubmit={handleConfirmBooking}>
            <div className="mb-3">
              <label className="form-label">Amount of Crop (Quintals)</label>
              <input type="number" className="form-control custom-input" placeholder="e.g. 50" min="1" value={modalData.amount} onChange={e => setModalData({...modalData, amount: e.target.value})} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Duration (Days)</label>
              <input type="number" className="form-control custom-input" placeholder="e.g. 15" min="1" value={modalData.days} onChange={e => setModalData({...modalData, days: e.target.value})} required />
            </div>

            {modalData.amount && modalData.days && (
              <div className="p-3 bg-light rounded border mb-4">
                <div className="d-flex justify-content-between fw-bold">
                  <span>Estimated Total:</span>
                  <span className="text-info">₹{(parseInt(modalData.amount) * parseInt(modalData.days) * parseInt(modalData.storage.rate.replace(/\D/g, ''))).toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-light" onClick={() => setModalData({open: false, storage: null, amount: '', days: ''})}>Cancel</button>
              <button type="submit" className="btn btn-info text-white fw-bold">Confirm Booking</button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    )}
    </>
  );
};

export default ColdStorageFinder;

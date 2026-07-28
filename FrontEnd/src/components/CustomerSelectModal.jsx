import React, { useState, useEffect } from 'react';

const CustomerSelectModal = ({ isOpen, onClose, crop, receivedBids = [], onSelectBuyer, currentUser }) => {
  const [realRegisteredBuyers, setRealRegisteredBuyers] = useState([]);
  const [isLoadingBuyers, setIsLoadingBuyers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingBuyers(true);
      fetch('/api/users')
        .then(res => res.ok ? res.json() : [])
        .then(users => {
          const registeredBuyers = Array.isArray(users) ? users.filter(u => u.role === 'buyer') : [];
          setRealRegisteredBuyers(registeredBuyers);
        })
        .catch(err => console.error("Error loading real buyers:", err))
        .finally(() => setIsLoadingBuyers(false));
    }
  }, [isOpen]);

  if (!isOpen || !crop) return null;

  const safeBids = Array.isArray(receivedBids) ? receivedBids : [];

  // Filter bids matching this crop
  const cropBids = safeBids.filter(b => 
    b && (b.crop_id === crop.id || (b.crop_name && b.crop_name.toLowerCase() === (crop.name || '').toLowerCase()))
  );

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1100,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="glass-card-premium p-4 text-start" style={{
        width: '90%', maxWidth: '520px', maxHeight: '80vh', overflowY: 'auto',
        background: 'white', borderRadius: '15px'
      }}>
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
          <div>
            <h5 className="fw-bold text-success m-0">
              <i className="fas fa-users me-2"></i>Select Customer to Chat
            </h5>
            <small className="text-muted">Crop: {crop.name} ({crop.weight}q @ ₹{crop.rate}/q)</small>
          </div>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        {cropBids.length === 0 && realRegisteredBuyers.length === 0 ? (
          <div className="text-center py-4">
            <i className="fas fa-user-clock fa-2x text-muted opacity-50 mb-2"></i>
            <h6 className="fw-bold text-secondary">No Registered Customers Yet</h6>
            <p className="small text-muted mb-3">When buyers register or place bids on this listing, their dedicated 1-on-1 chat boxes will appear here.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {cropBids.map((b, idx) => (
              <div key={`bid-${idx}`} className="p-3 bg-white rounded border border-warning shadow-sm d-flex justify-content-between align-items-center">
                <div>
                  <span className="badge bg-warning text-dark mb-1"><i className="fas fa-gavel me-1"></i> Live Boli Buyer</span>
                  <h6 className="m-0 fw-bold">{b.buyer_name || 'Buyer'}</h6>
                  <small className="text-muted">Bid Rate: <strong>₹{b.bid_rate}/q</strong> ({b.weight}q)</small>
                </div>
                <button 
                  className="btn btn-sm btn-success fw-bold px-3 py-1"
                  style={{ borderRadius: '8px' }}
                  onClick={() => {
                    onClose();
                    const sellerKey = (currentUser.mobile || currentUser.name || 'seller').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
                    const buyerKey = (b.buyer_mobile || b.buyer_name || 'buyer').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
                    const roomId = `room_c${crop.id || 0}_s_${sellerKey}_b_${buyerKey}`;
                    onSelectBuyer({
                      name: crop.name,
                      weight: crop.weight,
                      rate: b.bid_rate,
                      seller: currentUser.name,
                      seller_mobile: currentUser.mobile,
                      buyer: b.buyer_name,
                      buyerMobile: b.buyer_mobile,
                      roomId
                    });
                  }}
                >
                  <i className="fas fa-comments me-1"></i> Open Chat
                </button>
              </div>
            ))}

            {realRegisteredBuyers.map((b, idx) => (
              <div key={`buyer-${idx}`} className="p-3 bg-light rounded border d-flex justify-content-between align-items-center">
                <div>
                  <span className="badge bg-success text-white mb-1"><i className="fas fa-user-check me-1"></i> Registered Buyer</span>
                  <h6 className="m-0 fw-bold">{b.name}</h6>
                  <small className="text-muted">Location: {b.location || 'India'} &bull; Mobile: {b.mobile}</small>
                </div>
                <button 
                  className="btn btn-sm btn-outline-success fw-bold px-3 py-1"
                  style={{ borderRadius: '8px' }}
                  onClick={() => {
                    onClose();
                    const sellerKey = (currentUser.mobile || currentUser.name || 'seller').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
                    const buyerKey = (b.mobile || b.name || 'buyer').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
                    const roomId = `room_c${crop.id || 0}_s_${sellerKey}_b_${buyerKey}`;
                    onSelectBuyer({
                      name: crop.name,
                      weight: crop.weight,
                      rate: crop.rate,
                      seller: currentUser.name,
                      seller_mobile: currentUser.mobile,
                      buyer: b.name,
                      buyerMobile: b.mobile,
                      roomId
                    });
                  }}
                >
                  <i className="fas fa-comments me-1"></i> Open Chat
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerSelectModal;

import React, { useState, useEffect } from 'react';

const mockBids = [
  { buyer: 'Reliance Agri', amount: '₹2,550/q', crop: 'Gehu' },
  { buyer: 'ITC Limited', amount: '₹2,100/q', crop: 'Dhan' },
  { buyer: 'Adani Wilmar', amount: '₹2,600/q', crop: 'Gehu' },
  { buyer: 'Local Mandi', amount: '₹1,900/q', crop: 'Makka' }
];

const LiveBiddingToasts = ({ isModalOpen, onClose }) => {
  const [toast, setToast] = useState(null);
  const [bidHistory, setBidHistory] = useState([]);

  useEffect(() => {
    // Randomly pop up a bid every 8-15 seconds
    const showRandomBid = () => {
      const randomBid = mockBids[Math.floor(Math.random() * mockBids.length)];
      setToast(randomBid);
      setBidHistory(prev => [randomBid, ...prev].slice(0, 10)); // Keep last 10
      
      // Hide after 4 seconds
      setTimeout(() => setToast(null), 4000);
      
      // Schedule next
      setTimeout(showRandomBid, Math.random() * 7000 + 8000);
    };

    const timer = setTimeout(showRandomBid, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {toast && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
          background: 'rgba(27, 67, 50, 0.95)', color: 'white', padding: '15px 20px',
          borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          borderLeft: '5px solid #f59e0b', animation: 'fadeInUp 0.3s ease'
        }}>
          <div className="d-flex align-items-center gap-3">
            <div style={{ background: '#f59e0b', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-gavel text-dark"></i>
            </div>
            <div>
              <h6 className="m-0 fw-bold text-warning">New Bid Received!</h6>
              <p className="m-0 small">{toast.buyer} bid <strong>{toast.amount}</strong> for your {toast.crop}</p>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="dynamic-modal-overlay active" style={{ zIndex: 1060 }} onClick={onClose}>
          <div className="dynamic-modal" style={{ maxWidth: '500px', textAlign: 'left', padding: '25px' }} onClick={e => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold m-0"><i className="fas fa-gavel text-warning me-2"></i> Active Live Bids</h4>
              <button className="btn-close" onClick={onClose}></button>
            </div>
            
            {bidHistory.length === 0 ? (
              <div className="text-center py-4">
                <i className="fas fa-hourglass-half fa-2x text-muted mb-2"></i>
                <p className="text-muted m-0">Waiting for buyers to place bids...</p>
              </div>
            ) : (
              <div className="list-group">
                {bidHistory.map((bid, idx) => (
                  <div key={idx} className="list-group-item d-flex justify-content-between align-items-center bg-light border-light mb-2 rounded">
                    <div>
                      <h6 className="m-0 fw-bold text-success">{bid.buyer}</h6>
                      <small className="text-muted">Bid placed for {bid.crop}</small>
                    </div>
                    <span className="badge bg-warning text-dark px-3 py-2 fs-6">{bid.amount}</span>
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-outline-secondary w-100 mt-4" onClick={onClose}>Close</button>
          </div>
        </div>
      )}
    </>
  );
};

export default LiveBiddingToasts;

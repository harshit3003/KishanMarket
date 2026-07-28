import React, { useState, useEffect } from 'react';

const ConversationsModal = ({ isOpen, onClose, currentUser, onSelectChat, unreadCounts = {} }) => {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser && currentUser.mobile) {
      fetchConversations();
    }
  }, [isOpen, currentUser]);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/conversations?mobile=${currentUser.mobile}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (e) {
      console.error("Failed to load conversations:", e);
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1100,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="glass-card-premium p-4 text-start" style={{
        width: '90%', maxWidth: '550px', maxHeight: '80vh', overflowY: 'auto',
        background: 'white', borderRadius: '15px'
      }}>
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
          <h5 className="fw-bold text-success m-0">
            <i className="fas fa-comments me-2"></i>Customer & Client Chat Boxes
          </h5>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        {isLoading ? (
          <div className="text-center py-4">
            <i className="fas fa-spinner fa-spin fa-2x text-success"></i>
            <p className="small text-muted mt-2">Loading active chat conversations...</p>
          </div>
        ) : (!Array.isArray(conversations) || conversations.length === 0) ? (
          <div className="text-center py-5">
            <i className="fas fa-comments fa-3x text-muted opacity-50 mb-3"></i>
            <h6 className="fw-bold text-secondary">No Messages Yet</h6>
            <p className="small text-muted">When a buyer or seller messages you, a separate 1-on-1 chat box will appear here.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {conversations.map((conv, idx) => {
              const unread = unreadCounts[conv.room_id] || 0;
              const otherName = conv.sender_name || 'Customer';
              const cropTitle = conv.crop_name || 'Crop Listing';

              return (
                <div key={idx} className="p-3 bg-light rounded border d-flex justify-content-between align-items-center hover-shadow">
                  <div className="d-flex align-items-center gap-3">
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '50%',
                      backgroundColor: '#15803d', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 'bold', fontSize: '1.1rem'
                    }}>
                      {otherName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <h6 className="m-0 fw-bold text-dark">{otherName}</h6>
                        <span className="badge bg-success-subtle text-success border border-success small" style={{ fontSize: '0.7rem' }}>
                          {cropTitle}
                        </span>
                        {unread > 0 && (
                          <span className="badge bg-danger rounded-pill">{unread} new</span>
                        )}
                      </div>
                      <p className="small text-muted m-0 text-truncate" style={{ maxWidth: '240px' }}>
                        {conv.last_message}
                      </p>
                      <small className="text-muted" style={{ fontSize: '0.65rem' }}>{conv.last_time}</small>
                    </div>
                  </div>

                  <button 
                    className="btn btn-sm btn-success fw-bold px-3 py-1" 
                    style={{ borderRadius: '8px' }}
                    onClick={() => {
                      onClose();
                      onSelectChat({
                        name: cropTitle,
                        crop_id: conv.crop_id,
                        seller: currentUser.role === 'seller' ? currentUser.name : otherName,
                        buyer: currentUser.role === 'buyer' ? currentUser.name : otherName,
                        buyerMobile: conv.sender_mobile || conv.receiver_mobile,
                        roomId: conv.room_id
                      });
                    }}
                  >
                    <i className="fas fa-paper-plane me-1"></i> Open Chat
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationsModal;

import React, { useState } from 'react';
import toast from 'react-hot-toast';

const STAGES = [
  { key: 'Confirmed', label: 'Order Confirmed', icon: 'fa-check-circle', color: '#16a34a' },
  { key: 'Packed', label: 'Packed & Ready', icon: 'fa-box', color: '#2563eb' },
  { key: 'Shipped', label: 'In Transit / Shipped', icon: 'fa-truck-fast', color: '#d97706' },
  { key: 'Delivered', label: 'Delivered', icon: 'fa-house-circle-check', color: '#059669' }
];

const OrderStatusTracker = ({ order, isSeller, onStatusUpdated }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const currentStatus = order?.status || 'Confirmed';
  const currentStageIndex = STAGES.findIndex(s => s.key === currentStatus);

  const handleUpdateStatus = async (nextStatus) => {
    if (!order || !order.id) return;
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Order #${order.id} marked as ${nextStatus}!`);
        if (onStatusUpdated) onStatusUpdated(data.order);
      } else {
        toast.error(data.error || "Failed to update order status");
      }
    } catch (err) {
      toast.error("Network error updating status");
    }
    setIsUpdating(false);
  };

  const nextStage = currentStageIndex < STAGES.length - 1 ? STAGES[currentStageIndex + 1] : null;

  return (
    <div className="p-3 bg-light rounded-3 border text-start my-3">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="small text-muted fw-bold">
          ORDER LIFECYCLE TRACKER <span className="badge bg-secondary ms-1">#{order.id}</span>
        </div>
        <span className="badge bg-success fw-bold px-3 py-1">
          {currentStatus}
        </span>
      </div>

      {/* Stepper Visual */}
      <div className="d-flex justify-content-between position-relative my-4">
        {/* Track Line */}
        <div className="position-absolute" style={{ top: '20px', left: '12%', right: '12%', height: '3px', background: '#e2e8f0', zIndex: 1 }}></div>
        <div 
          className="position-absolute" 
          style={{ 
            top: '20px', left: '12%', 
            width: `${(currentStageIndex / (STAGES.length - 1)) * 76}%`, 
            height: '3px', background: '#16a34a', zIndex: 2, transition: 'width 0.4s ease' 
          }}
        ></div>

        {/* Steps */}
        {STAGES.map((stage, idx) => {
          const isCompleted = idx <= currentStageIndex;
          const isActive = idx === currentStageIndex;

          return (
            <div key={stage.key} className="text-center position-relative" style={{ zIndex: 3, flex: 1 }}>
              <div 
                className={`mx-auto mb-2 d-flex align-items-center justify-content-center text-white fw-bold shadow-sm rounded-circle`}
                style={{
                  width: '38px', height: '38px',
                  backgroundColor: isCompleted ? stage.color : '#cbd5e1',
                  border: isActive ? '3px solid #15803d' : '2px solid white',
                  transition: 'all 0.3s ease'
                }}
              >
                <i className={`fas ${stage.icon}`} style={{ fontSize: '0.9rem' }}></i>
              </div>
              <span className={`d-block small fw-bold ${isCompleted ? 'text-dark' : 'text-muted'}`} style={{ fontSize: '0.72rem' }}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Seller Action Controls */}
      {isSeller && nextStage && (
        <div className="d-flex justify-content-end align-items-center border-top pt-2 mt-3 gap-2">
          <small className="text-muted me-auto">Update lifecycle state:</small>
          <button 
            className="btn btn-sm btn-success fw-bold px-3"
            disabled={isUpdating}
            onClick={() => handleUpdateStatus(nextStage.key)}
          >
            <i className={`fas ${nextStage.icon} me-1`}></i>
            {isUpdating ? 'Updating...' : `Mark as ${nextStage.key}`}
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderStatusTracker;

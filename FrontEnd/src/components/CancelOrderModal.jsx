import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

const REASON_OPTIONS = [
  "Price or Quantity Agreement Error",
  "Transport / Logistics Delay",
  "Crop Stock Unavailability",
  "Buyer Requested Cancellation",
  "Other Reason"
];

const CancelOrderModal = ({ isOpen, onClose, order, currentUser, onOrderCancelled }) => {
  const [selectedReason, setSelectedReason] = useState(REASON_OPTIONS[0]);
  const [customNote, setCustomNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || !currentUser.mobile) {
      toast.error("Please log in to cancel orders.");
      return;
    }

    const finalReason = selectedReason === "Other Reason" ? customNote || "User requested cancellation" : selectedReason;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: finalReason,
          cancelled_by_mobile: currentUser.mobile,
          cancelled_by_name: currentUser.name || 'User'
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Order #${order.id} cancelled successfully.`);
        if (onOrderCancelled) onOrderCancelled(data.order);
        onClose();
      } else {
        toast.error(data.error || "Failed to cancel order.");
      }
    } catch (err) {
      toast.error("Network error submitting cancellation.");
    }
    setIsSubmitting(false);
  };

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', zIndex: 10000000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="glass-card-premium p-4 text-start" style={{
        width: '90%', maxWidth: '480px', background: 'white', borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
      }}>
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
          <div className="d-flex align-items-center gap-2">
            <i className="fas fa-ban text-danger fs-4"></i>
            <div>
              <h5 className="fw-bold text-dark m-0">Cancel Order #{order.id}</h5>
              <small className="text-muted">Item: {order.crop_name || order.name}</small>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        <form onSubmit={handleCancelSubmit}>
          <div className="p-3 bg-light rounded border mb-3">
            <div className="small text-muted mb-2"><i className="fas fa-info-circle text-primary me-1"></i> Pre-shipment Cancellation Policy</div>
            <p className="small text-dark mb-0">
              Orders in <strong>Confirmed</strong> or <strong>Packed</strong> state can be cancelled. If the item has already been shipped or delivered, please use <strong>Raise Dispute</strong> instead.
            </p>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-bold">Select Reason for Cancellation</label>
            <select
              className="form-select form-select-sm"
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
            >
              {REASON_OPTIONS.map((opt, idx) => (
                <option key={idx} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {selectedReason === "Other Reason" && (
            <div className="mb-3">
              <label className="form-label small fw-bold">Specify Reason Details</label>
              <textarea
                className="form-control form-control-sm"
                rows="2"
                placeholder="Explain the reason for cancelling..."
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                required
              ></textarea>
            </div>
          )}

          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>Close</button>
            <button type="submit" className="btn btn-sm btn-danger fw-bold px-4" disabled={isSubmitting}>
              {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CancelOrderModal;

import React, { useState } from 'react';
import toast from 'react-hot-toast';

const REPORT_REASONS = [
  "Fraudulent Seller / Payment Scam",
  "Fake / Misleading Crop Quality",
  "Unreasonable Bidding / Price Manipulation",
  "Abusive Behavior or Harassment",
  "Other Policy Violation"
];

const ReportModal = ({ isOpen, onClose, targetType, targetId, targetName, currentUser }) => {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || !currentUser.mobile) {
      toast.error("Please log in to submit reports.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reported_by_mobile: currentUser.mobile,
          reported_by_name: currentUser.name || 'User',
          target_type: targetType || 'user',
          target_id: targetId || 'unknown',
          target_name: targetName || '',
          reason,
          notes
        })
      });

      if (res.ok) {
        toast.success(`🚩 Report submitted for admin review. Thank you for keeping KishanMarket safe!`);
        onClose();
      } else {
        toast.error("Failed to submit report.");
      }
    } catch (err) {
      toast.error("Network error submitting report.");
    }
    setIsSubmitting(false);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1250,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="glass-card-premium p-4 text-start" style={{
        width: '90%', maxWidth: '480px', background: 'white', borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
      }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
          <div className="d-flex align-items-center gap-2">
            <i className="fas fa-flag text-danger fs-4"></i>
            <div>
              <h5 className="fw-bold text-dark m-0">Report {targetType === 'listing' ? 'Crop Listing' : 'User Profile'}</h5>
              <small className="text-muted">Target: {targetName || targetId}</small>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-bold">Select Reason for Report</label>
            <select
              className="form-select form-select-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              {REPORT_REASONS.map((r, idx) => (
                <option key={idx} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-bold">Additional Details & Evidence</label>
            <textarea
              className="form-control form-control-sm"
              rows="3"
              placeholder="Provide specific details about the incident..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>

          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-sm btn-danger fw-bold px-4" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Report 🚩'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;

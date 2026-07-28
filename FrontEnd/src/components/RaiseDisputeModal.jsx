import React, { useState } from 'react';
import toast from 'react-hot-toast';

const DISPUTE_REASONS = [
  "Crop Quality Below Promised Grade (Spoilage / Damage)",
  "Quantity / Weight Mismatch Received",
  "Incorrect Crop Variety Delivered",
  "Packaging or Moisture Contamination Issue",
  "Other Quality Mismatch"
];

const RaiseDisputeModal = ({ isOpen, onClose, order, currentUser, onDisputeSubmitted }) => {
  const [reason, setReason] = useState(DISPUTE_REASONS[0]);
  const [description, setDescription] = useState('');
  const [evidencePhoto, setEvidencePhoto] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      toast.error("Photo size should be less than 4MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEvidencePhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || !currentUser.mobile) {
      toast.error("Please log in to submit quality disputes.");
      return;
    }

    const fullReason = `${reason}${description ? ` - ${description}` : ''}`;
    const targetMobile = order.seller_mobile || order.seller;
    const targetName = order.seller_name || order.seller || 'Seller';

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          raised_by_mobile: currentUser.mobile,
          raised_by_name: currentUser.name || 'Buyer',
          target_mobile: targetMobile,
          target_name: targetName,
          reason: fullReason,
          evidence_photo: evidencePhoto
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`⚠️ Dispute raised for Order #${order.id}. Admin team will review photo proof.`);
        if (onDisputeSubmitted) onDisputeSubmitted(data.dispute);
        onClose();
      } else {
        toast.error(data.error || "Failed to raise dispute.");
      }
    } catch (err) {
      toast.error("Network error submitting dispute claim.");
    }
    setIsSubmitting(false);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1200,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="glass-card-premium p-4 text-start" style={{
        width: '90%', maxWidth: '520px', background: 'white', borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
      }}>
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
          <div className="d-flex align-items-center gap-2">
            <i className="fas fa-triangle-exclamation text-warning fs-4"></i>
            <div>
              <h5 className="fw-bold text-dark m-0">Raise Quality Dispute</h5>
              <small className="text-muted">Order #{order.id}: {order.crop_name || order.name}</small>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-3 bg-light rounded border mb-3">
            <div className="small text-muted fw-bold mb-1"><i className="fas fa-scale-balanced text-primary me-1"></i> Quality Resolution Guarantee</div>
            <p className="small text-muted mb-0">
              Provide specific issue details and upload photo proof. Our dispute resolution team will review and approve refunds or replacements.
            </p>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-bold">Select Issue Category</label>
            <select
              className="form-select form-select-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              {DISPUTE_REASONS.map((r, idx) => (
                <option key={idx} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-bold">Issue Description & Remarks</label>
            <textarea
              className="form-control form-control-sm"
              rows="3"
              placeholder="Describe the condition of crop received, weight difference, or moisture content..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
          </div>

          {/* Photo Evidence Upload */}
          <div className="mb-4">
            <label className="form-label small fw-bold">Upload Photo Evidence (Proof of Crop Condition)</label>
            <input
              type="file"
              accept="image/*"
              className="form-control form-control-sm mb-2"
              onChange={handlePhotoUpload}
            />
            {evidencePhoto && (
              <div className="p-2 border rounded text-center bg-light">
                <img src={evidencePhoto} alt="Dispute Evidence" style={{ maxHeight: '120px', borderRadius: '8px', objectFit: 'cover' }} />
                <small className="text-success d-block mt-1"><i className="fas fa-check-circle me-1"></i> Evidence photo attached</small>
              </div>
            )}
          </div>

          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>Close</button>
            <button type="submit" className="btn btn-sm btn-warning text-dark fw-bold px-4" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting Claim...' : 'Submit Quality Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RaiseDisputeModal;

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const AdminDisputeModal = ({ isOpen, onClose }) => {
  const [disputes, setDisputes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolutionAction, setResolutionAction] = useState('Refund Approved');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDisputes();
    }
  }, [isOpen]);

  const fetchDisputes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/disputes');
      if (res.ok) {
        setDisputes(await res.json());
      }
    } catch (err) {
      console.error("Failed to load admin disputes:", err);
    }
    setIsLoading(false);
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDispute) return;

    setIsResolving(true);
    try {
      const res = await fetch(`/api/admin/disputes/${selectedDispute.id}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolution: resolutionAction,
          resolution_notes: resolutionNotes
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Dispute #${selectedDispute.id} resolved with status: ${resolutionAction}`);
        setDisputes(prev => prev.map(d => d.id === selectedDispute.id ? data.dispute : d));
        setSelectedDispute(null);
      } else {
        toast.error(data.error || "Failed to resolve dispute.");
      }
    } catch (err) {
      toast.error("Network error resolving claim.");
    }
    setIsResolving(false);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1150,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="glass-card-premium p-4 text-start" style={{
        width: '92%', maxWidth: '780px', maxHeight: '88vh', overflowY: 'auto',
        background: 'white', borderRadius: '18px', boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
      }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
          <div className="d-flex align-items-center gap-2">
            <i className="fas fa-scale-balanced text-primary fs-4"></i>
            <div>
              <h5 className="fw-bold text-dark m-0">Dispute & Resolution Center</h5>
              <small className="text-muted">Review photo evidence & issue binding resolutions</small>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="small text-muted mt-2">Loading platform disputes...</p>
          </div>
        ) : disputes.length === 0 ? (
          <div className="text-center py-5 bg-light rounded border">
            <i className="fas fa-shield-check text-success fa-3x mb-3 opacity-50"></i>
            <h6 className="fw-bold text-dark">No quality disputes on record</h6>
            <p className="small text-muted mb-0">All trade transactions are running smoothly!</p>
          </div>
        ) : (
          <div className="row g-3">
            {disputes.map((d) => {
              const isResolved = d.status === 'Resolved';

              return (
                <div key={d.id} className="col-12">
                  <div className="p-3 bg-white border rounded shadow-sm">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <span className={`badge ${isResolved ? 'bg-success' : 'bg-warning text-dark'} me-2`}>
                          {isResolved ? `Resolved: ${d.resolution}` : 'Pending Review'}
                        </span>
                        <strong className="text-dark">Dispute #{d.id} (Order #{d.order_id})</strong>
                      </div>
                      <small className="text-muted">{d.created_at ? new Date(d.created_at).toLocaleDateString('en-GB') : 'Recent'}</small>
                    </div>

                    <div className="row g-2 my-2">
                      <div className="col-md-6 small">
                        <strong>Raised By:</strong> {d.raised_by_name} (+91 {d.raised_by_mobile})
                      </div>
                      <div className="col-md-6 small">
                        <strong>Against:</strong> {d.target_name} (+91 {d.target_mobile})
                      </div>
                    </div>

                    <div className="p-2 bg-light rounded border mb-2 small text-dark">
                      <strong>Reason & Details:</strong> {d.reason}
                    </div>

                    {d.evidence_photo && (
                      <div className="mb-2">
                        <small className="text-muted fw-bold d-block mb-1">Attached Photo Proof:</small>
                        <img src={d.evidence_photo} alt="Proof" style={{ maxHeight: '140px', borderRadius: '8px', objectFit: 'cover' }} />
                      </div>
                    )}

                    {isResolved ? (
                      <div className="p-2 bg-success bg-opacity-10 border border-success rounded small text-success mt-2">
                        <i className="fas fa-gavel me-1"></i> <strong>Resolution Note:</strong> {d.resolution_notes || 'Resolved by Platform Admin'}
                      </div>
                    ) : (
                      <div className="mt-3 pt-2 border-top d-flex justify-content-end">
                        <button 
                          className="btn btn-sm btn-primary fw-bold"
                          onClick={() => {
                            setSelectedDispute(d);
                            setResolutionNotes('');
                          }}
                        >
                          <i className="fas fa-gavel me-1"></i> Resolve Claim
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Resolution Form Overlay Modal */}
        {selectedDispute && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-card-premium p-4 text-start" style={{ width: '90%', maxWidth: '450px', background: 'white', borderRadius: '15px' }}>
              <h5 className="fw-bold mb-3">Resolve Dispute #{selectedDispute.id}</h5>
              <form onSubmit={handleResolveSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Select Resolution Action</label>
                  <select 
                    className="form-select form-select-sm"
                    value={resolutionAction}
                    onChange={(e) => setResolutionAction(e.target.value)}
                  >
                    <option value="Refund Approved">Refund Approved (Full Payment Return)</option>
                    <option value="Replacement Granted">Replacement Granted (Seller Re-ships Fresh Crop)</option>
                    <option value="Claim Rejected">Claim Rejected (Quality Confirmed Valid)</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Admin Resolution Notes</label>
                  <textarea 
                    className="form-control form-control-sm"
                    rows="3"
                    placeholder="Enter decision rationale for buyer and seller..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    required
                  ></textarea>
                </div>

                <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedDispute(null)}>Cancel</button>
                  <button type="submit" className="btn btn-sm btn-primary fw-bold px-4" disabled={isResolving}>
                    {isResolving ? 'Resolving...' : 'Confirm Resolution'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="d-flex justify-content-end pt-3 border-top mt-3">
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default AdminDisputeModal;

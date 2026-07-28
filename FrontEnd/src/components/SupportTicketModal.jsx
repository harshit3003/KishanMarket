import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const TICKET_CATEGORIES = [
  "Payment / Bank Transfer Issue",
  "Account Login & Profile Access",
  "App Bug & Technical Problem",
  "Transport & Delivery Dispute",
  "General Inquiry"
];

const SupportTicketModal = ({ isOpen, onClose, currentUser }) => {
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'create'
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState(TICKET_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMsg, setReplyMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser && currentUser.mobile) {
      fetchTickets();
    }
  }, [isOpen, currentUser]);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tickets/my?mobile=${encodeURIComponent(currentUser.mobile)}`);
      if (res.ok) {
        setTickets(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch support tickets:", err);
    }
    setIsLoading(false);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || !currentUser.mobile) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_mobile: currentUser.mobile,
          user_name: currentUser.name || 'User',
          subject,
          category,
          description
        })
      });

      if (res.ok) {
        toast.success("🎫 Support ticket created! Our team will respond shortly.");
        setSubject('');
        setDescription('');
        setActiveTab('list');
        fetchTickets();
      } else {
        toast.error("Failed to submit support ticket.");
      }
    } catch (err) {
      toast.error("Network error submitting ticket.");
    }
    setIsSubmitting(false);
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !replyMsg.trim()) return;

    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_mobile: currentUser.mobile,
          sender_name: currentUser.name || 'User',
          is_admin: 0,
          message: replyMsg
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Reply sent.");
        setReplyMsg('');
        setSelectedTicket(prev => ({
          ...prev,
          replies: [...(prev.replies || []), data.reply]
        }));
      }
    } catch (err) {
      toast.error("Failed to send reply.");
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1150,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="glass-card-premium p-4 text-start" style={{
        width: '92%', maxWidth: '680px', maxHeight: '88vh', overflowY: 'auto',
        background: 'white', borderRadius: '18px', boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
      }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
          <div className="d-flex align-items-center gap-2">
            <i className="fas fa-headset text-success fs-3"></i>
            <div>
              <h5 className="fw-bold text-dark m-0">Help & Support Desk</h5>
              <small className="text-muted">Raise tickets & chat with KishanMarket support</small>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        {/* Tab Nav */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="btn-group btn-group-sm">
            <button className={`btn ${activeTab === 'list' ? 'btn-success fw-bold' : 'btn-outline-secondary'}`} onClick={() => { setActiveTab('list'); setSelectedTicket(null); }}>
              My Support Tickets ({tickets.length})
            </button>
            <button className={`btn ${activeTab === 'create' ? 'btn-success fw-bold' : 'btn-outline-secondary'}`} onClick={() => setActiveTab('create')}>
              + Raise New Ticket
            </button>
          </div>
        </div>

        {activeTab === 'create' ? (
          <form onSubmit={handleCreateSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-bold">Select Problem Category</label>
              <select className="form-select form-select-sm" value={category} onChange={e => setCategory(e.target.value)}>
                {TICKET_CATEGORIES.map((c, idx) => <option key={idx} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold">Ticket Subject</label>
              <input 
                type="text" 
                className="form-control form-control-sm" 
                placeholder="Brief summary of the issue..."
                value={subject} 
                onChange={e => setSubject(e.target.value)} 
                required 
              />
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold">Detailed Description</label>
              <textarea 
                className="form-control form-control-sm" 
                rows="4" 
                placeholder="Describe your issue or inquiry in detail..."
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                required 
              ></textarea>
            </div>

            <div className="d-flex justify-content-end gap-2 pt-2 border-top">
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setActiveTab('list')}>Cancel</button>
              <button type="submit" className="btn btn-sm btn-success fw-bold px-4" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Support Ticket 🎫'}
              </button>
            </div>
          </form>
        ) : selectedTicket ? (
          /* Ticket Thread View */
          <div>
            <button className="btn btn-sm btn-link p-0 text-success fw-bold mb-2" onClick={() => setSelectedTicket(null)}>
              ← Back to All Tickets
            </button>

            <div className="p-3 bg-light rounded border mb-3">
              <div className="d-flex justify-content-between align-items-start">
                <h6 className="fw-bold text-dark m-0">{selectedTicket.subject}</h6>
                <span className={`badge ${selectedTicket.status === 'Resolved' ? 'bg-success' : 'bg-warning text-dark'}`}>
                  {selectedTicket.status}
                </span>
              </div>
              <small className="text-muted d-block mt-1">Category: {selectedTicket.category} | #{selectedTicket.id}</small>
              <p className="small text-dark mt-2 mb-0">{selectedTicket.description}</p>
            </div>

            {/* Threaded Replies */}
            <div className="d-flex flex-column gap-2 mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {(selectedTicket.replies || []).map((r, idx) => (
                <div key={idx} className={`p-2 rounded border small ${r.is_admin ? 'bg-success bg-opacity-10 border-success me-4' : 'bg-light ms-4'}`}>
                  <strong className={r.is_admin ? 'text-success' : 'text-dark'}>
                    {r.is_admin ? '🛡️ KishanMarket Support Admin' : r.sender_name}:
                  </strong>
                  <span className="ms-2">{r.message}</span>
                </div>
              ))}
            </div>

            {selectedTicket.status !== 'Resolved' && (
              <form onSubmit={handleReplySubmit} className="d-flex gap-2">
                <input 
                  type="text" 
                  className="form-control form-control-sm" 
                  placeholder="Write a reply..."
                  value={replyMsg}
                  onChange={e => setReplyMsg(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-sm btn-success fw-bold px-3">Send</button>
              </form>
            )}
          </div>
        ) : (
          /* Ticket List */
          <div>
            {isLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-success" role="status"></div>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-4 bg-light rounded border">
                <i className="fas fa-ticket text-muted fa-2x mb-2 opacity-50"></i>
                <div className="small text-muted">No support tickets found. Click "+ Raise New Ticket" if you need help.</div>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {tickets.map((t) => (
                  <div key={t.id} className="p-3 bg-white border rounded shadow-sm d-flex justify-content-between align-items-center" style={{ cursor: 'pointer' }} onClick={() => setSelectedTicket(t)}>
                    <div>
                      <div className="fw-bold text-dark">{t.subject}</div>
                      <small className="text-muted">{t.category} • #{t.id} • {t.replies?.length || 0} replies</small>
                    </div>
                    <span className={`badge ${t.status === 'Resolved' ? 'bg-success' : 'bg-warning text-dark'}`}>
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="d-flex justify-content-end pt-3 border-top mt-3">
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Close Desk</button>
        </div>
      </div>
    </div>
  );
};

export default SupportTicketModal;

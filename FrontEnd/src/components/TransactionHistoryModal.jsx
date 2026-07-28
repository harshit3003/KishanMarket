import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const TransactionHistoryModal = ({ isOpen, onClose, currentUser }) => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalEarnings: 0, totalSpent: 0, netBalance: 0, transactionCount: 0 });
  const [filterType, setFilterType] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser && currentUser.mobile) {
      fetchTransactions();
    }
  }, [isOpen, currentUser, filterType]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/transactions?mobile=${encodeURIComponent(currentUser.mobile)}&type=${filterType}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setSummary(data.summary || { totalEarnings: 0, totalSpent: 0, netBalance: 0, transactionCount: 0 });
      }
    } catch (err) {
      console.error("Failed to load transactions ledger:", err);
    }
    setIsLoading(false);
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast.error("No transactions to export.");
      return;
    }

    const headers = "Transaction ID, Order ID, Date, Type, Description, Party Name, Party Mobile, Direction, Amount (INR), Status\n";
    const rows = transactions.map(t => 
      `"${t.id}","${t.order_id}","${new Date(t.date).toLocaleDateString('en-IN')}","${t.category}","${t.description}","${t.party_name}","+91 ${t.party_mobile}","${t.direction}","${t.amount}","${t.status}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kishanmarket_passbook_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Transaction Ledger exported to CSV!");
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
            <i className="fas fa-wallet text-success fs-3"></i>
            <div>
              <h5 className="fw-bold text-dark m-0">Financial Passbook & Ledger</h5>
              <small className="text-muted">Unified transaction history & audit record</small>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        {/* Summary Metrics */}
        <div className="row g-3 mb-3">
          <div className="col-md-4">
            <div className="p-3 bg-success bg-opacity-10 border border-success rounded text-center">
              <small className="text-muted fw-bold d-block">TOTAL SALES EARNINGS</small>
              <span className="fs-4 fw-bold text-success">₹{summary.totalEarnings.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-3 bg-danger bg-opacity-10 border border-danger rounded text-center">
              <small className="text-muted fw-bold d-block">TOTAL PURCHASES SPENT</small>
              <span className="fs-4 fw-bold text-danger">₹{summary.totalSpent.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-3 bg-primary bg-opacity-10 border border-primary rounded text-center">
              <small className="text-muted fw-bold d-block">NET BALANCE VOLUME</small>
              <span className="fs-4 fw-bold text-primary">₹{summary.netBalance.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Controls & Category Filter */}
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div className="btn-group btn-group-sm" role="group">
            <button className={`btn ${filterType === 'all' ? 'btn-success fw-bold' : 'btn-outline-secondary'}`} onClick={() => setFilterType('all')}>All ({summary.transactionCount})</button>
            <button className={`btn ${filterType === 'sale' ? 'btn-success fw-bold' : 'btn-outline-secondary'}`} onClick={() => setFilterType('sale')}>Sales</button>
            <button className={`btn ${filterType === 'purchase' ? 'btn-success fw-bold' : 'btn-outline-secondary'}`} onClick={() => setFilterType('purchase')}>Purchases</button>
            <button className={`btn ${filterType === 'refund' ? 'btn-success fw-bold' : 'btn-outline-secondary'}`} onClick={() => setFilterType('refund')}>Refunds</button>
          </div>

          <button className="btn btn-sm btn-outline-success fw-bold" onClick={handleExportCSV}>
            <i className="fas fa-file-csv me-1"></i> Export Passbook CSV
          </button>
        </div>

        {/* Transactions List */}
        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status"></div>
            <p className="small text-muted mt-2">Loading financial ledger...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-5 bg-light rounded border">
            <i className="fas fa-receipt text-muted fa-3x mb-3 opacity-50"></i>
            <h6 className="fw-bold text-dark">No transaction records found</h6>
            <p className="small text-muted mb-0">Your completed purchases and crop sales will appear here.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {transactions.map((t) => {
              const isCredit = t.direction === 'credit';
              const isCancelled = t.status === 'Cancelled';
              const badgeClass = isCancelled ? 'bg-danger' : (isCredit ? 'bg-success' : 'bg-primary');

              return (
                <div key={t.id} className="p-3 bg-white border rounded shadow-sm d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-3">
                    <div className={`p-3 rounded-circle text-white d-flex align-items-center justify-content-center`} style={{ width: '42px', height: '42px', backgroundColor: isCancelled ? '#ef4444' : (isCredit ? '#16a34a' : '#2563eb') }}>
                      <i className={`fas ${isCancelled ? 'fa-ban' : (isCredit ? 'fa-arrow-down-left' : 'fa-arrow-up-right')}`}></i>
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <span className={`badge ${badgeClass}`}>{t.category}</span>
                        <strong className="text-dark">{t.description}</strong>
                      </div>
                      <small className="text-muted d-block">
                        Party: <strong>{t.party_name}</strong> (+91 {t.party_mobile}) | {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </small>
                    </div>
                  </div>

                  <div className="text-end">
                    <div className={`fw-bold fs-6 ${isCancelled ? 'text-muted text-decoration-line-through' : (isCredit ? 'text-success' : 'text-dark')}`}>
                      {isCredit ? '+' : (isCancelled ? '' : '-')}₹{t.amount.toLocaleString('en-IN')}
                    </div>
                    <small className="text-muted">{t.invoice_number}</small>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="d-flex justify-content-end pt-3 border-top mt-3">
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistoryModal;

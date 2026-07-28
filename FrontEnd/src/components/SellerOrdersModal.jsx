import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import OrderStatusTracker from './OrderStatusTracker';
import CancelOrderModal from './CancelOrderModal';
import TaxInvoiceModal from './TaxInvoiceModal';

const SellerOrdersModal = ({ isOpen, onClose, currentUser }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cancelModalData, setCancelModalData] = useState({ open: false, order: null });
  const [taxInvoiceId, setTaxInvoiceId] = useState(null);

  useEffect(() => {
    if (isOpen && currentUser && currentUser.mobile) {
      fetchOrders();
    }
  }, [isOpen, currentUser]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const mob = currentUser.mobile || '';
      const nm = currentUser.name || '';
      const res = await fetch(`/api/orders/my?mobile=${encodeURIComponent(mob)}&name=${encodeURIComponent(nm)}`);
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (err) {
      console.error("Failed to load seller orders:", err);
    }
    setIsLoading(false);
  };

  const handleStatusUpdated = (updatedOrder) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1100,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="glass-card-premium p-4 text-start" style={{
        width: '90%', maxWidth: '680px', maxHeight: '85vh', overflowY: 'auto',
        background: 'white', borderRadius: '18px', boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
      }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
          <div className="d-flex align-items-center gap-2">
            <i className="fas fa-truck-ramp-box text-success fs-4"></i>
            <div>
              <h5 className="fw-bold text-dark m-0">Manage Sales & Orders</h5>
              <small className="text-muted">Track crop dispatch, packaging, & delivery states</small>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status"></div>
            <p className="small text-muted mt-2">Fetching your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-5 bg-light rounded border">
            <i className="fas fa-boxes-packing text-muted fa-3x mb-3 opacity-50"></i>
            <h6 className="fw-bold text-dark">No active orders yet</h6>
            <p className="small text-muted mb-0">When a buyer's bid is accepted or crop is sold, order records will appear here.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {orders.map((order) => (
              <div key={order.id} className="p-3 bg-white rounded border shadow-sm">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <span className="badge bg-success me-2">Order #{order.id}</span>
                    <strong className="text-dark fs-6">{order.crop_name}</strong> ({order.quantity})
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-bold text-success fs-6">₹{order.final_price}/q</span>
                    <button 
                      className="btn btn-sm btn-outline-success fw-bold py-0 px-2"
                      onClick={() => setTaxInvoiceId(order.id)}
                      title="Download GST Invoice"
                      style={{ fontSize: '0.75rem' }}
                    >
                      <i className="fas fa-file-invoice me-1"></i> Invoice 🧾
                    </button>
                  </div>
                </div>

                <div className="small text-muted mb-2">
                  <i className="fas fa-user-tie me-1 text-primary"></i> Buyer: <strong>{order.buyer_name}</strong> (+91 {order.buyer_mobile})
                </div>

                {/* Stepper Control */}
                <OrderStatusTracker 
                  order={order} 
                  isSeller={true} 
                  onStatusUpdated={handleStatusUpdated}
                  onOpenCancel={(ord) => setCancelModalData({ open: true, order: ord })}
                />
              </div>
            ))}
          </div>
        )}

        <CancelOrderModal
          isOpen={cancelModalData.open}
          onClose={() => setCancelModalData({ open: false, order: null })}
          order={cancelModalData.order}
          currentUser={currentUser}
          onOrderCancelled={handleStatusUpdated}
        />

        <TaxInvoiceModal
          isOpen={!!taxInvoiceId}
          onClose={() => setTaxInvoiceId(null)}
          orderId={taxInvoiceId}
        />

        <div className="d-flex justify-content-end pt-3 border-top mt-3">
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default SellerOrdersModal;

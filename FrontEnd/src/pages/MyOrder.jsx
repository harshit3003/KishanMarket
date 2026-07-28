import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ReviewModal from '../components/ReviewModal';
import OrderStatusTracker from '../components/OrderStatusTracker';
import CancelOrderModal from '../components/CancelOrderModal';
import RaiseDisputeModal from '../components/RaiseDisputeModal';
import TaxInvoiceModal from '../components/TaxInvoiceModal';
import socket from '../socket';
import '../assets/global.css';
import '../assets/dynamic-features.css';
import '../assets/myorder-style.css';

const MyOrder = () => {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({ name: 'Guest', role: 'buyer' });

  const [purchases, setPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [receiptModal, setReceiptModal] = useState({ open: false, order: null });
  const [reviewModalData, setReviewModalData] = useState({ open: false, order: null });
  const [cancelModalData, setCancelModalData] = useState({ open: false, order: null });
  const [disputeModalData, setDisputeModalData] = useState({ open: false, order: null });
  const [taxInvoiceId, setTaxInvoiceId] = useState(null);

  useEffect(() => {
    let mobile = 'guest';
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const parsedUser = JSON.parse(userStr);
      setCurrentUser(parsedUser);
      mobile = parsedUser.mobile || 'guest';
    }

    const fetchOrders = async () => {
      setIsLoading(true);
      if (mobile !== 'guest') {
        try {
          const res = await fetch(`/api/orders/my?mobile=${mobile}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
              setPurchases(data);
            } else {
              const pRes = await fetch(`/api/purchases?mobile=${mobile}`);
              if (pRes.ok) setPurchases(await pRes.json());
            }
          }
        } catch (e) {
          console.error("Failed to fetch orders");
        }
      }
      setIsLoading(false);
    };

    fetchOrders();

    // Real-time Order WebSockets
    const handleOrderUpdate = (updatedOrder) => {
      setPurchases(prev => {
        const idx = prev.findIndex(o => o.id === updatedOrder.id);
        if (idx !== -1) {
          const newArr = [...prev];
          newArr[idx] = updatedOrder;
          return newArr;
        } else {
          return [updatedOrder, ...prev];
        }
      });
      toast.success(`📦 Order #${updatedOrder.id} status updated to ${updatedOrder.status}!`);
    };

    socket.on('order_created', handleOrderUpdate);
    socket.on('order_status_updated', handleOrderUpdate);

    return () => {
      socket.off('order_created', handleOrderUpdate);
      socket.off('order_status_updated', handleOrderUpdate);
    };
  }, []);

  const activeOrder = purchases.find(p => p.status !== 'sold' && p.status !== 'completed' && p.status !== 'Delivered') || purchases[0];
  const pastOrders = purchases.filter(p => p !== activeOrder);

  const handleLogout = (e) => {
    e.preventDefault();
    sessionStorage.clear();
    localStorage.removeItem('currentUser');
    localStorage.removeItem('displayUserName');
    navigate('/login');
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const viewDetails = (order) => {
    setReceiptModal({ open: true, order });
  };

  return (
    <>
      
      <nav className="navbar navbar-dark shadow-sm mb-4" style={{ zIndex: 1000, position: 'relative' }}>
        <div className="container d-flex justify-content-between align-items-center">
          <a className="navbar-brand fw-bold" href="#"><i className="fas fa-seedling me-2"></i>Kishan<span style={{ color: '#f59e0b' }}>Market</span></a>

          <div className="profile-container position-relative">
            <i className="fas fa-user-circle fa-2x text-white" id="profileIcon" style={{ cursor: 'pointer' }} onClick={toggleProfile}></i>
            {isProfileOpen && (
              <div className="profile-dropdown shadow-lg active" id="profileDropdown" style={{ position: 'absolute', top: '55px', right: '0', background: 'white', width: '230px', borderRadius: '12px', padding: '10px 0', zIndex: 1000 }}>
                <div className="dropdown-user-info" style={{ padding: '10px 20px', borderBottom: '1px solid #eee', marginBottom: '10px' }}>
                  <h6 className="m-0 fw-bold text-dark">{currentUser.name}</h6>
                  <small className="text-muted">Customer ID: {currentUser.user_id || 'KM-B-1002'}</small>
                </div>
                <ul className="dropdown-links-list" style={{ listStyle: 'none', padding: '0', margin: '0' }}>
                  <li><Link to="/buyer/profile" style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', color: '#333', textDecoration: 'none', fontSize: '0.9rem' }}><i className="fas fa-user" style={{ width: '25px', marginRight: '12px', color: '#52b788' }}></i> My Profile</Link></li>
                  <li><Link to="/orders" style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', color: '#333', textDecoration: 'none', fontSize: '0.9rem' }}><i className="fas fa-shopping-basket" style={{ width: '25px', marginRight: '12px', color: '#52b788' }}></i> My Orders</Link></li>
                  <li><Link to="/buyer" style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', color: '#333', textDecoration: 'none', fontSize: '0.9rem' }}><i className="fas fa-home" style={{ width: '25px', marginRight: '12px', color: '#52b788' }}></i> Dashboard</Link></li>
                  <li className="dropdown-divider" style={{ height: '1px', backgroundColor: '#eee', margin: '5px 0' }}></li>
                  <li><a href="#" className="logout-item" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', color: '#333', textDecoration: 'none', fontSize: '0.9rem' }}><i className="fas fa-sign-out-alt" style={{ width: '25px', marginRight: '12px', color: '#52b788' }}></i> Logout</a></li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="container pb-5" style={{ position: 'relative', zIndex: 2 }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="text-dark fw-bold"><i className="fas fa-box-open me-2" style={{ color: 'var(--primary)' }}></i> My Orders</h2>
          <button className="btn btn-outline-success rounded-pill px-4 fw-bold shadow-sm" onClick={() => purchases.length > 0 ? setReceiptModal({ open: true, order: purchases[0] }) : toast.error("No transactions to download.")}>
            <i className="fas fa-file-invoice me-2"></i>Download Tax Invoice
          </button>
        </div>

        <div className="row g-4 mb-5">
          {isLoading ? (
             <div className="col-12 text-center py-5">
               <i className="fas fa-spinner fa-spin fa-2x text-success"></i>
               <p className="mt-2 text-muted">Loading your orders...</p>
             </div>
          ) : purchases.length === 0 ? (
             <div className="col-12 text-center py-5">
               <i className="fas fa-box-open fa-3x text-muted mb-3 opacity-50"></i>
               <h4 className="text-muted">No Orders Found</h4>
               <p className="text-muted">Aapne abhi tak koi fasal nahi kharidi hai.</p>
               <Link to="/buyer" className="btn btn-success mt-2 px-4">Browse Market</Link>
             </div>
          ) : (
            <>
              {activeOrder && (
                <div className="col-12">
                  <div className="glass-card-premium p-5 border-accent position-relative overflow-hidden"
                    style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.1)' }}>
                    <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>

                    <div className="d-flex justify-content-between align-items-center mb-4 position-relative" style={{ zIndex: 2 }}>
                      <h5 className="fw-bold m-0" style={{ background: 'linear-gradient(90deg, #52b788, #52b788)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        <i className="fas fa-satellite-dish me-2" style={{ color: '#52b788' }}></i> {activeOrder.status === 'sold' ? 'Delivered Order' : 'Live Transit'}: #{activeOrder.id}
                      </h5>
                      <div className="d-flex align-items-center gap-3">
                        <span className="d-flex align-items-center text-success fw-bold small"><span className="live-dot me-2"></span> {activeOrder.status === 'sold' ? 'Completed' : 'GPS Active'}</span>
                        <span className="badge bg-success text-white px-3 py-2 rounded-pill shadow-sm" style={{ fontWeight: 800, letterSpacing: '0.5px' }}>{activeOrder.status === 'sold' ? 'DELIVERED' : 'EST. TOMORROW'}</span>
                      </div>
                    </div>

                    <div className="d-flex flex-wrap justify-content-between align-items-center mb-5 border-bottom border-success border-opacity-10 pb-4">
                      <div className="mb-3 mb-md-0">
                        <h2 className="fw-bold mb-1 text-dark" style={{ letterSpacing: '-0.5px' }}>{activeOrder.weight}q {activeOrder.name}</h2>
                        <p className="mb-0 text-muted" style={{ fontSize: '0.95rem' }}><i className="fas fa-map-marker-alt text-success me-1"></i> {activeOrder.seller} &nbsp; <span className="text-success fw-bold">₹{(parseInt(activeOrder.rate||0)*parseInt(activeOrder.weight||0)).toLocaleString('en-IN')}</span></p>
                      </div>
                      <button className="btn btn-success fw-bold px-4 py-2 rounded-pill shadow" style={{ transition: 'all 0.3s ease', border: '2px solid rgba(255,255,255,0.2)' }}>
                        <i className="fas fa-phone-alt me-2"></i>Contact Seller
                      </button>
                    </div>

                    {/* Real-time OrderStatusTracker Stepper Component */}
                    <OrderStatusTracker 
                      order={activeOrder} 
                      isSeller={false} 
                      onOpenCancel={(ord) => setCancelModalData({ open: true, order: ord })}
                      onOpenDispute={(ord) => setDisputeModalData({ open: true, order: ord })}
                      onStatusUpdated={(updated) => {
                        setPurchases(prev => prev.map(p => p.id === updated.id ? updated : p));
                      }}
                    />
                  </div>
                </div>
              )}

          {/* Past Orders */}
          {pastOrders.length > 0 && (
            <div className="col-12 mt-5">
              <h3 className="text-dark fw-bold mb-4 border-start border-success border-4 ps-3">Recent Transactions</h3>
              <div className="row g-4">
                {pastOrders.map((order, i) => (
                  <div className="col-md-6 col-lg-4" key={i} style={{ perspective: '1000px' }}>
                    <div className="glass-card-premium p-4 h-100 position-relative transaction-card" style={{ transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', borderTop: '3px solid #52b788', transformStyle: 'preserve-3d' }}>
                      <div className="d-flex justify-content-between align-items-start mb-3" style={{ transform: 'translateZ(20px)' }}>
                        <span className="badge bg-success rounded-pill px-3 py-1 bg-opacity-25 text-success border border-success">
                          <i className="fas fa-check-circle me-1"></i> {order.status === 'sold' ? 'Delivered' : (order.status || 'Completed')}
                        </span>
                        <span className="text-muted small fw-bold">{order.soldDate ? new Date(order.soldDate).toLocaleDateString() : 'Unknown Date'}</span>
                      </div>
                      <h5 className="fw-bold text-dark mb-1" style={{ transform: 'translateZ(30px)' }}>{order.name} ({order.weight}q)</h5>
                      <p className="text-muted small mb-3" style={{ transform: 'translateZ(20px)' }}><i className="fas fa-store me-2"></i>{order.seller}</p>
                      <div className="d-flex justify-content-between align-items-end mt-4 pt-3 border-top border-secondary border-opacity-25" style={{ transform: 'translateZ(40px)' }}>
                        <div>
                          <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>TOTAL AMOUNT</small>
                          <span className="fw-bold fs-5 text-success">₹{(parseInt(order.rate||0)*parseInt(order.weight||0)).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="d-flex gap-2 align-items-center flex-wrap">
                          <button 
                            className="btn btn-sm btn-outline-success fw-bold px-2 py-1"
                            onClick={() => setTaxInvoiceId(order.id || 1)}
                            title="Download Official Tax Invoice"
                          >
                            <i className="fas fa-file-invoice text-success me-1"></i> Invoice 🧾
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-warning text-dark fw-bold px-2 py-1"
                            onClick={() => setReviewModalData({
                              open: true,
                              order: {
                                orderId: order.id,
                                cropName: order.name,
                                toUserMobile: order.seller_mobile || order.seller,
                                toUserName: order.seller
                              }
                            })}
                          >
                            <i className="fas fa-star text-warning me-1"></i> Rate
                          </button>
                          <button className="btn btn-sm btn-success rounded-circle shadow" style={{ width: '40px', height: '40px' }} onClick={() => viewDetails(order)}>
                            <i className="fas fa-chevron-right"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
        )}
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal 
        isOpen={reviewModalData.open} 
        onClose={() => setReviewModalData({ open: false, order: null })} 
        transactionData={reviewModalData.order} 
        currentUser={currentUser} 
      />

      {/* Cancel Order Modal */}
      <CancelOrderModal
        isOpen={cancelModalData.open}
        onClose={() => setCancelModalData({ open: false, order: null })}
        order={cancelModalData.order}
        currentUser={currentUser}
        onOrderCancelled={(updated) => {
          setPurchases(prev => prev.map(p => p.id === updated.id ? updated : p));
        }}
      />

      {/* Raise Dispute Modal */}
      <RaiseDisputeModal
        isOpen={disputeModalData.open}
        onClose={() => setDisputeModalData({ open: false, order: null })}
        order={disputeModalData.order}
        currentUser={currentUser}
      />

      {/* Tax Invoice Modal */}
      <TaxInvoiceModal
        isOpen={!!taxInvoiceId}
        onClose={() => setTaxInvoiceId(null)}
        orderId={taxInvoiceId}
      />

      {/* Tax Invoice Modal */}
      {receiptModal.open && receiptModal.order && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card-premium p-4 text-start" style={{ width: '90%', maxWidth: '550px', background: 'white', borderRadius: '15px' }}>
            <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
              <div>
                <h5 className="fw-bold text-success m-0"><i className="fas fa-file-invoice me-2"></i>Official Tax Invoice</h5>
                <small className="text-muted">Invoice No: KM-INV-2026-0{receiptModal.order.id || 1}</small>
              </div>
              <button className="btn-close" onClick={() => setReceiptModal({ open: false, order: null })}></button>
            </div>

            <div className="p-3 bg-light rounded mb-3 border">
              <div className="row g-2 small">
                <div className="col-6"><strong>Buyer:</strong> {currentUser.name} ({currentUser.user_id || 'KM-B-1002'})</div>
                <div className="col-6"><strong>Seller:</strong> {receiptModal.order.seller || 'Verified Seller'}</div>
                <div className="col-6"><strong>Item:</strong> {receiptModal.order.weight}q {receiptModal.order.name || receiptModal.order.crop}</div>
                <div className="col-6"><strong>Rate:</strong> ₹{receiptModal.order.rate}/q</div>
              </div>
            </div>

            <div className="table-responsive mb-3">
              <table className="table table-bordered table-sm small">
                <thead className="table-success">
                  <tr>
                    <th>Description</th>
                    <th className="text-end">Qty (q)</th>
                    <th className="text-end">Rate (₹)</th>
                    <th className="text-end">Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{receiptModal.order.name || 'Agri Produce'} Bulk Purchase</td>
                    <td className="text-end">{receiptModal.order.weight}</td>
                    <td className="text-end">₹{receiptModal.order.rate}</td>
                    <td className="text-end">₹{(parseFloat(receiptModal.order.rate||0) * parseFloat(receiptModal.order.weight||0)).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="text-end fw-bold">GST (0% Exempted Agri)</td>
                    <td className="text-end">₹0</td>
                  </tr>
                  <tr className="table-light fw-bold">
                    <td colSpan="3" className="text-end text-success">Grand Total</td>
                    <td className="text-end text-success">₹{(parseFloat(receiptModal.order.rate||0) * parseFloat(receiptModal.order.weight||0)).toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-between align-items-center pt-2 border-top">
              <small className="text-muted"><i className="fas fa-check-circle text-success me-1"></i> Digitally Signed & Verified</small>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => window.print()}>
                  <i className="fas fa-print me-1"></i> Print / Save PDF
                </button>
                <button className="btn btn-success btn-sm fw-bold" onClick={() => setReceiptModal({ open: false, order: null })}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MyOrder;

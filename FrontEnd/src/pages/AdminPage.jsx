import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../assets/global.css';
import '../assets/dynamic-features.css';

const ADMIN_SECRET_KEY = 'KishanAdmin@2026';
const ADMIN_SESSION_TOKEN = 'KM_ADMIN_AUTHORIZED_TOKEN_2026';

const AdminPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'listings', 'orders', 'reports', 'tickets'
  const [overview, setOverview] = useState({ activeUsers: 0, activeCrops: 0, totalOrders: 0, totalGmv: 0, pendingReports: 0, openDisputes: 0, openTickets: 0 });
  
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reports, setReports] = useState([]);
  const [tickets, setTickets] = useState([]);
  
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [adminReplyMsg, setAdminReplyMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getAdminHeaders = () => ({
    'Content-Type': 'application/json',
    'x-admin-key': ADMIN_SECRET_KEY,
    'x-admin-token': ADMIN_SESSION_TOKEN
  });

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // Fetch overview metrics
      const ovRes = await fetch('/api/admin/overview', { headers: getAdminHeaders() });
      if (ovRes.ok) setOverview(await ovRes.json());

      if (activeTab === 'users') {
        const uRes = await fetch('/api/admin/users', { headers: getAdminHeaders() });
        if (uRes.ok) setUsers(await uRes.json());
      } else if (activeTab === 'listings') {
        const lRes = await fetch('/api/admin/listings', { headers: getAdminHeaders() });
        if (lRes.ok) setListings(await lRes.json());
      } else if (activeTab === 'orders') {
        const oRes = await fetch('/api/admin/orders', { headers: getAdminHeaders() });
        if (oRes.ok) setOrders(await oRes.json());
      } else if (activeTab === 'reports') {
        const rRes = await fetch('/api/admin/reports', { headers: getAdminHeaders() });
        if (rRes.ok) setReports(await rRes.json());
      } else if (activeTab === 'tickets') {
        const tRes = await fetch('/api/admin/tickets', { headers: getAdminHeaders() });
        if (tRes.ok) setTickets(await tRes.json());
      }
    } catch (err) {
      console.error("Failed to load admin dashboard data:", err);
    }
    setIsLoading(false);
  };

  const handleUserToggleStatus = async (mobile, isSuspended) => {
    try {
      const endpoint = isSuspended ? `/api/admin/users/${mobile}/unsuspend` : `/api/admin/users/${mobile}/suspend`;
      const res = await fetch(endpoint, { method: 'PUT', headers: getAdminHeaders() });
      if (res.ok) {
        toast.success(`User +91 ${mobile} ${isSuspended ? 'unsuspended' : 'suspended'}!`);
        fetchAdminData();
      }
    } catch (e) {
      toast.error("Action failed.");
    }
  };

  const handleListingToggleRemove = async (id, isRemoved) => {
    try {
      const endpoint = isRemoved ? `/api/admin/listings/${id}/restore` : `/api/admin/listings/${id}/remove`;
      const res = await fetch(endpoint, { method: 'PUT', headers: getAdminHeaders() });
      if (res.ok) {
        toast.success(`Listing #${id} ${isRemoved ? 'restored' : 'removed'}!`);
        fetchAdminData();
      }
    } catch (e) {
      toast.error("Action failed.");
    }
  };

  const handleOrderStatusUpdate = async (id, status) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}/status`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success(`Order #${id} status set to ${status}`);
        fetchAdminData();
      }
    } catch (e) {
      toast.error("Failed to update order status.");
    }
  };

  const handleReportAction = async (reportId, action) => {
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/action`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        toast.success(`Report #${reportId} updated to ${action}`);
        fetchAdminData();
      }
    } catch (err) {
      toast.error("Failed to process report action.");
    }
  };

  const handleAdminTicketReply = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !adminReplyMsg.trim()) return;

    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_mobile: 'ADMIN',
          sender_name: 'KishanMarket SuperAdmin',
          is_admin: 1,
          message: adminReplyMsg
        })
      });

      if (res.ok) {
        toast.success("Official admin reply posted!");
        setAdminReplyMsg('');
        fetchAdminData();
      }
    } catch (err) {
      toast.error("Failed to post admin reply.");
    }
  };

  const handleLogout = (e) => {
    if (e) e.preventDefault();
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('isAuthenticated');
    toast.success("SuperAdmin session closed.");
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#f8fafc', paddingBottom: '60px' }}>
      {/* SuperAdmin Top Header */}
      <nav className="navbar navbar-dark shadow" style={{ background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="container d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <i className="fas fa-shield-halved text-warning fs-2"></i>
            <div>
              <h4 className="m-0 fw-bold text-white">Kishan<span style={{ color: '#f59e0b' }}>Market</span> Governance HQ</h4>
              <small className="text-emerald-400 fw-semibold" style={{ color: '#34d399' }}>
                <i className="fas fa-circle text-success me-1" style={{ fontSize: '0.6rem' }}></i> Live SuperAdmin Active Session
              </small>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            <span className="badge bg-warning text-dark px-3 py-2 fw-bold rounded-pill shadow-sm" style={{ fontSize: '0.85rem' }}>
              <i className="fas fa-user-shield me-1"></i> SuperAdmin
            </span>
            <button className="btn btn-outline-light btn-sm fw-bold px-3 rounded-pill shadow-sm" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt me-1"></i> Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Admin Dashboard Container */}
      <div className="container mt-4">
        {/* Metrics Summary Ribbon with High-Contrast Solid White Cards */}
        <div className="row g-3 mb-4">
          <div className="col-lg-2 col-md-4 col-6">
            <div className="p-3 rounded-4 shadow-sm text-center border" style={{ background: '#ffffff', borderColor: '#cbd5e1' }}>
              <span className="text-uppercase fw-bold d-block mb-1" style={{ color: '#475569 !important', fontSize: '0.72rem', letterSpacing: '0.5px' }}>REGISTERED USERS</span>
              <h3 className="fw-bold m-0" style={{ color: '#0284c7 !important' }}>{overview.activeUsers}</h3>
            </div>
          </div>
          <div className="col-lg-2 col-md-4 col-6">
            <div className="p-3 rounded-4 shadow-sm text-center border" style={{ background: '#ffffff', borderColor: '#cbd5e1' }}>
              <span className="text-uppercase fw-bold d-block mb-1" style={{ color: '#475569 !important', fontSize: '0.72rem', letterSpacing: '0.5px' }}>CROP LISTINGS</span>
              <h3 className="fw-bold m-0" style={{ color: '#16a34a !important' }}>{overview.activeCrops}</h3>
            </div>
          </div>
          <div className="col-lg-2 col-md-4 col-6">
            <div className="p-3 rounded-4 shadow-sm text-center border" style={{ background: '#ffffff', borderColor: '#cbd5e1' }}>
              <span className="text-uppercase fw-bold d-block mb-1" style={{ color: '#475569 !important', fontSize: '0.72rem', letterSpacing: '0.5px' }}>TOTAL ORDERS</span>
              <h3 className="fw-bold m-0" style={{ color: '#d97706 !important' }}>{overview.totalOrders}</h3>
            </div>
          </div>
          <div className="col-lg-2 col-md-4 col-6">
            <div className="p-3 rounded-4 shadow-sm text-center border" style={{ background: '#ffffff', borderColor: '#cbd5e1' }}>
              <span className="text-uppercase fw-bold d-block mb-1" style={{ color: '#475569 !important', fontSize: '0.72rem', letterSpacing: '0.5px' }}>GMV VALUATION</span>
              <h3 className="fw-bold m-0" style={{ color: '#059669 !important' }}>₹{overview.totalGmv ? overview.totalGmv.toLocaleString('en-IN') : 0}</h3>
            </div>
          </div>
          <div className="col-lg-2 col-md-4 col-6">
            <div className="p-3 rounded-4 shadow-sm text-center border" style={{ background: '#ffffff', borderColor: '#cbd5e1' }}>
              <span className="text-uppercase fw-bold d-block mb-1" style={{ color: '#475569 !important', fontSize: '0.72rem', letterSpacing: '0.5px' }}>PENDING REPORTS</span>
              <h3 className="fw-bold m-0" style={{ color: '#dc2626 !important' }}>{overview.pendingReports}</h3>
            </div>
          </div>
          <div className="col-lg-2 col-md-4 col-6">
            <div className="p-3 rounded-4 shadow-sm text-center border" style={{ background: '#ffffff', borderColor: '#cbd5e1' }}>
              <span className="text-uppercase fw-bold d-block mb-1" style={{ color: '#475569 !important', fontSize: '0.72rem', letterSpacing: '0.5px' }}>OPEN TICKETS</span>
              <h3 className="fw-bold m-0" style={{ color: '#2563eb !important' }}>{overview.openTickets}</h3>
            </div>
          </div>
        </div>

        {/* Tab Navigation Bar with High Contrast Buttons */}
        <div className="p-2 rounded-4 mb-4 border d-flex gap-2 flex-wrap" style={{ background: '#ffffff', borderColor: '#cbd5e1' }}>
          <button
            className="btn rounded-3 fw-bold px-4 transition-all"
            style={{
              background: activeTab === 'overview' ? '#059669' : '#f8fafc',
              color: activeTab === 'overview' ? '#ffffff !important' : '#0f172a !important',
              border: activeTab === 'overview' ? '1px solid #10b981' : '1px solid #cbd5e1',
              boxShadow: activeTab === 'overview' ? '0 4px 12px rgba(16,185,129,0.3)' : 'none'
            }}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview & Metrics
          </button>

          <button
            className="btn rounded-3 fw-bold px-4 transition-all"
            style={{
              background: activeTab === 'users' ? '#059669' : '#f8fafc',
              color: activeTab === 'users' ? '#ffffff !important' : '#0f172a !important',
              border: activeTab === 'users' ? '1px solid #10b981' : '1px solid #cbd5e1',
              boxShadow: activeTab === 'users' ? '0 4px 12px rgba(16,185,129,0.3)' : 'none'
            }}
            onClick={() => setActiveTab('users')}
          >
            👥 Registered Users ({overview.activeUsers})
          </button>

          <button
            className="btn rounded-3 fw-bold px-4 transition-all"
            style={{
              background: activeTab === 'listings' ? '#059669' : '#f8fafc',
              color: activeTab === 'listings' ? '#ffffff !important' : '#0f172a !important',
              border: activeTab === 'listings' ? '1px solid #10b981' : '1px solid #cbd5e1',
              boxShadow: activeTab === 'listings' ? '0 4px 12px rgba(16,185,129,0.3)' : 'none'
            }}
            onClick={() => setActiveTab('listings')}
          >
            🌾 Crop Listings ({overview.activeCrops})
          </button>

          <button
            className="btn rounded-3 fw-bold px-4 transition-all"
            style={{
              background: activeTab === 'orders' ? '#059669' : '#f8fafc',
              color: activeTab === 'orders' ? '#ffffff !important' : '#0f172a !important',
              border: activeTab === 'orders' ? '1px solid #10b981' : '1px solid #cbd5e1',
              boxShadow: activeTab === 'orders' ? '0 4px 12px rgba(16,185,129,0.3)' : 'none'
            }}
            onClick={() => setActiveTab('orders')}
          >
            🚚 System Orders ({overview.totalOrders})
          </button>

          <button
            className="btn rounded-3 fw-bold px-4 transition-all"
            style={{
              background: activeTab === 'reports' ? '#059669' : '#f8fafc',
              color: activeTab === 'reports' ? '#ffffff !important' : '#0f172a !important',
              border: activeTab === 'reports' ? '1px solid #10b981' : '1px solid #cbd5e1',
              boxShadow: activeTab === 'reports' ? '0 4px 12px rgba(16,185,129,0.3)' : 'none'
            }}
            onClick={() => setActiveTab('reports')}
          >
            🚩 Flagged Reports ({overview.pendingReports})
          </button>

          <button
            className="btn rounded-3 fw-bold px-4 transition-all"
            style={{
              background: activeTab === 'tickets' ? '#059669' : '#f8fafc',
              color: activeTab === 'tickets' ? '#ffffff !important' : '#0f172a !important',
              border: activeTab === 'tickets' ? '1px solid #10b981' : '1px solid #cbd5e1',
              boxShadow: activeTab === 'tickets' ? '0 4px 12px rgba(16,185,129,0.3)' : 'none'
            }}
            onClick={() => setActiveTab('tickets')}
          >
            🎫 Support Queue ({overview.openTickets})
          </button>
        </div>

        {/* Tab Content Panel */}
        <div className="p-4 rounded-4 shadow-lg border" style={{ background: '#0f172a', borderColor: '#334155' }}>
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status"></div>
              <p className="small text-white mt-2">Loading platform data...</p>
            </div>
          ) : (
            <div>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div>
                  <h5 className="fw-bold mb-3" style={{ color: '#34d399 !important' }}><i className="fas fa-chart-line me-2"></i> Marketplace Analytics & System Status</h5>
                  <div className="row g-4 mb-4">
                    <div className="col-md-6">
                      <div className="p-4 rounded-3 border shadow-sm" style={{ background: '#ffffff', borderColor: '#cbd5e1' }}>
                        <h6 className="fw-bold mb-3" style={{ color: '#0f172a !important' }}>Gross Merchandise Value (GMV) Summary</h6>
                        <div className="fs-2 fw-bold mb-2" style={{ color: '#059669 !important' }}>₹{overview.totalGmv ? overview.totalGmv.toLocaleString('en-IN') : 0}</div>
                        <p className="small mb-0" style={{ color: '#334155 !important', fontWeight: '500' }}>Total volume of completed & confirmed agricultural crop trades processed on KishanMarket platform.</p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="p-4 rounded-3 border shadow-sm" style={{ background: '#ffffff', borderColor: '#cbd5e1' }}>
                        <h6 className="fw-bold mb-3" style={{ color: '#0f172a !important' }}>System Health & Cloud Synchronization</h6>
                        <ul className="list-unstyled mb-0 small" style={{ color: '#334155 !important', fontWeight: '600' }}>
                          <li className="mb-2"><i className="fas fa-check-circle text-success me-2"></i> <strong style={{ color: '#0f172a !important' }}>MongoDB Cloud Atlas:</strong> Synchronized & Active</li>
                          <li className="mb-2"><i className="fas fa-check-circle text-success me-2"></i> <strong style={{ color: '#0f172a !important' }}>WebSockets Realtime Engine:</strong> Operational</li>
                          <li className="mb-2"><i className="fas fa-check-circle text-success me-2"></i> <strong style={{ color: '#0f172a !important' }}>Mandi Market Price Intelligence:</strong> Live Feed Updating</li>
                          <li><i className="fas fa-check-circle text-success me-2"></i> <strong style={{ color: '#0f172a !important' }}>SuperAdmin Authentication Guard:</strong> Enforced</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: USERS MANAGEMENT */}
              {activeTab === 'users' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold text-white m-0"><i className="fas fa-users text-info me-2"></i> Registered Platform Users</h5>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-dark text-white border-secondary w-auto"
                      placeholder="Filter users..."
                      value={searchFilter}
                      onChange={e => setSearchFilter(e.target.value)}
                    />
                  </div>
                  <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    <table className="table table-dark table-hover table-bordered align-middle small mb-0">
                      <thead className="table-secondary text-dark sticky-top">
                        <tr>
                          <th>User ID</th>
                          <th>Name</th>
                          <th>Mobile</th>
                          <th>Role</th>
                          <th>Location</th>
                          <th>Status</th>
                          <th className="text-center">Enforcement Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users
                          .filter(u => !searchFilter || (u.name + u.mobile + u.role + u.location).toLowerCase().includes(searchFilter.toLowerCase()))
                          .map((u, i) => (
                            <tr key={i}>
                              <td className="fw-bold">{u.user_id || `KM-U-${i+1}`}</td>
                              <td className="fw-bold text-white">{u.name}</td>
                              <td>+91 {u.mobile}</td>
                              <td><span className={`badge ${u.role === 'admin' ? 'bg-danger' : (u.role === 'seller' ? 'bg-success' : 'bg-primary')}`}>{u.role}</span></td>
                              <td>{u.location || 'Local Mandi'}</td>
                              <td><span className={`badge ${u.account_status === 'suspended' ? 'bg-danger' : 'bg-success'}`}>{u.account_status || 'active'}</span></td>
                              <td className="text-center">
                                {u.role !== 'admin' && (
                                  <button
                                    className={`btn btn-sm ${u.account_status === 'suspended' ? 'btn-success' : 'btn-outline-danger'} fw-bold px-3 py-1`}
                                    onClick={() => handleUserToggleStatus(u.mobile, u.account_status === 'suspended')}
                                  >
                                    {u.account_status === 'suspended' ? 'Unsuspend' : 'Suspend Account'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: CROP LISTINGS MODERATION */}
              {activeTab === 'listings' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold text-white m-0"><i className="fas fa-boxes-stacked text-success me-2"></i> Marketplace Crop Listings</h5>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-dark text-white border-secondary w-auto"
                      placeholder="Search listings..."
                      value={searchFilter}
                      onChange={e => setSearchFilter(e.target.value)}
                    />
                  </div>
                  <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    <table className="table table-dark table-hover table-bordered align-middle small mb-0">
                      <thead className="table-secondary text-dark sticky-top">
                        <tr>
                          <th>ID</th>
                          <th>Crop Name</th>
                          <th>Weight</th>
                          <th>Rate</th>
                          <th>Seller</th>
                          <th>Location</th>
                          <th>Status</th>
                          <th className="text-center">Moderation Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {listings
                          .filter(c => !searchFilter || (c.name + c.seller + c.loc).toLowerCase().includes(searchFilter.toLowerCase()))
                          .map((c, i) => (
                            <tr key={i} className={c.is_removed ? 'opacity-50' : ''}>
                              <td className="fw-bold">#{c.id}</td>
                              <td className="fw-bold text-success">{c.name}</td>
                              <td>{c.weight} quintals</td>
                              <td className="fw-bold text-warning">₹{c.rate}/q</td>
                              <td>{c.seller} (+91 {c.seller_mobile})</td>
                              <td>{c.loc || 'Local Mandi'}</td>
                              <td><span className={`badge ${c.is_removed ? 'bg-danger' : (c.status === 'sold' ? 'bg-info' : 'bg-success')}`}>{c.is_removed ? 'Removed' : (c.status || 'Active')}</span></td>
                              <td className="text-center">
                                <button
                                  className={`btn btn-sm ${c.is_removed ? 'btn-success' : 'btn-outline-danger'} fw-bold px-3 py-1`}
                                  onClick={() => handleListingToggleRemove(c.id, c.is_removed)}
                                >
                                  {c.is_removed ? 'Restore Listing' : 'Remove Listing'}
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: ORDERS & LOGISTICS */}
              {activeTab === 'orders' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold text-white m-0"><i className="fas fa-truck text-warning me-2"></i> System Orders & Logistics Override</h5>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-dark text-white border-secondary w-auto"
                      placeholder="Search orders..."
                      value={searchFilter}
                      onChange={e => setSearchFilter(e.target.value)}
                    />
                  </div>
                  <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    <table className="table table-dark table-hover table-bordered align-middle small mb-0">
                      <thead className="table-secondary text-dark sticky-top">
                        <tr>
                          <th>Order ID</th>
                          <th>Crop</th>
                          <th>Buyer</th>
                          <th>Seller</th>
                          <th>Quantity</th>
                          <th>Total Value</th>
                          <th>Current Status</th>
                          <th className="text-center">Status Action Override</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders
                          .filter(o => !searchFilter || (o.crop_name + o.buyer_name + o.seller_name).toLowerCase().includes(searchFilter.toLowerCase()))
                          .map((o, i) => (
                            <tr key={i}>
                              <td className="fw-bold">ORD-#{o.id}</td>
                              <td className="fw-bold text-white">{o.crop_name}</td>
                              <td>{o.buyer_name} (+91 {o.buyer_mobile})</td>
                              <td>{o.seller_name} (+91 {o.seller_mobile})</td>
                              <td>{o.quantity}q</td>
                              <td className="fw-bold text-emerald-400" style={{ color: '#34d399' }}>₹{(parseFloat(o.final_price || 0) * parseFloat(o.quantity || 1)).toLocaleString('en-IN')}</td>
                              <td><span className="badge bg-success">{o.status}</span></td>
                              <td className="text-center">
                                <select
                                  className="form-select form-select-sm bg-dark text-white border-secondary d-inline-block w-auto py-1"
                                  value={o.status}
                                  onChange={e => handleOrderStatusUpdate(o.id, e.target.value)}
                                >
                                  <option value="Confirmed">Confirmed</option>
                                  <option value="Packed & Ready">Packed & Ready</option>
                                  <option value="In Transit">In Transit</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: FLAGGED REPORTS QUEUE */}
              {activeTab === 'reports' && (
                <div>
                  <h5 className="fw-bold text-white mb-3"><i className="fas fa-flag text-danger me-2"></i> User & Listing Reports Queue</h5>
                  {reports.length === 0 ? (
                    <div className="text-center py-5 rounded-4 border" style={{ background: '#0f172a', borderColor: '#334155' }}>
                      <i className="fas fa-check-circle fs-2 mb-2 d-block" style={{ color: '#34d399' }}></i>
                      <h6 className="fw-bold text-white m-0">No Reports Submitted</h6>
                      <small style={{ color: '#94a3b8' }}>All marketplace crop listings and registered user accounts are currently clean.</small>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {reports.map((r) => (
                        <div key={r.id} className="p-3 bg-dark bg-opacity-75 border border-secondary rounded-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className={`badge ${r.status === 'Pending' ? 'bg-danger' : 'bg-secondary'}`}>
                              Report #{r.id} ({r.target_type})
                            </span>
                            <small className="text-muted">{r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : 'Recent'}</small>
                          </div>
                          <div className="fw-bold text-white">Target: {r.target_name || r.target_id}</div>
                          <small className="text-muted d-block">Reported By: {r.reported_by_name} (+91 {r.reported_by_mobile})</small>
                          <div className="p-2 bg-black bg-opacity-50 rounded border border-secondary mt-2 small text-slate-200">
                            <strong>Reason:</strong> {r.reason} {r.notes ? `(${r.notes})` : ''}
                          </div>

                          {r.status === 'Pending' && (
                            <div className="d-flex gap-2 mt-3 justify-content-end">
                              <button className="btn btn-sm btn-outline-light" onClick={() => handleReportAction(r.id, 'Dismiss')}>Dismiss</button>
                              {r.target_type === 'user' ? (
                                <button className="btn btn-sm btn-danger fw-bold" onClick={() => { handleUserToggleStatus(r.target_id, false); handleReportAction(r.id, 'User Suspended'); }}>Suspend User</button>
                              ) : (
                                <button className="btn btn-sm btn-danger fw-bold" onClick={() => { handleListingToggleRemove(r.target_id, false); handleReportAction(r.id, 'Listing Removed'); }}>Remove Listing</button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: SUPPORT TICKETS QUEUE */}
              {activeTab === 'tickets' && (
                <div>
                  <h5 className="fw-bold text-white mb-3"><i className="fas fa-headset text-primary me-2"></i> Platform Support Ticket Resolution</h5>
                  {selectedTicket ? (
                    <div className="p-4 bg-dark bg-opacity-75 border border-secondary rounded-3">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <button className="btn btn-sm btn-outline-light" onClick={() => setSelectedTicket(null)}>← Back to Ticket Queue</button>
                        <span className={`badge ${selectedTicket.status === 'Resolved' ? 'bg-success' : 'bg-warning text-dark'}`}>{selectedTicket.status}</span>
                      </div>

                      <h6 className="fw-bold text-white">{selectedTicket.subject}</h6>
                      <small className="text-muted d-block mb-3">Ticket #{selectedTicket.id} • User: {selectedTicket.user_name} (+91 {selectedTicket.user_mobile})</small>
                      <div className="p-3 bg-black bg-opacity-50 rounded border border-secondary mb-3 small">{selectedTicket.description}</div>

                      <h6 className="fw-bold text-white mb-2">Message History</h6>
                      <div className="d-flex flex-column gap-2 mb-3">
                        {(selectedTicket.replies || []).map((r, idx) => (
                          <div key={idx} className={`p-2 rounded border small ${r.is_admin ? 'bg-success bg-opacity-25 border-success text-white' : 'bg-dark text-slate-300'}`}>
                            <strong>{r.sender_name}:</strong> {r.message}
                          </div>
                        ))}
                      </div>

                      <form onSubmit={handleAdminTicketReply} className="d-flex gap-2">
                        <input
                          type="text"
                          className="form-control form-control-sm bg-dark text-white border-secondary"
                          placeholder="Type official SuperAdmin reply..."
                          value={adminReplyMsg}
                          onChange={e => setAdminReplyMsg(e.target.value)}
                          required
                        />
                        <button type="submit" className="btn btn-sm btn-success fw-bold px-4 text-nowrap">Post Reply</button>
                      </form>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {tickets.map((t) => (
                        <div key={t.id} className="p-3 bg-dark bg-opacity-75 border border-secondary rounded-3 d-flex justify-content-between align-items-center" style={{ cursor: 'pointer' }} onClick={() => setSelectedTicket(t)}>
                          <div>
                            <div className="fw-bold text-white">{t.subject}</div>
                            <small className="text-muted">User: {t.user_name} (+91 {t.user_mobile}) • #{t.id}</small>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;

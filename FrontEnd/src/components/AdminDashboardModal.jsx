import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const AdminDashboardModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'reports', 'disputes', 'moderation', 'tickets'
  const [overview, setOverview] = useState({ activeUsers: 0, activeCrops: 0, totalOrders: 0, totalGmv: 0, pendingReports: 0, openDisputes: 0, openTickets: 0 });
  const [reports, setReports] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [suspendMobileInput, setSuspendMobileInput] = useState('');
  const [removeListingIdInput, setRemoveListingIdInput] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [adminReplyMsg, setAdminReplyMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [adminMobile, setAdminMobile] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('adminToken');
    if (savedToken === 'KM_ADMIN_AUTHORIZED_TOKEN_2026') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchAdminData();
    }
  }, [isOpen, activeTab, isAuthenticated]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: adminMobile, password: adminPassword })
      });

      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem('adminToken', 'KM_ADMIN_AUTHORIZED_TOKEN_2026');
        setIsAuthenticated(true);
        toast.success("🔐 Welcome SuperAdmin! Access Authorized.");

        const localUserStr = localStorage.getItem('currentUser');
        if (localUserStr) {
          try {
            const parsed = JSON.parse(localUserStr);
            parsed.role = 'admin';
            localStorage.setItem('currentUser', JSON.stringify(parsed));
          } catch (e) {}
        }
      } else {
        toast.error("Access Denied: Invalid Admin Mobile or Secret Password.");
      }
    } catch (err) {
      toast.error("Network error during admin login.");
    }
    setIsLoading(false);
  };

  const getAdminHeaders = () => ({
    'Content-Type': 'application/json',
    'x-admin-key': 'KishanAdmin@2026',
    'x-admin-token': 'KM_ADMIN_AUTHORIZED_TOKEN_2026'
  });

  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // Fetch overview
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
      } else if (activeTab === 'disputes') {
        const dRes = await fetch('/api/admin/disputes', { headers: getAdminHeaders() });
        if (dRes.ok) setDisputes(await dRes.json());
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
        toast.success(`Report #${reportId} set to ${action}`);
        fetchAdminData();
      }
    } catch (err) {
      toast.error("Failed to process report action.");
    }
  };

  const handleSuspendUser = async (mobile) => {
    if (!mobile) return;
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(mobile)}/suspend`, { method: 'PUT' });
      if (res.ok) {
        toast.success(`User +91 ${mobile} suspended successfully.`);
        setSuspendMobileInput('');
      } else {
        toast.error("Failed to suspend user.");
      }
    } catch (e) {
      toast.error("Network error suspending user.");
    }
  };

  const handleRemoveListing = async (listingId) => {
    if (!listingId) return;
    try {
      const res = await fetch(`/api/admin/listings/${listingId}/remove`, { method: 'PUT' });
      if (res.ok) {
        toast.success(`Crop listing #${listingId} removed from market.`);
        setRemoveListingIdInput('');
      } else {
        toast.error("Failed to remove listing.");
      }
    } catch (e) {
      toast.error("Network error removing listing.");
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
          sender_name: 'KishanMarket Admin',
          is_admin: 1,
          message: adminReplyMsg
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Admin reply posted!");
        setAdminReplyMsg('');
        setSelectedTicket(prev => ({
          ...prev,
          replies: [...(prev.replies || []), data.reply]
        }));
      }
    } catch (err) {
      toast.error("Failed to post admin reply.");
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1200,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="glass-card-premium p-4 text-start" style={{
        width: '94%', maxWidth: '860px', maxHeight: '90vh', overflowY: 'auto',
        background: 'white', borderRadius: '18px', boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
      }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
          <div className="d-flex align-items-center gap-2">
            <i className="fas fa-shield-halved text-success fs-3"></i>
            <div>
              <h5 className="fw-bold text-dark m-0">Admin Control Center</h5>
              <small className="text-muted">Central marketplace control, moderation, & GMV dashboard</small>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        {!isAuthenticated ? (
          <div className="py-4 text-center">
            <div className="mb-4">
              <div style={{ width: '70px', height: '70px', background: '#ecfdf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto', border: '2px solid #10b981' }}>
                <i className="fas fa-user-shield text-success fs-2"></i>
              </div>
              <h5 className="fw-bold text-dark">SuperAdmin Authentication</h5>
              <p className="small text-muted mb-0">Enter your official admin credentials to access central governance tools</p>
            </div>

            <form onSubmit={handleAdminLogin} style={{ maxWidth: '380px', margin: '0 auto' }}>
              <div className="mb-3 text-start">
                <label className="form-label small fw-bold text-dark">Admin Mobile Number / ID</label>
                <input
                  type="text"
                  className="form-control form-control-lg fs-6"
                  placeholder="0000000000"
                  value={adminMobile}
                  onChange={(e) => setAdminMobile(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4 text-start">
                <label className="form-label small fw-bold text-dark">Admin Secret Key / Password</label>
                <input
                  type="password"
                  className="form-control form-control-lg fs-6"
                  placeholder="••••••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-success btn-lg w-100 fw-bold fs-6 shadow-sm" disabled={isLoading}>
                {isLoading ? <i className="fas fa-spinner fa-spin me-2"></i> : <i className="fas fa-key me-2"></i>}
                Authorize Admin Access
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="nav nav-pills nav-fill p-1.5 rounded-3 mb-4 border" style={{ background: '#f8fafc', borderColor: '#e2e8f0', fontSize: '0.85rem', gap: '4px' }}>
              <button className={`nav-link fw-bold ${activeTab === 'overview' ? 'active bg-success text-white shadow-sm' : 'bg-white text-dark border'}`} onClick={() => setActiveTab('overview')}>
                📊 Overview
              </button>
              <button className={`nav-link fw-bold ${activeTab === 'users' ? 'active bg-success text-white shadow-sm' : 'bg-white text-dark border'}`} onClick={() => setActiveTab('users')}>
                👥 Users ({overview.activeUsers})
              </button>
              <button className={`nav-link fw-bold ${activeTab === 'listings' ? 'active bg-success text-white shadow-sm' : 'bg-white text-dark border'}`} onClick={() => setActiveTab('listings')}>
                🌾 Crop Listings
              </button>
              <button className={`nav-link fw-bold ${activeTab === 'orders' ? 'active bg-success text-white shadow-sm' : 'bg-white text-dark border'}`} onClick={() => setActiveTab('orders')}>
                🚚 Orders ({overview.totalOrders})
              </button>
              <button className={`nav-link fw-bold ${activeTab === 'reports' ? 'active bg-success text-white shadow-sm' : 'bg-white text-dark border'}`} onClick={() => setActiveTab('reports')}>
                🚩 Reports ({overview.pendingReports})
              </button>
              <button className={`nav-link fw-bold ${activeTab === 'tickets' ? 'active bg-success text-white shadow-sm' : 'bg-white text-dark border'}`} onClick={() => setActiveTab('tickets')}>
                🎫 Tickets ({overview.openTickets})
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status"></div>
                <p className="small fw-bold text-dark mt-2">Loading platform data...</p>
              </div>
            ) : (
          <div>
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div>
                <div className="row g-3 mb-4">
                  <div className="col-md-3 col-6">
                    <div className="p-3 rounded text-center border" style={{ background: '#ecfdf5', borderColor: '#10b981' }}>
                      <small className="d-block fw-bold text-uppercase mb-1" style={{ color: '#047857', fontSize: '0.72rem', letterSpacing: '0.5px' }}>PLATFORM GMV</small>
                      <span className="fs-4 fw-bold text-success">₹{overview.totalGmv.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div className="col-md-3 col-6">
                    <div className="p-3 rounded text-center border" style={{ background: '#f0f9ff', borderColor: '#0284c7' }}>
                      <small className="d-block fw-bold text-uppercase mb-1" style={{ color: '#0369a1', fontSize: '0.72rem', letterSpacing: '0.5px' }}>REGISTERED USERS</small>
                      <span className="fs-4 fw-bold" style={{ color: '#0284c7' }}>{overview.activeUsers}</span>
                    </div>
                  </div>
                  <div className="col-md-3 col-6">
                    <div className="p-3 rounded text-center border" style={{ background: '#f5f3ff', borderColor: '#7c3aed' }}>
                      <small className="d-block fw-bold text-uppercase mb-1" style={{ color: '#6d28d9', fontSize: '0.72rem', letterSpacing: '0.5px' }}>ACTIVE LISTINGS</small>
                      <span className="fs-4 fw-bold" style={{ color: '#7c3aed' }}>{overview.activeCrops}</span>
                    </div>
                  </div>
                  <div className="col-md-3 col-6">
                    <div className="p-3 rounded text-center border" style={{ background: '#fffbeb', borderColor: '#d97706' }}>
                      <small className="d-block fw-bold text-uppercase mb-1" style={{ color: '#b45309', fontSize: '0.72rem', letterSpacing: '0.5px' }}>TOTAL ORDERS</small>
                      <span className="fs-4 fw-bold" style={{ color: '#d97706' }}>{overview.totalOrders}</span>
                    </div>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="p-3 bg-white border border-2 rounded text-center shadow-sm" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('reports')}>
                      <i className="fas fa-flag text-danger fa-2x mb-2"></i>
                      <h6 className="fw-bold m-0 text-dark">Pending Reports</h6>
                      <span className="fs-4 fw-bold text-danger d-block mt-1">{overview.pendingReports}</span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 bg-white border border-2 rounded text-center shadow-sm" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('users')}>
                      <i className="fas fa-user-slash text-warning fa-2x mb-2"></i>
                      <h6 className="fw-bold m-0 text-dark">Account Suspensions</h6>
                      <span className="small fw-semibold text-secondary d-block mt-1">Admin Enforcement</span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 bg-white border border-2 rounded text-center shadow-sm" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('tickets')}>
                      <i className="fas fa-headset text-success fa-2x mb-2"></i>
                      <h6 className="fw-bold m-0 text-dark">Open Tickets</h6>
                      <span className="fs-4 fw-bold text-success d-block mt-1">{overview.openTickets}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: USER MANAGEMENT */}
            {activeTab === 'users' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-dark m-0"><i className="fas fa-users text-success me-1"></i> Registered Platform Users</h6>
                  <input
                    type="text"
                    className="form-control form-control-sm w-auto"
                    placeholder="Filter by name/mobile/role..."
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                  />
                </div>
                {users.length === 0 ? (
                  <div className="text-center py-4 bg-light rounded border"><small className="text-muted">No users registered yet.</small></div>
                ) : (
                  <div className="table-responsive" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    <table className="table table-hover table-bordered align-middle small mb-0">
                      <thead className="table-light sticky-top">
                        <tr>
                          <th>User ID</th>
                          <th>Name</th>
                          <th>Mobile</th>
                          <th>Role</th>
                          <th>Location</th>
                          <th>Status</th>
                          <th className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users
                          .filter(u => !searchFilter || (u.name + u.mobile + u.role + u.location).toLowerCase().includes(searchFilter.toLowerCase()))
                          .map((u, i) => (
                            <tr key={i}>
                              <td className="fw-bold">{u.user_id || `KM-U-${i+1}`}</td>
                              <td className="fw-bold">{u.name}</td>
                              <td>+91 {u.mobile}</td>
                              <td><span className={`badge ${u.role === 'admin' ? 'bg-danger' : (u.role === 'seller' ? 'bg-success' : 'bg-primary')}`}>{u.role}</span></td>
                              <td>{u.location || 'Local Mandi'}</td>
                              <td><span className={`badge ${u.account_status === 'suspended' ? 'bg-danger' : 'bg-success'}`}>{u.account_status || 'active'}</span></td>
                              <td className="text-center">
                                {u.role !== 'admin' && (
                                  <button
                                    className={`btn btn-xs ${u.account_status === 'suspended' ? 'btn-success' : 'btn-outline-danger'} fw-bold px-2 py-0`}
                                    onClick={() => handleUserToggleStatus(u.mobile, u.account_status === 'suspended')}
                                  >
                                    {u.account_status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CROP LISTINGS MODERATION */}
            {activeTab === 'listings' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-dark m-0"><i className="fas fa-boxes-stacked text-success me-1"></i> Marketplace Crop Listings</h6>
                  <input
                    type="text"
                    className="form-control form-control-sm w-auto"
                    placeholder="Search crop / seller..."
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                  />
                </div>
                {listings.length === 0 ? (
                  <div className="text-center py-4 bg-light rounded border"><small className="text-muted">No crop listings found.</small></div>
                ) : (
                  <div className="table-responsive" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    <table className="table table-hover table-bordered align-middle small mb-0">
                      <thead className="table-light sticky-top">
                        <tr>
                          <th>ID</th>
                          <th>Crop Name</th>
                          <th>Weight</th>
                          <th>Rate</th>
                          <th>Seller</th>
                          <th>Location</th>
                          <th>Status</th>
                          <th className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {listings
                          .filter(c => !searchFilter || (c.name + c.seller + c.loc).toLowerCase().includes(searchFilter.toLowerCase()))
                          .map((c, i) => (
                            <tr key={i} className={c.is_removed ? 'table-secondary opacity-75' : ''}>
                              <td className="fw-bold">#{c.id}</td>
                              <td className="fw-bold text-success">{c.name}</td>
                              <td>{c.weight} quintals</td>
                              <td className="fw-bold">₹{c.rate}/q</td>
                              <td>{c.seller} (+91 {c.seller_mobile})</td>
                              <td>{c.loc || 'Local Mandi'}</td>
                              <td><span className={`badge ${c.is_removed ? 'bg-danger' : (c.status === 'sold' ? 'bg-info' : 'bg-success')}`}>{c.is_removed ? 'Removed' : (c.status || 'Active')}</span></td>
                              <td className="text-center">
                                <button
                                  className={`btn btn-xs ${c.is_removed ? 'btn-success' : 'btn-outline-danger'} fw-bold px-2 py-0`}
                                  onClick={() => handleListingToggleRemove(c.id, c.is_removed)}
                                >
                                  {c.is_removed ? 'Restore' : 'Delete'}
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: ORDERS OVERRIDE */}
            {activeTab === 'orders' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-dark m-0"><i className="fas fa-truck text-success me-1"></i> System Orders & Logistics</h6>
                  <input
                    type="text"
                    className="form-control form-control-sm w-auto"
                    placeholder="Search crop / buyer / seller..."
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                  />
                </div>
                {orders.length === 0 ? (
                  <div className="text-center py-4 bg-light rounded border"><small className="text-muted">No orders found.</small></div>
                ) : (
                  <div className="table-responsive" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    <table className="table table-hover table-bordered align-middle small mb-0">
                      <thead className="table-light sticky-top">
                        <tr>
                          <th>Order ID</th>
                          <th>Crop</th>
                          <th>Buyer</th>
                          <th>Seller</th>
                          <th>Quantity</th>
                          <th>Total Value</th>
                          <th>Status</th>
                          <th className="text-center">Status Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders
                          .filter(o => !searchFilter || (o.crop_name + o.buyer_name + o.seller_name).toLowerCase().includes(searchFilter.toLowerCase()))
                          .map((o, i) => (
                            <tr key={i}>
                              <td className="fw-bold">ORD-#{o.id}</td>
                              <td className="fw-bold text-dark">{o.crop_name}</td>
                              <td>{o.buyer_name} (+91 {o.buyer_mobile})</td>
                              <td>{o.seller_name} (+91 {o.seller_mobile})</td>
                              <td>{o.quantity}q</td>
                              <td className="fw-bold text-success">₹{(parseFloat(o.final_price || 0) * parseFloat(o.quantity || 1)).toLocaleString('en-IN')}</td>
                              <td><span className="badge bg-success">{o.status}</span></td>
                              <td className="text-center">
                                <select
                                  className="form-select form-select-sm d-inline-block w-auto py-0 text-xs"
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
                )}
              </div>
            )}

            {/* TAB 3: MODERATION TOOLS */}
            {activeTab === 'moderation' && (
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="p-3 bg-white border rounded shadow-sm">
                    <h6 className="fw-bold text-danger mb-2"><i className="fas fa-user-slash me-1"></i> Suspend User Account</h6>
                    <small className="text-muted d-block mb-3">Forces user logout and blocks marketplace access.</small>
                    <div className="d-flex gap-2">
                      <input 
                        type="text" 
                        className="form-control form-control-sm"
                        placeholder="Enter 10-digit Mobile Number..."
                        value={suspendMobileInput}
                        onChange={e => setSuspendMobileInput(e.target.value)}
                      />
                      <button className="btn btn-sm btn-danger fw-bold text-nowrap" onClick={() => handleSuspendUser(suspendMobileInput)}>
                        Suspend Account
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 bg-white border rounded shadow-sm">
                    <h6 className="fw-bold text-danger mb-2"><i className="fas fa-trash me-1"></i> Remove Crop Listing</h6>
                    <small className="text-muted d-block mb-3">Hides fraudulent crop listing from live feed.</small>
                    <div className="d-flex gap-2">
                      <input 
                        type="text" 
                        className="form-control form-control-sm"
                        placeholder="Enter Crop Listing ID..."
                        value={removeListingIdInput}
                        onChange={e => setRemoveListingIdInput(e.target.value)}
                      />
                      <button className="btn btn-sm btn-danger fw-bold text-nowrap" onClick={() => handleRemoveListing(removeListingIdInput)}>
                        Remove Listing
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SUPPORT QUEUE */}
            {activeTab === 'tickets' && (
              <div>
                <h6 className="fw-bold text-dark mb-3"><i className="fas fa-headset text-success me-1"></i> Platform Support Tickets Queue</h6>
                {tickets.length === 0 ? (
                  <div className="text-center py-4 bg-light rounded border">
                    <small className="text-muted">No support tickets submitted.</small>
                  </div>
                ) : selectedTicket ? (
                  <div>
                    <button className="btn btn-sm btn-link p-0 text-success fw-bold mb-2" onClick={() => setSelectedTicket(null)}>
                      ← Back to All Tickets
                    </button>
                    <div className="p-3 bg-light rounded border mb-3">
                      <div className="fw-bold text-dark">{selectedTicket.subject}</div>
                      <small className="text-muted">From: {selectedTicket.user_name} (+91 {selectedTicket.user_mobile})</small>
                      <p className="small text-dark mt-2 mb-0">{selectedTicket.description}</p>
                    </div>

                    <div className="d-flex flex-column gap-2 mb-3">
                      {(selectedTicket.replies || []).map((r, idx) => (
                        <div key={idx} className={`p-2 rounded border small ${r.is_admin ? 'bg-success bg-opacity-10 border-success' : 'bg-light'}`}>
                          <strong>{r.sender_name}:</strong> {r.message}
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleAdminTicketReply} className="d-flex gap-2">
                      <input 
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Write admin reply..."
                        value={adminReplyMsg}
                        onChange={e => setAdminReplyMsg(e.target.value)}
                        required
                      />
                      <button type="submit" className="btn btn-sm btn-success fw-bold px-3">Post Reply</button>
                    </form>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {tickets.map((t) => (
                      <div key={t.id} className="p-3 bg-white border rounded shadow-sm d-flex justify-content-between align-items-center" style={{ cursor: 'pointer' }} onClick={() => setSelectedTicket(t)}>
                        <div>
                          <div className="fw-bold text-dark">{t.subject}</div>
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
      </>
    )}

        <div className="d-flex justify-content-end pt-3 border-top mt-4">
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Close Dashboard</button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardModal;

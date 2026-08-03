import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import socket from '../socket';
import SkeletonCard from '../components/SkeletonCard';
import AdminNavbar from '../components/admin/AdminNavbar';
import AdminMetricsRibbon from '../components/admin/AdminMetricsRibbon';
import AdminOverviewPanel from '../components/admin/AdminOverviewPanel';
import AdminUserTable from '../components/admin/AdminUserTable';
import '../assets/global.css';
import '../assets/dynamic-features.css';
import '../assets/AdminPage.css';

const ADMIN_SECRET_KEY = 'KishanAdmin@2026';
const ADMIN_SESSION_TOKEN = 'KM_ADMIN_AUTHORIZED_TOKEN_2026';

const AdminPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState({ activeUsers: 0, activeCrops: 0, totalOrders: 0, totalGmv: 0, pendingReports: 0, openDisputes: 0, openTickets: 0 });
  
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reports, setReports] = useState([]);
  const [tickets, setTickets] = useState([]);
  
  const [searchFilter, setSearchFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getAdminHeaders = () => ({
    'Content-Type': 'application/json',
    'x-admin-key': ADMIN_SECRET_KEY,
    'x-admin-token': ADMIN_SESSION_TOKEN,
    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
  });

  useEffect(() => {
    fetchAdminData();

    if (!socket.connected) {
      socket.connect();
    }

    const handleRealtimeUpdate = () => {
      fetchAdminData();
    };

    socket.on('order_created', handleRealtimeUpdate);
    socket.on('crop_added', handleRealtimeUpdate);
    socket.on('user_registered', handleRealtimeUpdate);
    socket.on('report_submitted', handleRealtimeUpdate);
    socket.on('ticket_submitted', handleRealtimeUpdate);
    socket.on('crop_price_updated', handleRealtimeUpdate);

    return () => {
      socket.off('order_created', handleRealtimeUpdate);
      socket.off('crop_added', handleRealtimeUpdate);
      socket.off('user_registered', handleRealtimeUpdate);
      socket.off('report_submitted', handleRealtimeUpdate);
      socket.off('ticket_submitted', handleRealtimeUpdate);
      socket.off('crop_price_updated', handleRealtimeUpdate);
    };
  }, [activeTab]);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
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
    <div className="admin-page-root">
      <AdminNavbar onLogout={handleLogout} />

      <div className="container mt-4">
        <AdminMetricsRibbon overview={overview} />

        <div className="admin-tab-bar mb-4">
          <button className={`admin-nav-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            📊 Overview & Metrics
          </button>
          <button className={`admin-nav-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            👥 Registered Users ({overview.activeUsers})
          </button>
          <button className={`admin-nav-tab ${activeTab === 'listings' ? 'active' : ''}`} onClick={() => setActiveTab('listings')}>
            🌾 Crop Listings ({overview.activeCrops})
          </button>
        </div>

        <div className="admin-content-panel">
          {isLoading ? (
            <div className="row g-3 py-3">
              <div className="col-md-4"><SkeletonCard /></div>
              <div className="col-md-4"><SkeletonCard /></div>
              <div className="col-md-4"><SkeletonCard /></div>
            </div>
          ) : (
            <div>
              {activeTab === 'overview' && <AdminOverviewPanel overview={overview} />}
              {activeTab === 'users' && <AdminUserTable users={users} searchFilter={searchFilter} setSearchFilter={setSearchFilter} handleUserToggleStatus={handleUserToggleStatus} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;

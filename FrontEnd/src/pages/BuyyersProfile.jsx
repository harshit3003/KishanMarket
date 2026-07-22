import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Chart from 'chart.js/auto';
import toast from 'react-hot-toast';
import '../assets/global.css';
import '../assets/dynamic-features.css';
import '../assets/buyer-profile-style.css';

const BuyyersProfile = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Initialize state directly from localStorage to avoid setting state in effect
  const [buyerName, setBuyerName] = useState(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.name;
      } catch (e) {
        return 'Guest';
      }
    }
    return 'Guest';
  });
  
  const spendChartRef = useRef(null);
  const categoryChartRef = useRef(null);
  const spendChartInstance = useRef(null);
  const categoryChartInstance = useRef(null);

  const [purchases, setPurchases] = useState([]);
  const [marketData, setMarketData] = useState([]);
  const [activeRequestsCount, setActiveRequestsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [currentMobile, setCurrentMobile] = useState(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.mobile || 'guest';
      } catch (e) {}
    }
    return 'guest';
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [purchasesRes, marketRes, reqsRes] = await Promise.all([
          fetch(`/api/purchases?mobile=${currentMobile}`),
          fetch('/api/market-intel?limit=5'),
          fetch(`/api/buyer-requests?mobile=${currentMobile}`)
        ]);
        
        if (purchasesRes.ok) {
          const pData = await purchasesRes.json();
          setPurchases(pData);
        }
        
        if (marketRes.ok) {
          const mData = await marketRes.json();
          setMarketData(mData);
        }

        if (reqsRes.ok) {
          const rData = await reqsRes.json();
          setActiveRequestsCount(rData.length);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [currentMobile]);

  const cleanNumber = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const num = parseFloat(val.toString().replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const formatCurrency = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  // Calculate real totals based on SQLite Crops data
  const totalSpent = purchases.reduce((acc, p) => acc + (cleanNumber(p.rate) * cleanNumber(p.weight)), 0);
  const priceDrops = marketData.filter(d => d.tr === 'down').length;

  useEffect(() => {
    if (activeTab === 'dashboard' && !isLoading) {
      if (spendChartInstance.current) spendChartInstance.current.destroy();
      if (categoryChartInstance.current) categoryChartInstance.current.destroy();

      if (spendChartRef.current) {
        // Build dynamic line chart data from actual purchases
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlySums = {};

        purchases.forEach(p => {
          if (p.soldDate) {
            const dateObj = new Date(p.soldDate);
            if (!isNaN(dateObj.getTime())) {
              const mName = monthNames[dateObj.getMonth()];
              const cost = cleanNumber(p.rate) * cleanNumber(p.weight);
              monthlySums[mName] = (monthlySums[mName] || 0) + cost;
            }
          }
        });

        let chartLabels = Object.keys(monthlySums);
        let chartData = Object.values(monthlySums);

        if (chartLabels.length === 0) {
          chartLabels = ['Jan', 'Feb', 'Mar', 'Apr'];
          if (totalSpent > 0) {
            chartData = [Math.round(totalSpent * 0.15), Math.round(totalSpent * 0.35), Math.round(totalSpent * 0.6), totalSpent];
          } else {
            chartData = [0, 0, 0, 0];
          }
        }

        spendChartInstance.current = new Chart(spendChartRef.current, {
          type: 'line',
          data: {
            labels: chartLabels,
            datasets: [{
              label: 'Total Paid (₹)',
              data: chartData,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              fill: true, tension: 0.4
            }]
          },
          options: { responsive: true, maintainAspectRatio: false }
        });
      }

      if (categoryChartRef.current) {
        // Build dynamic category distribution from purchases
        const cropCounts = {};
        purchases.forEach(p => {
          const name = p.name || 'Crop';
          cropCounts[name] = (cropCounts[name] || 0) + (cleanNumber(p.weight) || 1);
        });

        let catLabels = Object.keys(cropCounts);
        let catData = Object.values(cropCounts);

        if (catLabels.length === 0) {
          catLabels = ['Grains', 'Pulses', 'Vegetables'];
          catData = [50, 30, 20];
        }

        const colors = ['#10b981', '#059669', '#047857', '#34d399', '#6ee7b7'];

        categoryChartInstance.current = new Chart(categoryChartRef.current, {
          type: 'doughnut',
          data: {
            labels: catLabels,
            datasets: [{
              data: catData,
              backgroundColor: colors.slice(0, catLabels.length),
              borderWidth: 0
            }]
          },
          options: { cutout: '75%', responsive: true, maintainAspectRatio: false }
        });
      }
    }
  }, [activeTab, isLoading, purchases, totalSpent]);

  const handleExportCSV = () => {
    let csv = [];
    const table = document.getElementById('buyerProcurementTable');
    if (!table) return;
    const rows = table.querySelectorAll("tr");
    for (const row of rows) {
      const cols = row.querySelectorAll("td, th");
      csv.push(Array.from(cols).map(c => `"${c.innerText}"`).join(","));
    }
    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `KishanBuyer_Report_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  const handleSaveProfile = () => {
    const users = JSON.parse(localStorage.getItem('kishanUsers')) || [];
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
      currentUser.name = buyerName;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      localStorage.setItem('displayUserName', buyerName);
      
      const userIndex = users.findIndex(u => u.mobile === currentUser.mobile);
      if (userIndex !== -1) {
        users[userIndex].name = buyerName;
        localStorage.setItem('kishanUsers', JSON.stringify(users));
      }
      toast.success('Profile saved successfully!');
    }
  };

  const [buyerUserId, setBuyerUserId] = useState(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        return u.user_id || 'KM-B-1002';
      } catch (e) {}
    }
    return 'KM-B-1002';
  });

  return (
    <>
      
      <div id="app-wrapper">
        <aside id="sidebar" className={isSidebarOpen ? 'active' : ''}>
          <div className="sidebar-brand">
            <i className="fas fa-shopping-basket me-2"></i>Kishan<span>Buyer</span>
          </div>
          <nav className="sidebar-nav">
            <a href="#" className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); setIsSidebarOpen(false); }}>
              <i className="fas fa-chart-pie"></i> Dashboard
            </a>
            <a href="#" className={`nav-link ${activeTab === 'orders' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('orders'); setIsSidebarOpen(false); }}>
              <i className="fas fa-truck-loading"></i> Inventory
            </a>
            <a href="#" className={`nav-link ${activeTab === 'market' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('market'); setIsSidebarOpen(false); }}>
              <i className="fas fa-chart-line"></i> Market Intel
            </a>
            <a href="#" className={`nav-link ${activeTab === 'expert' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('expert'); setIsSidebarOpen(false); }}>
              <i className="fas fa-user-graduate"></i> Expert Guide
            </a>
            <a href="#" className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('settings'); setIsSidebarOpen(false); }}>
              <i className="fas fa-user-gear"></i> Settings
            </a>
          </nav>
        </aside>

        <main id="main-content">
          <header className="top-header shadow-sm">
            <div className="d-flex align-items-center gap-3">
              <button className="btn btn-light d-lg-none" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                <i className="fas fa-bars"></i>
              </button>
              <h1 className="h5 mb-0 fw-bold text-success">Buyer Suite ({buyerName} &bull; ID: {buyerUserId})</h1>
              <div className="notif-bell position-relative ms-3">
                <i className="fas fa-bell fs-5 text-muted"></i>
                {priceDrops > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {priceDrops}
                  </span>
                )}
              </div>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-success btn-sm" onClick={handleExportCSV}>
                <i className="fas fa-file-csv me-1"></i> Export Data
              </button>
              <Link to="/buyer" className="btn-back">Exit</Link>
            </div>
          </header>

          <div className="content-body">
            {activeTab === 'dashboard' && (
              <section className="profile-tab">
                <div className="premium-glass-card mb-4 advisory-card">
                  <h5 className="fw-bold text-success"><i className="fas fa-lightbulb me-2"></i>Buying Intelligence</h5>
                  <p className="m-0 text-muted">Buying Alert: Rice prices stable for next week.</p>
                </div>

                <div className="stats-grid mb-4">
                  {isLoading ? (
                    <div className="text-center w-100 py-4"><i className="fas fa-spinner fa-spin fa-2x text-success"></i><p>Loading API Data...</p></div>
                  ) : (
                    <>
                      <div className="stat-card">
                        <h6>Total Spent</h6>
                        <h3 className="text-truncate"><span>{formatCurrency(totalSpent)}</span></h3>
                      </div>
                      <div className="stat-card border-profit">
                        <h6>Total Orders</h6>
                        <h3>{purchases.length}</h3>
                      </div>
                      <div className="stat-card">
                        <h6>Active Bids</h6>
                        <h3>{activeRequestsCount}</h3>
                      </div>
                      <div className="stat-card">
                        <h6>Trust Score</h6>
                        <h3>9.8/10</h3>
                      </div>
                    </>
                  )}
                </div>

                <div className="chart-grid">
                  <div className="chart-card premium-glass-card">
                    <h6 className="fw-bold mb-3">Spending Breakdown</h6>
                    <div className="chart-container"><canvas ref={spendChartRef}></canvas></div>
                  </div>
                  <div className="chart-card premium-glass-card">
                    <h6 className="fw-bold mb-3">Item Categories</h6>
                    <div className="chart-container"><canvas ref={categoryChartRef}></canvas></div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'orders' && (
              <section className="profile-tab">
                <div className="premium-glass-card">
                  <h4 className="fw-bold mb-4">Inventory</h4>
                  <div className="table-responsive">
                    <table className="table align-middle" id="buyerProcurementTable">
                      <thead className="table-light">
                        <tr>
                          <th>Date</th>
                          <th>Seller</th>
                          <th>Crop</th>
                          <th>Weight</th>
                          <th>Total Paid</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr><td colSpan="6" className="text-center py-4"><i className="fas fa-spinner fa-spin text-success"></i> Loading...</td></tr>
                        ) : purchases.length === 0 ? (
                          <tr><td colSpan="6" className="text-center py-4 text-muted">No orders found.</td></tr>
                        ) : (
                          purchases.map((o, idx) => {
                            const rateNum = cleanNumber(o.rate);
                            const weightNum = cleanNumber(o.weight);
                            const totalPaid = rateNum * weightNum;
                            const weightStr = weightNum > 0 ? `${weightNum}q` : 'N/A';
                            const statusLabel = o.status === 'sold' ? 'Delivered' : (o.status || 'Pending');
                            return (
                              <tr key={idx}>
                                <td>{o.soldDate ? new Date(o.soldDate).toLocaleDateString() : 'Unknown'}</td>
                                <td className="fw-bold">{o.seller}</td>
                                <td><span className="badge bg-light text-dark border">{o.name}</span></td>
                                <td>{weightStr}</td>
                                <td className="fw-bold text-success">{formatCurrency(totalPaid)}</td>
                                <td>
                                  <span className={`badge ${statusLabel === 'Delivered' ? 'bg-success' : 'bg-warning'} rounded-pill`}>
                                    {statusLabel}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'market' && (
              <section className="profile-tab">
                <div className="premium-glass-card">
                  <h4 className="fw-bold mb-4">Mandi Price Comparison</h4>
                  <div className="row g-4">
                    {marketData.map((d, idx) => (
                      <div className="col-md-6" key={idx}>
                        <div className="stat-card" style={{ background: 'white', border: '1px solid var(--border)' }}>
                          <h6>{d.n} Intel</h6>
                          <div className="d-flex justify-content-between mt-2">
                            <div><small>Market Price</small><h4 className="text-success fw-bold">{d.p}</h4></div>
                            <div className="text-end border-start ps-3"><small>Avg Mandi</small><h4 className="fw-bold">{d.mandi}</h4></div>
                          </div>
                          <div className={`mt-3 text-start small fw-bold ${d.tr === 'down' ? 'text-danger' : 'text-success'}`}>
                            <i className={`fas fa-arrow-${d.tr === 'down' ? 'down' : 'up'} me-1`}></i>
                            {d.tr === 'down' ? 'Opportunity: Rate gir rahe hain' : 'Rates are steady'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'expert' && (
              <section className="profile-tab">
                <div className="premium-glass-card">
                  <h4 className="fw-bold mb-3">Expert Buying Guide</h4>
                  <div className="alert alert-success">Market Alert: Best time to procure Rice for wholesale.</div>
                  <button className="btn btn-success"><i className="fas fa-comments me-2"></i>Ask Advisor</button>
                </div>
              </section>
            )}

            {activeTab === 'settings' && (
              <section className="profile-tab">
                <div className="premium-glass-card">
                  <h4 className="fw-bold mb-4">Profile Settings</h4>
                  <div className="col-md-6 mb-3">
                    <label>Buyer Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={buyerName} 
                      onChange={(e) => setBuyerName(e.target.value)} 
                    />
                  </div>
                  <button className="btn btn-success" onClick={handleSaveProfile}>Save Profile</button>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default BuyyersProfile;

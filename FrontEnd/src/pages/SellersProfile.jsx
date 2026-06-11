import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Chart from 'chart.js/auto';
import toast from 'react-hot-toast';
import BackgroundLayer from '../components/BackgroundLayer';
import '../assets/global.css';
import '../assets/seller-profile-style.css';

const SellersProfile = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [salesData, setSalesData] = useState([]);
  const [marketData, setMarketData] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [inventory, setInventory] = useState([]);
  
  const [sellerName, setSellerName] = useState(() => {
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

  const profitChartRef = useRef(null);
  const trendsChartRef = useRef(null);
  const profitChartInstance = useRef(null);
  const trendsChartInstance = useRef(null);

  useEffect(() => {
    // Load local inventory
    const storedInventory = JSON.parse(localStorage.getItem('myCrops')) || [];
    setInventory(storedInventory);

    // Fetch API Data
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [salesRes, marketRes, predictionsRes] = await Promise.all([
          fetch('/api/seller-sales.json'),
          fetch('/api/seller-market-intel.json'),
          fetch('/api/seller-predictions.json')
        ]);
        
        if (salesRes.ok) setSalesData(await salesRes.json());
        if (marketRes.ok) setMarketData(await marketRes.json());
        if (predictionsRes.ok) setPredictions(await predictionsRes.json());
      } catch (error) {
        console.error("Error fetching seller data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard' && !isLoading) {
      if (profitChartInstance.current) profitChartInstance.current.destroy();
      if (trendsChartInstance.current) trendsChartInstance.current.destroy();

      if (profitChartRef.current) {
        profitChartInstance.current = new Chart(profitChartRef.current, {
          type: 'line',
          data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
              label: 'Earnings (₹)',
              data: [15000, 22000, 18000, 31000, 25000, 38000],
              borderColor: '#2d6a4f',
              backgroundColor: 'rgba(45, 106, 79, 0.05)',
              fill: true,
              tension: 0.4
            }]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
      }

      if (trendsChartRef.current) {
        trendsChartInstance.current = new Chart(trendsChartRef.current, {
          type: 'doughnut',
          data: {
            labels: ['Gehu', 'Dhan', 'Makka'],
            datasets: [{
              data: [50, 30, 20],
              backgroundColor: ['#1b4332', '#f59e0b', '#d4c1a5'],
              borderWidth: 0,
              hoverOffset: 15
            }]
          },
          options: {
            responsive: true, maintainAspectRatio: false, cutout: '70%',
            plugins: { legend: { position: 'top', labels: { usePointStyle: true, padding: 20 } } }
          }
        });
      }
    }
  }, [activeTab, isLoading]);

  const handleDeleteCrop = (index) => {
    if (window.confirm("Are you sure you want to delete this crop?")) {
      const updated = [...inventory];
      updated.splice(index, 1);
      setInventory(updated);
      localStorage.setItem('myCrops', JSON.stringify(updated));
      toast.success("Crop deleted from inventory.");
    }
  };

  const handleSaveProfile = () => {
    const users = JSON.parse(localStorage.getItem('kishanUsers')) || [];
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
      currentUser.name = sellerName;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      localStorage.setItem('displayUserName', sellerName);
      
      const userIndex = users.findIndex(u => u.mobile === currentUser.mobile);
      if (userIndex !== -1) {
        users[userIndex].name = sellerName;
        localStorage.setItem('kishanUsers', JSON.stringify(users));
      }
      toast.success('Profile saved successfully!');
    }
  };

  const totalProfit = inventory.reduce((acc, c) => acc + (parseInt(c.rate || 0) * parseInt(c.weight || 0)), 0);

  return (
    <>
      <BackgroundLayer />

      <div id="app-wrapper">
        <aside id="sidebar" className={isSidebarOpen ? 'active' : ''}>
          <div className="sidebar-brand">
            <i className="fas fa-seedling me-2"></i>Kishan<span>Market</span>
          </div>
          <nav className="sidebar-nav">
            <a href="#" className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); setIsSidebarOpen(false); }}>
              <i className="fas fa-chart-line"></i> Dashboard
            </a>
            <a href="#" className={`nav-link ${activeTab === 'inventory' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('inventory'); setIsSidebarOpen(false); }}>
              <i className="fas fa-boxes-stacked"></i> Inventory (CRUD)
            </a>
            <a href="#" className={`nav-link ${activeTab === 'market' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('market'); setIsSidebarOpen(false); }}>
              <i className="fas fa-chart-pie"></i> Market Intel
            </a>
            <a href="#" className={`nav-link ${activeTab === 'sales' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('sales'); setIsSidebarOpen(false); }}>
              <i className="fas fa-receipt"></i> Sales History
            </a>
            <a href="#" className={`nav-link ${activeTab === 'payments' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('payments'); setIsSidebarOpen(false); }}>
              <i className="fas fa-wallet"></i> Payments & KYC
            </a>
            <a href="#" className={`nav-link ${activeTab === 'expert' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('expert'); setIsSidebarOpen(false); }}>
              <i className="fas fa-user-graduate"></i> Expert Advice
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
              <h1 className="h5 mb-0 fw-bold text-success">Seller Suite</h1>
            </div>
            <Link to="/seller" className="btn-back"><i className="fas fa-arrow-left me-2"></i>Exit Analytics</Link>
          </header>

          <div className="content-body">
            {activeTab === 'dashboard' && (
              <section className="profile-tab">
                <div className="premium-glass-card mb-4 advisory-card">
                  <div className="row align-items-center">
                    <div className="col-md-8">
                      <h5 className="fw-bold text-success"><i className="fas fa-cloud-sun-rain me-2"></i>Weather Advisory</h5>
                      <p className="m-0 text-muted">Mausam saaf hai, katai shuru karein.</p>
                    </div>
                    <div className="col-md-4 text-end">
                      <h2 className="fw-bold mb-0">32°C</h2>
                      <small>Partly Cloudy, Punjab</small>
                    </div>
                  </div>
                </div>

                <div className="stats-grid mb-4">
                  {isLoading ? (
                    <div className="text-center w-100 py-4"><i className="fas fa-spinner fa-spin fa-2x text-success"></i><p>Loading API Data...</p></div>
                  ) : (
                    <>
                      <div className="stat-card">
                        <h6>Listed Crops</h6>
                        <h3>{inventory.length}</h3>
                      </div>
                      <div className="stat-card border-profit">
                        <h6>Total Profit</h6>
                        <h3>₹<span>{totalProfit.toLocaleString('en-IN')}</span></h3>
                      </div>
                      <div className="stat-card">
                        <h6>Orders Pending</h6>
                        <h3>{salesData.filter(s => s.status === 'Pending').length}</h3>
                      </div>
                      <div className="stat-card">
                        <h6>KYC Status</h6>
                        <h3>Verified</h3>
                      </div>
                    </>
                  )}
                </div>

                <div className="premium-glass-card mb-4">
                  <h5 className="fw-bold mb-3 text-success"><i className="fas fa-brain me-2"></i>Price Prediction (Next 7 Days)</h5>
                  <div className="row g-3">
                    {isLoading ? <p>Loading Predictions...</p> : predictions.map((p, idx) => (
                      <div className="col-md-4" key={idx}>
                        <div className="prediction-box p-3 border rounded shadow-sm bg-white">
                          <span className="fw-bold">{p.crop}:</span> <span className={p.trend === 'up' ? 'text-success' : 'text-danger'}>{p.value} {p.trend === 'up' ? 'Up' : 'Down'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="chart-grid">
                  <div className="chart-card premium-glass-card">
                    <h6 className="fw-bold mb-3">Profit Trends</h6>
                    <div className="chart-container"><canvas ref={profitChartRef}></canvas></div>
                  </div>
                  <div className="chart-card premium-glass-card">
                    <h6 className="fw-bold mb-3">Crop Distribution</h6>
                    <div className="chart-container"><canvas ref={trendsChartRef}></canvas></div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'inventory' && (
              <section className="profile-tab">
                <div className="premium-glass-card">
                  <h4 className="fw-bold mb-4">Manage My Crops</h4>
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Crop</th>
                          <th>Weight</th>
                          <th>Rate</th>
                          <th>Total Value</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventory.length === 0 ? (
                          <tr><td colSpan="5" className="text-center py-4">No Inventory Found. Add crops from the Seller Dashboard.</td></tr>
                        ) : inventory.map((c, idx) => (
                          <tr key={idx}>
                            <td className="fw-bold">{c.name}</td>
                            <td>{c.weight}q</td>
                            <td>₹{c.rate}</td>
                            <td className="text-success fw-bold">₹{(c.rate * c.weight).toLocaleString('en-IN')}</td>
                            <td><button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteCrop(idx)}><i className="fas fa-trash"></i></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'market' && (
              <section className="profile-tab">
                <div className="premium-glass-card">
                  <h4 className="fw-bold mb-4 text-success"><i className="fas fa-chart-pie me-2"></i>Market Intelligence</h4>
                  <div className="row g-4">
                    {isLoading ? <div className="text-center w-100 py-4"><i className="fas fa-spinner fa-spin fa-2x text-success"></i></div> : marketData.map((d, idx) => (
                      <div className="col-md-4" key={idx}>
                        <div className="prediction-box p-3 border rounded shadow-sm bg-white">
                          <h6 className="text-muted small">{d.name} Comparison</h6>
                          <div className="d-flex justify-content-around mt-2">
                            <div><small>Your Rate</small><div className="fw-bold">₹{d.my}</div></div>
                            <div className="border-start ps-2"><small>Mandi</small><div className="fw-bold text-success">₹{d.mandi}</div></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'sales' && (
              <section className="profile-tab">
                <div className="premium-glass-card">
                  <h4 className="fw-bold mb-4">Sales Report</h4>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Date</th>
                          <th>Buyer</th>
                          <th>Crop</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr><td colSpan="5" className="text-center py-4"><i className="fas fa-spinner fa-spin text-success"></i> Loading...</td></tr>
                        ) : salesData.map((s, idx) => (
                          <tr key={idx}>
                            <td>{s.date}</td><td>{s.buyer}</td><td>{s.crop}</td>
                            <td className="fw-bold text-success">{s.amount}</td>
                            <td><span className={`badge ${s.status === 'Success' ? 'bg-success' : 'bg-warning'} rounded-pill`}>{s.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'payments' && (
              <section className="profile-tab">
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="premium-glass-card">
                      <h5 className="fw-bold mb-3">Bank Details</h5>
                      <input type="text" className="form-control mb-3" placeholder="A/C Number" />
                      <button className="btn btn-success w-100">Update Bank Info</button>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="premium-glass-card">
                      <h5 className="fw-bold mb-3">UPI ID</h5>
                      <input type="text" className="form-control mb-3" placeholder="user@upi" />
                      <button className="btn btn-outline-success w-100">Link UPI</button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'expert' && (
              <section className="profile-tab">
                <div className="premium-glass-card">
                  <h4 className="fw-bold mb-3">Expert Advice (Kishan Salah)</h4>
                  <div className="alert alert-success">Tip: Use organic fertilizers for better yield this season.</div>
                  <button className="btn btn-success"><i className="fas fa-comment me-2"></i>Chat with Expert</button>
                </div>
              </section>
            )}

            {activeTab === 'settings' && (
              <section className="profile-tab">
                <div className="premium-glass-card">
                  <h4 className="fw-bold mb-4">Update Profile</h4>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Full Name</label>
                    <input type="text" className="form-control" value={sellerName} onChange={(e) => setSellerName(e.target.value)} />
                  </div>
                  <button className="btn btn-success px-4" onClick={handleSaveProfile}>Save Changes</button>
                </div>
              </section>
            )}

          </div>
        </main>
      </div>
    </>
  );
};

export default SellersProfile;

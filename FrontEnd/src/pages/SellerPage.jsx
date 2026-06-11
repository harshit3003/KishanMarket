import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import BackgroundLayer from '../components/BackgroundLayer';
import '../assets/global.css';
import '../assets/dynamic-features.css';
import '../assets/seller-style.css';
import BuyersMap from '../components/SellerFeatures/BuyersMap';
import LiveBiddingToasts from '../components/SellerFeatures/LiveBiddingToasts';
import AIAssessor from '../components/SellerFeatures/AIAssessor';
import LogisticsCalculator from '../components/SellerFeatures/LogisticsCalculator';
import ColdStorageFinder from '../components/SellerFeatures/ColdStorageFinder';

import allBuyersData from '../assets/buyers_data.json';

const SellerPage = () => {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({ name: 'Guest', role: 'seller', location: '' });
  const [crops, setCrops] = useState([]);
  const [buyers, setBuyers] = useState(allBuyersData.slice(0, 5));
  
  // Search Form State
  const [searchLocation, setSearchLocation] = useState('');
  const [searchCrop, setSearchCrop] = useState('Gehu');
  const [searchTitle, setSearchTitle] = useState('Top Buyers in Your Area');

  // Upload Form State
  const [cropName, setCropName] = useState('');
  const [cropWeight, setCropWeight] = useState('');
  const [cropRate, setCropRate] = useState('');

  // Live Bids Modal State
  const [isLiveBidsOpen, setIsLiveBidsOpen] = useState(false);
  
  // Card Hover State
  const [hoveredCardIndex, setHoveredCardIndex] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) setCurrentUser(JSON.parse(userStr));

    const savedCrops = JSON.parse(localStorage.getItem('myCrops')) || [];
    setCrops(savedCrops);
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('currentUser');
    localStorage.removeItem('displayUserName');
    navigate('/login');
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleOpenLiveBids = (e) => {
    e.preventDefault();
    setIsLiveBidsOpen(true);
    setIsProfileOpen(false); // Close dropdown
  };

  const handleUploadCrop = (e) => {
    e.preventDefault();
    if (!cropName || !cropWeight || !cropRate) return;

    const dateStr = new Date().toLocaleDateString('en-GB');
    const newCrop = { name: cropName, weight: cropWeight, rate: cropRate, date: dateStr };
    
    const updatedCrops = [newCrop, ...crops];
    setCrops(updatedCrops);
    localStorage.setItem('myCrops', JSON.stringify(updatedCrops));

    setCropName('');
    setCropWeight('');
    setCropRate('');
    toast.success(`${newCrop.name} uploaded successfully!`);
  };

  const handleClearAll = () => {
    if (window.confirm("Clear stock history?")) {
      localStorage.removeItem('myCrops');
      setCrops([]);
      toast.success("Stock history cleared.");
    }
  };

  const handleSearchBuyer = (e) => {
    e.preventDefault();
    const loc = searchLocation.toLowerCase();
    const filtered = allBuyersData.filter(b => 
      b.location.toLowerCase().includes(loc) && b.crops.toLowerCase() === searchCrop.toLowerCase()
    );
    // Limit to 50 results to prevent browser lag from rendering too many 3D cards
    setBuyers(filtered.slice(0, 50));
    setSearchTitle(loc ? `Results in ${searchLocation} for ${searchCrop}` : `Results for ${searchCrop}`);
  };

  return (
    <>
      <BackgroundLayer />

      {/* Fixed Premium Navbar */}
      <nav className="navbar">
        <div className="container d-flex justify-content-between align-items-center">
          <Link className="navbar-brand fw-bold text-decoration-none" to="/seller">
            <i className="fas fa-seedling me-2"></i>Kishan<span>Market</span>
          </Link>

          <div className="profile-container position-relative">
            <i className="fas fa-user-circle fa-2x profile-icon" id="profileIcon" style={{ cursor: 'pointer' }} onClick={toggleProfile}></i>
            <div className="profile-dropdown" id="profileDropdown" style={{ display: isProfileOpen ? 'block' : 'none' }}>
              <div className="dropdown-user-info">
                <h6 className="m-0 fw-bold" id="sellerProfileName">{currentUser.name}</h6>
                <small className="text-muted">Seller ID: KM-2026</small>
              </div>
              <ul className="dropdown-links-list">
                <li><Link to="/profile/seller"><i className="fas fa-user"></i> My Profile</Link></li>
                <li><Link to="/buyer"><i className="fas fa-shopping-basket"></i> Buy Grains</Link></li>
                <li><a href="#live-bids" onClick={handleOpenLiveBids}><i className="fas fa-gavel text-warning"></i> Live Bids <span className="badge bg-danger ms-2 rounded-pill">New</span></a></li>
                <li className="dropdown-divider"></li>
                <li><a href="#" className="logout-item" onClick={handleLogout} style={{ color: '#000000' }}><i className="fas fa-sign-out-alt"></i> Logout</a></li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="container pb-5">
        {/* Live Mandi Rates Ticker */}
        <div className="trending-ticker-container shadow-sm">
          <div className="ticker-header">
            <div className="live-dot"></div>
            <span>LIVE MANDI RATES</span>
          </div>
          <div className="ticker-content">
            <div className="rate-item">
              <span className="crop-name">Gehu</span>
              <span className="crop-price">₹2,450/q</span>
              <span className="price-up"><i className="fas fa-caret-up"></i> +₹50</span>
            </div>
            <div className="rate-item">
              <span className="crop-name">Dhan</span>
              <span className="crop-price">₹2,100/q</span>
              <span className="price-down"><i className="fas fa-caret-down"></i> -₹20</span>
            </div>
            <div className="rate-item">
              <span className="crop-name">Makka</span>
              <span className="crop-price">₹1,850/q</span>
              <span className="price-up"><i className="fas fa-caret-up"></i> +₹15</span>
            </div>
          </div>
        </div>

        {/* Local Weather & Farming Widget */}
        <div className="row mb-4 mt-4">
          <div className="col-12">
            <div className="weather-card">
              <div className="weather-info">
                <h3>28°C</h3>
                <p>{currentUser.location || 'Karnal, Haryana'}</p>
                <div className="weather-details">
                  <span><i className="fas fa-tint me-1"></i> Humidity: 45%</span>
                  <span><i className="fas fa-wind me-1"></i> Wind: 12 km/h</span>
                  <span><i className="fas fa-cloud-sun me-1"></i> Forecast: Clear, good for harvesting</span>
                </div>
              </div>
              <div className="weather-icon-container">
                <i className="fas fa-sun"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Khareedar Dhundein Box */}
        <div className="glass-card-premium p-4 mt-4 mb-4" style={{ transformStyle: 'preserve-3d' }}>
          <h5 className="section-title" style={{ transform: 'translateZ(30px)' }}><i className="fas fa-search me-2"></i> Find Buyers</h5>
          <form id="searchBuyerForm" className="row g-3" onSubmit={handleSearchBuyer} style={{ transform: 'translateZ(20px)' }}>
            <div className="col-md-5">
              <label className="form-label">Location</label>
              <input type="text" className="form-control custom-input input-premium" placeholder="e.g. Punjab, Delhi" value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)} />
            </div>
            <div className="col-md-5">
              <label className="form-label">Select Crop</label>
              <select className="form-select custom-input input-premium" value={searchCrop} onChange={(e) => setSearchCrop(e.target.value)}>
                <option value="Gehu">Gehu</option>
                <option value="Dhan">Dhan</option>
                <option value="Makka">Makka</option>
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button type="submit" className="btn-accent w-100 btn-premium-hover"><i className="fas fa-search me-2"></i>Search</button>
            </div>
          </form>
        </div>

        {/* AI & Logistics Section */}
        <div className="row g-4 mb-5">
          <div className="col-md-4">
            <AIAssessor />
          </div>
          <div className="col-md-4">
            <LogisticsCalculator />
          </div>
          <div className="col-md-4">
            <ColdStorageFinder />
          </div>
        </div>

        {/* Upload & Inventory Grid */}
        <div className="row g-4 mb-5">
          <div className="col-md-6">
            <div className="glass-card-premium p-4 h-100" style={{ transformStyle: 'preserve-3d' }}>
              <h5 className="section-title" style={{ transform: 'translateZ(30px)' }}><i className="fas fa-upload me-2"></i> Upload Crop Listing</h5>
              <form id="uploadForm" onSubmit={handleUploadCrop} style={{ transform: 'translateZ(20px)' }}>
                <div className="mb-3">
                  <label className="form-label">Crop Name</label>
                  <input type="text" className="form-control custom-input input-premium" placeholder="e.g. Gehu" value={cropName} onChange={(e) => setCropName(e.target.value)} required />
                </div>
                <div className="row">
                  <div className="col-6 mb-4">
                    <label className="form-label">Weight (Quintals)</label>
                    <input type="number" className="form-control custom-input input-premium" placeholder="0" value={cropWeight} onChange={(e) => setCropWeight(e.target.value)} required />
                  </div>
                  <div className="col-6 mb-4">
                    <label className="form-label">Target Rate (₹/q)</label>
                    <input type="number" className="form-control custom-input input-premium" placeholder="₹" value={cropRate} onChange={(e) => setCropRate(e.target.value)} required />
                  </div>
                </div>
                <button type="submit" className="btn-primary-dark w-100 btn-premium-hover">Publish Listing</button>
              </form>
            </div>
          </div>

          <div className="col-md-6">
            <div className="glass-card-premium p-4 h-100" style={{ transformStyle: 'preserve-3d' }}>
              <div className="d-flex justify-content-between align-items-center section-title" style={{ paddingBottom: '9px', marginBottom: '20px', transform: 'translateZ(30px)' }}>
                <h5 className="m-0 p-0 border-0"><i className="fas fa-warehouse me-2"></i> Your Active Listings</h5>
                <button className="btn btn-sm btn-outline-danger btn-premium-hover" title="Clear History" onClick={handleClearAll} style={{ borderRadius: 'var(--radius-md)' }}><i className="fas fa-trash"></i></button>
              </div>
              <div id="cropListContainer" style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '5px', transform: 'translateZ(20px)' }}>
                {crops.length === 0 ? (
                  <p className="text-muted text-center p-3 small">Koi history nahi hai.</p>
                ) : (
                  crops.map((crop, idx) => (
                    <div className="inventory-item shadow-sm" key={idx}>
                      <div className="wheat-bar"></div>
                      <div className="flex-grow-1"><p className="m-0 small"><strong>{crop.weight}q {crop.name}</strong> @ ₹{crop.rate}/q</p></div>
                      <div className="text-end"><span style={{ fontSize: '10px' }} className="text-muted">{crop.date}</span></div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Map */}
        <BuyersMap />

        {/* Buyers Grid */}
        <div className="buyer-header-box d-flex justify-content-between align-items-center mb-4">
          <h4 className="m-0 fw-bold" style={{ color: '#000000' }}>{searchTitle}</h4>
          <span className="badge" style={{ background: 'var(--accent-gold)', color: '#fff', padding: '8px 15px', borderRadius: '50px', fontWeight: '700', letterSpacing: '0.5px' }}>LIVE DEALS</span>
        </div>

        <div className="row g-4" id="buyersGrid">
          {buyers.length === 0 ? (
            <div className="col-12 text-center p-5 text-white"><h5>Khareedar nahi mila.</h5></div>
          ) : (
            buyers.map((buyer, idx) => {
              const isHovered = hoveredCardIndex === idx;
              return (
                <div className="col-md-4" key={idx}>
                  <div 
                    className="glass-card-premium p-4 h-100 d-flex flex-column align-items-center text-center shadow-lg" 
                    style={{ 
                      background: isHovered ? '#2e4a35' : '', 
                      borderRadius: '20px', 
                      color: isHovered ? 'white' : 'inherit',
                      transformStyle: 'preserve-3d', 
                      transition: 'background 0.4s ease, color 0.4s ease'
                    }} 
                    onMouseEnter={() => setHoveredCardIndex(idx)} 
                    onMouseLeave={() => setHoveredCardIndex(null)}
                  >
                    <span style={{ 
                      background: isHovered ? '#5a8264' : 'rgba(82, 183, 136, 0.15)', 
                      color: isHovered ? 'white' : 'var(--primary)',
                      padding: '4px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '12px', 
                      transform: 'translateZ(20px)', transition: 'all 0.4s ease' 
                    }}>{buyer.location}</span>
                    
                    <h3 className={`fw-bold mb-2 text-lowercase ${isHovered ? 'text-white' : 'text-success'}`} style={{ transform: 'translateZ(30px)', transition: 'all 0.4s ease' }}>
                      {buyer.crops}
                    </h3>
                    
                    <p className="mb-1" style={{ fontSize: '0.95rem', color: isHovered ? '#e0ebd5' : 'var(--text-muted)', transform: 'translateZ(20px)', transition: 'all 0.4s ease' }}>
                      Buyer: <strong className={isHovered ? "text-white" : "text-dark"}>{buyer.name}</strong>
                    </p>
                    
                    <p className="mb-2" style={{ fontSize: '0.95rem', color: isHovered ? '#e0ebd5' : 'var(--text-muted)', transform: 'translateZ(20px)', transition: 'all 0.4s ease' }}>
                      Rating: {buyer.rating} ⭐
                    </p>
                    
                    <h4 className={`fw-bold mb-4 mt-2 ${isHovered ? 'text-white' : 'text-success'}`} style={{ transform: 'translateZ(30px)', transition: 'all 0.4s ease' }}>
                      Rate: ₹{buyer.rate}/q
                    </h4>
                    
                    <button className="btn w-100 fw-bold mt-auto btn-premium-hover" style={{ 
                      background: isHovered ? '#f8f9fa' : 'var(--primary)', 
                      color: isHovered ? '#2e4a35' : 'white', 
                      borderRadius: '10px', padding: '12px 0', 
                      boxShadow: isHovered ? '0 4px 6px rgba(0,0,0,0.1)' : 'none', 
                      transform: 'translateZ(30px)', transition: 'all 0.4s ease' 
                    }}>
                      Buy Now / Contact
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
      
      <LiveBiddingToasts isModalOpen={isLiveBidsOpen} onClose={() => setIsLiveBidsOpen(false)} />
    </>
  );
};

export default SellerPage;

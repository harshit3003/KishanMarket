import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import ReviewsList from './ReviewsList';

const ProfileModal = ({ isOpen, onClose, targetUserMobile, currentUser, onProfileUpdated }) => {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'inventory', 'sales', 'intel'

  // Additional data state for Stats & Business History
  const [userCrops, setUserCrops] = useState([]);
  const [userSales, setUserSales] = useState([]);
  const [marketIntel, setMarketIntel] = useState([]);

  const isOwnProfile = !targetUserMobile || (currentUser && (currentUser.mobile === targetUserMobile || currentUser.name === targetUserMobile));

  const [formData, setFormData] = useState({
    name: '',
    business_name: '',
    bio: '',
    address: '',
    state: '',
    district: '',
    pincode: '',
    crops_specialty: '',
    profile_photo: ''
  });

  useEffect(() => {
    if (isOpen) {
      const identifier = targetUserMobile || (currentUser ? currentUser.mobile : '');
      if (identifier) {
        loadProfile(identifier);
        loadBusinessStats(identifier);
      }
    } else {
      setIsEditing(false);
      setActiveTab('overview');
    }
  }, [isOpen, targetUserMobile, currentUser]);

  const loadProfile = async (identifier) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(identifier)}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFormData({
          name: data.name || '',
          business_name: data.business_name || '',
          bio: data.bio || '',
          address: data.address || '',
          state: data.state || '',
          district: data.district || '',
          pincode: data.pincode || '',
          crops_specialty: data.crops_specialty || '',
          profile_photo: data.profile_photo || ''
        });
      } else {
        const local = currentUser || {};
        setProfile(local);
        setFormData({
          name: local.name || '',
          business_name: local.business_name || '',
          bio: local.bio || '',
          address: local.address || '',
          state: local.state || '',
          district: local.district || '',
          pincode: local.pincode || '',
          crops_specialty: local.crops_specialty || '',
          profile_photo: local.profile_photo || ''
        });
      }
    } catch (e) {
      console.error("Failed to load profile:", e);
    }
    setIsLoading(false);
  };

  const loadBusinessStats = async (identifier) => {
    try {
      // 1. Load user crops (Inventory & History)
      const cropsRes = await fetch(`/api/crops/my?mobile=${encodeURIComponent(identifier)}&name=${encodeURIComponent(identifier)}`);
      if (cropsRes.ok) {
        setUserCrops(await cropsRes.json());
      }

      // 2. Load seller sales / orders
      const salesRes = await fetch('/api/seller-sales');
      if (salesRes.ok) {
        setUserSales(await salesRes.json());
      }

      // 3. Load market intel
      const intelRes = await fetch('/api/seller-market-intel');
      if (intelRes.ok) {
        setMarketIntel(await intelRes.json());
      }
    } catch (e) {
      console.error("Error loading business stats:", e);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image file size should be less than 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, profile_photo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentUser || !currentUser.mobile) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: currentUser.mobile,
          ...formData
        })
      });

      if (res.ok) {
        const result = await res.json();
        const updatedUser = result.user;
        setProfile(updatedUser);
        setIsEditing(false);
        toast.success("Profile updated successfully!");

        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
          try {
            const parsed = JSON.parse(userStr);
            const merged = { ...parsed, ...updatedUser };
            localStorage.setItem('currentUser', JSON.stringify(merged));
          } catch (e) {}
        }

        if (onProfileUpdated) {
          onProfileUpdated(updatedUser);
        }
      } else {
        toast.error("Failed to save profile changes.");
      }
    } catch (e) {
      toast.error("Network error saving profile.");
    }
    setIsSaving(false);
  };

  if (!isOpen) return null;

  const isFarmer = profile?.role === 'seller';
  const roleBadge = isFarmer ? 'bg-success' : 'bg-primary';
  const roleTitle = isFarmer ? 'Verified Farmer / Kisan' : 'Verified Trader / Vyapari';

  // Stats Calculations
  const activeInventory = userCrops.filter(c => c.status !== 'sold');
  const soldCrops = userCrops.filter(c => c.status === 'sold');
  const completedSalesList = soldCrops.length > 0 ? soldCrops : userSales;

  const totalStockQuintals = activeInventory.reduce((acc, c) => acc + (parseFloat(c.available_quantity !== undefined && c.available_quantity !== null ? c.available_quantity : c.weight) || 0), 0);
  const totalStockValue = activeInventory.reduce((acc, c) => acc + ((parseFloat(c.available_quantity !== undefined && c.available_quantity !== null ? c.available_quantity : c.weight) || 0) * (parseFloat(c.rate) || 0)), 0);

  const totalSoldVolume = completedSalesList.reduce((acc, c) => acc + (parseFloat(c.weight || c.quantity) || 0), 0);
  const totalRevenue = completedSalesList.reduce((acc, c) => acc + ((parseFloat(c.rate || c.final_price) || 2200) * (parseFloat(c.weight || c.quantity) || 1)), 0);

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', zIndex: 10000000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div className="glass-card-premium p-4 text-start" style={{
        width: '92%', maxWidth: '720px', maxHeight: '85vh', overflowY: 'auto',
        background: 'white', borderRadius: '18px', boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        position: 'relative', zIndex: 10000001
      }}>
        {/* Modal Header */}
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
          <div className="d-flex align-items-center gap-2">
            <i className={`fas ${isFarmer ? 'fa-tractor' : 'fa-store'} text-success fs-4`}></i>
            <div>
              <h5 className="fw-bold text-dark m-0">
                {isOwnProfile ? 'My Profile & Business Stats' : `${profile?.name || 'User'}'s Profile`}
              </h5>
              <small className="text-muted">KishanMarket Verified Member</small>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        {/* Tab Navigation */}
        {!isEditing && (
          <div className="nav nav-pills nav-fill bg-light p-1 rounded-3 mb-4 border" style={{ fontSize: '0.85rem' }}>
            <button 
              className={`nav-link fw-bold py-2 ${activeTab === 'overview' ? 'active bg-success text-white shadow-sm' : 'text-secondary'}`}
              onClick={() => setActiveTab('overview')}
            >
              <i className="fas fa-user-circle me-1"></i> Overview & Trust
            </button>
            <button 
              className={`nav-link fw-bold py-2 ${activeTab === 'inventory' ? 'active bg-success text-white shadow-sm' : 'text-secondary'}`}
              onClick={() => setActiveTab('inventory')}
            >
              <i className="fas fa-boxes-stacked me-1"></i> Stock Inventory ({activeInventory.length})
            </button>
            <button 
              className={`nav-link fw-bold py-2 ${activeTab === 'intel' ? 'active bg-success text-white shadow-sm' : 'text-secondary'}`}
              onClick={() => setActiveTab('intel')}
            >
              <i className="fas fa-lightbulb me-1"></i> Market Intel
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status"></div>
            <p className="small text-muted mt-2">Loading profile & business data...</p>
          </div>
        ) : isEditing ? (
          /* Profile Edit Form */
          <form onSubmit={handleSave}>
            <div className="text-center mb-4">
              <div className="position-relative d-inline-block">
                <div style={{
                  width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden',
                  backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '3px solid #16a34a', margin: '0 auto'
                }}>
                  {formData.profile_photo ? (
                    <img src={formData.profile_photo} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <i className={`fas ${isFarmer ? 'fa-user-nurse' : 'fa-user-tie'} fa-3x text-secondary`}></i>
                  )}
                </div>
                <label className="btn btn-sm btn-success rounded-circle position-absolute bottom-0 end-0 p-2 shadow" style={{ cursor: 'pointer' }} title="Upload Photo">
                  <i className="fas fa-camera"></i>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                </label>
              </div>
              <small className="text-muted d-block mt-2">Click camera icon to upload profile photo</small>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-bold">Full Name</label>
                <input 
                  type="text" 
                  className="form-control form-control-sm" 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  required 
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold">{isFarmer ? 'Farm / Krishi Kendra Name' : 'Firm / Business Name'}</label>
                <input 
                  type="text" 
                  className="form-control form-control-sm" 
                  placeholder={isFarmer ? 'e.g. Gupta Organic Farm' : 'e.g. Kisan Trading Corp'} 
                  value={formData.business_name} 
                  onChange={e => setFormData({ ...formData, business_name: e.target.value })} 
                />
              </div>

              <div className="col-12">
                <label className="form-label small fw-bold">About / Bio</label>
                <textarea 
                  className="form-control form-control-sm" 
                  rows="2" 
                  placeholder={isFarmer ? 'Tell buyers about your farming practices & experience...' : 'Tell sellers about your grain purchasing capacity...'} 
                  value={formData.bio} 
                  onChange={e => setFormData({ ...formData, bio: e.target.value })} 
                ></textarea>
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold">District / City</label>
                <input 
                  type="text" 
                  className="form-control form-control-sm" 
                  placeholder="e.g. Banda" 
                  value={formData.district} 
                  onChange={e => setFormData({ ...formData, district: e.target.value })} 
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold">State</label>
                <input 
                  type="text" 
                  className="form-control form-control-sm" 
                  placeholder="e.g. Uttar Pradesh" 
                  value={formData.state} 
                  onChange={e => setFormData({ ...formData, state: e.target.value })} 
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold">Pincode</label>
                <input 
                  type="text" 
                  className="form-control form-control-sm" 
                  placeholder="e.g. 210001" 
                  value={formData.pincode} 
                  onChange={e => setFormData({ ...formData, pincode: e.target.value })} 
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-bold">{isFarmer ? 'Crops Cultivated' : 'Crops Purchased'}</label>
                <input 
                  type="text" 
                  className="form-control form-control-sm" 
                  placeholder="e.g. Wheat, Rice, Mustard" 
                  value={formData.crops_specialty} 
                  onChange={e => setFormData({ ...formData, crops_specialty: e.target.value })} 
                />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
              <button type="submit" className="btn btn-sm btn-success fw-bold px-4" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        ) : (
          /* Tab Contents */
          <div>
            {/* TAB 1: OVERVIEW & TRUST */}
            {activeTab === 'overview' && (
              <div>
                <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3 border mb-4">
                  <div style={{
                    width: '75px', height: '75px', borderRadius: '50%', overflow: 'hidden',
                    backgroundColor: isFarmer ? '#dcfce7' : '#dbeafe',
                    color: isFarmer ? '#15803d' : '#1d4ed8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 'bold', border: '3px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                  }}>
                    {profile?.profile_photo ? (
                      <img src={profile.profile_photo} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <i className={`fas ${isFarmer ? 'fa-tractor' : 'fa-store'} fa-2x`}></i>
                    )}
                  </div>

                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <h5 className="fw-bold text-dark m-0">{profile?.name || 'KishanMarket Member'}</h5>
                      <i className="fas fa-check-circle text-primary fs-5" title="Verified Account"></i>
                    </div>
                    {profile?.business_name && (
                      <div className="small fw-bold text-secondary">{profile.business_name}</div>
                    )}
                    <div className="mt-1 d-flex align-items-center gap-2">
                      <span className={`badge ${roleBadge}`}>{roleTitle}</span>
                      <span className="badge bg-warning text-dark fw-bold">
                        <i className="fas fa-star me-1"></i>
                        {profile?.avg_rating ? parseFloat(profile.avg_rating).toFixed(1) : '5.0'} ({profile?.review_count || 0} reviews)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="row g-3 text-start mb-4">
                  <div className="col-md-6">
                    <div className="p-3 bg-white border rounded shadow-sm">
                      <div className="small text-muted fw-bold mb-1"><i className="fas fa-map-marker-alt text-danger me-1"></i> Location & Address</div>
                      <div className="fw-bold text-dark">{profile?.location || profile?.address || 'Location Not Specified'}</div>
                      {profile?.pincode && <small className="text-muted">Pincode: {profile.pincode}</small>}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="p-3 bg-white border rounded shadow-sm">
                      <div className="small text-muted fw-bold mb-1"><i className="fas fa-phone-alt text-success me-1"></i> Mobile Contact</div>
                      <div className="fw-bold text-dark">+91 {profile?.mobile || 'Verified'}</div>
                      <small className="text-success"><i className="fas fa-shield-alt me-1"></i> Identity Verified</small>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="p-3 bg-white border rounded shadow-sm">
                      <div className="small text-muted fw-bold mb-1"><i className="fas fa-wheat-awn text-warning me-1"></i> {isFarmer ? 'Crops Grown / Specialty' : 'Crops Procurement Focus'}</div>
                      <div className="fw-bold text-dark">{profile?.crops_specialty || 'Wheat, Rice, Maize, Mustard'}</div>
                    </div>
                  </div>

                  {profile?.bio && (
                    <div className="col-12">
                      <div className="p-3 bg-white border rounded shadow-sm">
                        <div className="small text-muted fw-bold mb-1"><i className="fas fa-info-circle text-primary me-1"></i> Member Bio</div>
                        <p className="small text-dark mb-0">{profile.bio}</p>
                      </div>
                    </div>
                  )}

                  {/* Reviews Section */}
                  <div className="col-12 mt-3">
                    <h6 className="fw-bold text-dark mb-2"><i className="fas fa-comments text-warning me-1"></i> Trade Reputation & Reviews</h6>
                    <ReviewsList targetUserMobile={profile?.mobile || targetUserMobile} />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CROP STOCK / INVENTORY */}
            {activeTab === 'inventory' && (
              <div>
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <div className="p-3 bg-success bg-opacity-10 border border-success rounded text-center">
                      <small className="text-muted fw-bold d-block">ACTIVE LISTINGS</small>
                      <span className="fs-3 fw-bold text-success">{activeInventory.length}</span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 bg-primary bg-opacity-10 border border-primary rounded text-center">
                      <small className="text-muted fw-bold d-block">TOTAL QUANTITY STOCK</small>
                      <span className="fs-3 fw-bold text-primary">{totalStockQuintals} quintals</span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 bg-warning bg-opacity-10 border border-warning rounded text-center">
                      <small className="text-muted fw-bold d-block">ESTIMATED VALUATION</small>
                      <span className="fs-3 fw-bold text-dark">₹{totalStockValue.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                <h6 className="fw-bold text-dark mb-3"><i className="fas fa-boxes-stacked text-success me-1"></i> Active Crops Inventory</h6>
                {activeInventory.length === 0 ? (
                  <div className="text-center py-4 bg-light rounded border">
                    <i className="fas fa-seedling text-muted fa-2x mb-2 opacity-50"></i>
                    <div className="small text-muted">No active crops listed in stock.</div>
                  </div>
                ) : (
                  <div className="row g-3">
                    {activeInventory.map((c, i) => (
                      <div key={i} className="col-md-6">
                        <div className="p-3 bg-white border rounded shadow-sm">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="fw-bold text-success m-0">{c.name}</h6>
                            <span className="badge bg-success">Active</span>
                          </div>
                          <div className="small text-dark fw-bold">Volume: {c.weight} quintals</div>
                          <div className="small text-success fw-bold">Rate: ₹{c.rate}/q</div>
                          <small className="text-muted"><i className="fas fa-map-marker-alt text-danger me-1"></i>{c.loc}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: MARKET INTEL */}
            {activeTab === 'intel' && (
              <div>
                <h6 className="fw-bold text-dark mb-3"><i className="fas fa-brain text-warning me-1"></i> Mandi Analytics & Price Trends</h6>
                <div className="row g-3">
                  {marketIntel.length === 0 ? (
                    [
                      { crop: "Gehu (Wheat)", avgPrice: "₹2,450/q", forecast: "High demand expected next month due to festival season (+3.2%)." },
                      { crop: "Dhan (Paddy)", avgPrice: "₹2,100/q", forecast: "Stable market supply with strong export demand (+1.5%)." }
                    ].map((item, i) => (
                      <div key={i} className="col-md-6">
                        <div className="p-3 bg-white border rounded shadow-sm">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="fw-bold text-dark m-0">{item.crop}</h6>
                            <span className="badge bg-success">{item.avgPrice}</span>
                          </div>
                          <p className="small text-secondary m-0">{item.forecast}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    marketIntel.map((item, i) => (
                      <div key={i} className="col-md-6">
                        <div className="p-3 bg-white border rounded shadow-sm">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="fw-bold text-dark m-0">{item.crop || item.name}</h6>
                            <span className="badge bg-success">₹{item.avgPrice || item.rate}/q</span>
                          </div>
                          <p className="small text-secondary m-0">{item.forecast || item.trend || 'Market rates stable'}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="d-flex justify-content-between align-items-center pt-3 border-top mt-4">
              <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Close</button>
              {isOwnProfile && (
                <button className="btn btn-sm btn-success fw-bold px-4" onClick={() => setIsEditing(true)}>
                  <i className="fas fa-edit me-1"></i> Edit My Profile
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ProfileModal;

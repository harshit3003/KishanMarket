import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ReviewsList from './ReviewsList';

const ProfileModal = ({ isOpen, onClose, targetUserMobile, currentUser, onProfileUpdated }) => {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
      }
    } else {
      setIsEditing(false);
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
        // Fallback to local user
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

        // Update local session storage
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

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 1150,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="glass-card-premium p-4 text-start" style={{
        width: '90%', maxWidth: '580px', maxHeight: '85vh', overflowY: 'auto',
        background: 'white', borderRadius: '18px', boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
      }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
          <div className="d-flex align-items-center gap-2">
            <i className={`fas ${isFarmer ? 'fa-tractor' : 'fa-store'} text-success fs-4`}></i>
            <div>
              <h5 className="fw-bold text-dark m-0">
                {isOwnProfile ? 'My Trust Profile' : `${profile?.name || 'User'}'s Profile`}
              </h5>
              <small className="text-muted">KishanMarket Verified Member</small>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status"></div>
            <p className="small text-muted mt-2">Loading profile details...</p>
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
          /* Public Profile View */
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

              {/* Member Reviews & Feedback */}
              <div className="col-12 mt-3">
                <h6 className="fw-bold text-dark mb-2"><i className="fas fa-comments text-warning me-1"></i> Trade Reputation & Reviews</h6>
                <ReviewsList targetUserMobile={profile?.mobile || targetUserMobile} />
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center pt-3 border-top">
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
    </div>
  );
};

export default ProfileModal;

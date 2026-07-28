import React from 'react';

const ProfileCard = ({ name, role, user_id, profile_photo, location, onClick, className = '' }) => {
  const isFarmer = role === 'seller';
  const badgeColor = isFarmer ? 'bg-success' : 'bg-primary';
  const badgeText = isFarmer ? 'Farmer / Kisan' : 'Trader / Vyapari';

  return (
    <div 
      className={`d-inline-flex align-items-center gap-2 cursor-pointer p-1 rounded-pill bg-light border ${className}`}
      onClick={onClick}
      style={{ cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
      title={`Click to view ${name}'s verified profile`}
    >
      <div 
        style={{
          width: '36px', height: '36px', borderRadius: '50%',
          backgroundColor: isFarmer ? '#dcfce7' : '#dbeafe',
          color: isFarmer ? '#15803d' : '#1d4ed8',
          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 'bold', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        {profile_photo ? (
          <img src={profile_photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <i className={`fas ${isFarmer ? 'fa-tractor' : 'fa-store'}`}></i>
        )}
      </div>

      <div className="pe-2 text-start lh-1">
        <div className="fw-bold text-dark small m-0 d-flex align-items-center gap-1">
          {name}
          <i className="fas fa-check-circle text-primary" style={{ fontSize: '0.75rem' }} title="Verified User"></i>
        </div>
        <div className="d-flex align-items-center gap-1 mt-1">
          <span className={`badge ${badgeColor} text-white`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
            {badgeText}
          </span>
          {distance !== undefined && distance !== null && (
            <span className="badge bg-danger text-white ms-1" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
              📍 {distance} km
            </span>
          )}
          {onReport && (
            <button 
              className="btn btn-sm btn-link text-danger p-0 ms-2"
              onClick={(e) => { e.stopPropagation(); onReport(); }}
              title="Report User Profile"
              style={{ fontSize: '0.7rem' }}
            >
              🚩 Report
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;

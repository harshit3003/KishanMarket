import React, { useState, useEffect } from 'react';

const SeasonalSuggestionBanner = ({ onSelectCrop }) => {
  const [seasonalData, setSeasonalData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSeasonalCrops();
  }, []);

  const fetchSeasonalCrops = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/seasonal-crops');
      if (res.ok) {
        setSeasonalData(await res.json());
      }
    } catch (err) {
      console.error("Failed to load seasonal crop suggestions:", err);
    }
    setIsLoading(false);
  };

  if (isLoading || !seasonalData || !seasonalData.crops || seasonalData.crops.length === 0) {
    return null;
  }

  const { monthName, seasonName, crops } = seasonalData;

  const seasonIcons = {
    Rabi: 'fa-snowflake text-info',
    Kharif: 'fa-cloud-showers-heavy text-primary',
    Zaid: 'fa-sun text-warning'
  };

  return (
    <div className="p-3 mb-3 bg-gradient rounded-3 border shadow-sm text-start" style={{
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      borderColor: '#86efac'
    }}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="d-flex align-items-center gap-2">
          <i className={`fas ${seasonIcons[seasonName] || 'fa-wheat-awn text-success'} fs-5`}></i>
          <div>
            <span className="fw-bold text-dark small me-2">
              🌾 In-Season Now ({monthName} — {seasonName} Season):
            </span>
            <small className="text-muted d-block d-sm-inline">Click a crop to auto-fill listing form</small>
          </div>
        </div>
        <span className="badge bg-success fw-bold px-2 py-1" style={{ fontSize: '0.75rem' }}>
          {seasonName} Season
        </span>
      </div>

      <div className="d-flex flex-wrap gap-2 mt-2">
        {crops.map((item) => (
          <button
            key={item.id}
            type="button"
            className="btn btn-sm btn-white border border-success text-success fw-bold bg-white shadow-xs px-3 py-1 rounded-pill"
            style={{ fontSize: '0.8rem', transition: 'all 0.2s ease' }}
            onClick={() => onSelectCrop && onSelectCrop(item.crop_name)}
            title={item.tips || 'Click to select this crop'}
          >
            <i className="fas fa-plus-circle me-1 text-success"></i>
            {item.crop_name} {item.hindi_name ? `(${item.hindi_name})` : ''}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SeasonalSuggestionBanner;

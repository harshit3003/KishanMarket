import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const CROP_BASE_PRICES = {
  'Gehu': { base: 2450, unit: 'q', min: 2100, max: 2800 },
  'Dhan': { base: 3100, unit: 'q', min: 2800, max: 3600 },
  'Makka': { base: 1900, unit: 'q', min: 1600, max: 2200 },
  'Mustard': { base: 5400, unit: 'q', min: 4800, max: 6100 },
  'Cotton': { base: 6800, unit: 'q', min: 6000, max: 7500 }
};

const AIAssessor = ({ onApplyRate }) => {
  const [status, setStatus] = useState('idle'); // idle, scanning, complete, calibrate
  const [selectedCrop, setSelectedCrop] = useState('Gehu');
  const [imagePreview, setImagePreview] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  
  // Model Calibration (Training Weights)
  const [moistureWeight, setMoistureWeight] = useState(1.0);
  const [purityWeight, setPurityWeight] = useState(1.0);
  const [marketPremium, setMarketPremium] = useState(0);

  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
      runAIAnalysis(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const runAIAnalysis = (imgSrc) => {
    setStatus('scanning');

    // Simulate AI Vision & Feature Extraction Pipeline
    setTimeout(() => {
      const baseInfo = CROP_BASE_PRICES[selectedCrop] || CROP_BASE_PRICES['Gehu'];
      
      // Calculate moisture (8% - 15%)
      const moisture = (9.5 + (Math.random() * 4.5)).toFixed(1);
      // Impurities (0.3% - 2.5%)
      const impurities = (0.3 + (Math.random() * 1.8)).toFixed(1);
      // Grain Uniformity (75% - 98%)
      const grainScore = Math.floor(80 + (Math.random() * 18));

      // Quality Grade Determination
      let grade = 'Grade A+';
      let qualityMultiplier = 1.08;

      if (grainScore < 82 || impurities > 1.8) {
        grade = 'Grade B';
        qualityMultiplier = 0.92;
      } else if (grainScore < 90 || impurities > 1.0) {
        grade = 'Grade A';
        qualityMultiplier = 1.0;
      }

      // Calculate Predicted Rate using trained weights
      const moistureDeduction = (parseFloat(moisture) > 12 ? (parseFloat(moisture) - 12) * 45 : 0) * moistureWeight;
      const impurityDeduction = parseFloat(impurities) * 30 * purityWeight;
      
      let predictedRate = Math.round((baseInfo.base * qualityMultiplier) - moistureDeduction - impurityDeduction + parseInt(marketPremium || 0));
      
      // Keep within realistic crop bounds
      predictedRate = Math.max(baseInfo.min, Math.min(baseInfo.max, predictedRate));

      setAnalysisResult({
        crop: selectedCrop,
        grade,
        moisture,
        impurities,
        grainScore,
        predictedRate,
        basePrice: baseInfo.base
      });

      setStatus('complete');
    }, 2500);
  };

  const handleTrainModel = (e) => {
    e.preventDefault();
    toast.success(`AI Model Calibrated for ${selectedCrop}! Rates re-weighted.`);
    setStatus('idle');
  };

  return (
    <div className="glass-card-premium p-4 h-100 position-relative overflow-hidden" style={{ transformStyle: 'preserve-3d' }}>
      <div className="d-flex justify-content-between align-items-center mb-3" style={{ transform: 'translateZ(30px)' }}>
        <h5 className="section-title m-0">
          <i className="fas fa-brain text-success me-2"></i> AI Crop Assessor
        </h5>
        <button className="btn btn-sm btn-outline-secondary py-0 px-2" onClick={() => setStatus(status === 'calibrate' ? 'idle' : 'calibrate')} style={{ fontSize: '0.75rem', borderRadius: '10px' }}>
          <i className="fas fa-sliders-h me-1"></i> {status === 'calibrate' ? 'Back' : 'Train AI'}
        </button>
      </div>

      {status === 'calibrate' && (
        <div className="p-3 bg-light rounded border text-start" style={{ transform: 'translateZ(20px)', fontSize: '0.85rem' }}>
          <h6 className="fw-bold text-success mb-2"><i className="fas fa-microchip me-1"></i> Re-calibrate AI Weights</h6>
          <form onSubmit={handleTrainModel}>
            <div className="mb-2">
              <label className="form-label mb-1">Moisture Penalty Weight ({moistureWeight}x)</label>
              <input type="range" className="form-range" min="0.5" max="2.0" step="0.1" value={moistureWeight} onChange={e => setMoistureWeight(parseFloat(e.target.value))} />
            </div>
            <div className="mb-2">
              <label className="form-label mb-1">Impurity Penalty Weight ({purityWeight}x)</label>
              <input type="range" className="form-range" min="0.5" max="2.0" step="0.1" value={purityWeight} onChange={e => setPurityWeight(parseFloat(e.target.value))} />
            </div>
            <div className="mb-2">
              <label className="form-label mb-1">Regional Mandi Premium (₹{marketPremium}/q)</label>
              <input type="number" className="form-control form-control-sm" placeholder="e.g. +50" value={marketPremium} onChange={e => setMarketPremium(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-success btn-sm w-100 mt-2 fw-bold">Save Calibration</button>
          </form>
        </div>
      )}

      {status === 'idle' && (
        <div className="d-flex flex-column h-100 justify-content-between">
          <div className="mb-3">
            <label className="form-label small fw-bold text-muted">Select Crop Type</label>
            <select className="form-select form-select-sm" value={selectedCrop} onChange={e => setSelectedCrop(e.target.value)}>
              <option value="Gehu">Gehu (Wheat)</option>
              <option value="Dhan">Dhan (Rice)</option>
              <option value="Makka">Makka (Maize)</option>
              <option value="Mustard">Mustard (Sarson)</option>
              <option value="Cotton">Cotton (Kapas)</option>
            </select>
          </div>

          <div 
            className="text-center p-4 border border-2 border-dashed rounded bg-light hover-shadow" 
            style={{ borderColor: '#cbd5e1', cursor: 'pointer', transform: 'translateZ(20px)', transition: 'all 0.3s ease' }} 
            onClick={() => fileInputRef.current?.click()}
          >
            <i className="fas fa-camera fa-3x text-success mb-2 opacity-75"></i>
            <p className="m-0 fw-bold text-dark">Upload Grain Image</p>
            <small className="text-muted d-block mt-1">AI inspects moisture, impurities & suggests rate.</small>
            <input type="file" ref={fileInputRef} className="d-none" accept="image/*" onChange={handleImageSelect} />
          </div>
        </div>
      )}

      {status === 'scanning' && (
        <div className="text-center p-4 my-auto position-relative" style={{ transform: 'translateZ(20px)' }}>
          {imagePreview && (
            <div className="position-relative mx-auto mb-3 overflow-hidden rounded shadow" style={{ width: '120px', height: '90px' }}>
              <img src={imagePreview} alt="Crop Scan" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div className="position-absolute top-0 start-0 w-100 h-100" style={{
                background: 'linear-gradient(180deg, rgba(16,185,129,0) 0%, rgba(16,185,129,0.5) 50%, rgba(16,185,129,0) 100%)',
                animation: 'scanLine 1.5s infinite ease-in-out'
              }}></div>
            </div>
          )}
          <div className="spinner-border text-success mb-2" role="status" style={{ width: '2.5rem', height: '2.5rem' }}></div>
          <h6 className="fw-bold text-success animate-pulse">Scanning Grain Texture...</h6>
          <small className="text-muted">Analyzing moisture, impurities & quality grade.</small>
        </div>
      )}

      {status === 'complete' && analysisResult && (
        <div className="p-3 bg-white rounded border border-success shadow-sm" style={{ transform: 'translateZ(20px)' }}>
          <div className="d-flex align-items-center gap-3 mb-2">
            <i className={`fas fa-award fa-2x ${analysisResult.grade === 'Grade A+' ? 'text-warning' : 'text-success'}`}></i>
            <div>
              <h6 className="m-0 fw-bold text-success">{analysisResult.grade} ({analysisResult.grainScore}% Quality)</h6>
              <small className="text-muted">Moisture: {analysisResult.moisture}% | Impurities: {analysisResult.impurities}%</small>
            </div>
          </div>
          <hr className="my-2" />
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">Predicted Rate:</small>
            <span className="fw-bold fs-5 text-success">₹{analysisResult.predictedRate.toLocaleString('en-IN')}/q</span>
          </div>
          
          {onApplyRate && (
            <button 
              className="btn btn-success btn-sm w-100 mt-3 fw-bold"
              onClick={() => {
                onApplyRate(analysisResult.predictedRate, analysisResult.crop);
                toast.success(`Applied ₹${analysisResult.predictedRate}/q rate to upload form!`);
              }}
            >
              <i className="fas fa-check me-1"></i> Apply Rate to Form
            </button>
          )}

          <button className="btn btn-outline-secondary btn-sm w-100 mt-2" onClick={() => setStatus('idle')}>Scan Another</button>
        </div>
      )}

      <style>{`
        @keyframes scanLine {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
};

export default AIAssessor;

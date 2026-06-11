import React, { useState } from 'react';

const AIAssessor = () => {
  const [status, setStatus] = useState('idle'); // idle, scanning, complete
  
  const handleUpload = (e) => {
    if (e.target.files.length > 0) {
      setStatus('scanning');
      setTimeout(() => setStatus('complete'), 3000);
    }
  };

  return (
    <div className="glass-card-premium p-4 h-100" style={{ transformStyle: 'preserve-3d' }}>
      <h5 className="section-title" style={{ transform: 'translateZ(30px)' }}><i className="fas fa-brain text-success me-2"></i> AI Crop Assessor</h5>
      
      {status === 'idle' && (
        <div className="text-center p-4 border border-dashed rounded" style={{ borderColor: '#cbd5e1', cursor: 'pointer', transform: 'translateZ(20px)' }} onClick={() => document.getElementById('ai-file').click()}>
          <i className="fas fa-camera fa-3x text-muted mb-3"></i>
          <p className="m-0 fw-bold">Upload Crop Image</p>
          <small className="text-muted">AI will analyze quality and suggest rate.</small>
          <input type="file" id="ai-file" className="d-none" accept="image/*" onChange={handleUpload} />
        </div>
      )}

      {status === 'scanning' && (
        <div className="text-center p-4" style={{ transform: 'translateZ(20px)' }}>
          <div className="spinner-grow text-success mb-3" role="status" style={{ width: '3rem', height: '3rem' }}></div>
          <h6 className="fw-bold animate-pulse">AI is scanning crop grains...</h6>
          <small className="text-muted">Checking moisture, size, and impurities.</small>
        </div>
      )}

      {status === 'complete' && (
        <div className="p-3 bg-light rounded border border-success" style={{ transform: 'translateZ(20px)' }}>
          <div className="d-flex align-items-center gap-3 mb-2">
            <i className="fas fa-check-circle fa-2x text-success"></i>
            <div>
              <h6 className="m-0 fw-bold text-success">Grade A Quality</h6>
              <small>Moisture: 12% | Impurities: &lt;1%</small>
            </div>
          </div>
          <hr />
          <p className="m-0">Suggested Rate: <strong className="text-success fs-5">₹2,550/q</strong></p>
          <button className="btn btn-outline-success btn-sm w-100 mt-3" onClick={() => setStatus('idle')}>Scan Another</button>
        </div>
      )}
    </div>
  );
};

export default AIAssessor;

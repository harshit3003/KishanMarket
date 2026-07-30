import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="card shadow-sm border-0 rounded-4 p-4 bg-white mb-3 position-relative overflow-hidden" style={{ animation: 'pulse 1.5s infinite ease-in-out' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="bg-secondary opacity-25 rounded-3" style={{ width: '120px', height: '20px' }}></div>
        <div className="bg-secondary opacity-25 rounded-pill" style={{ width: '80px', height: '24px' }}></div>
      </div>
      <div className="bg-secondary opacity-25 rounded-2 mb-2" style={{ width: '70%', height: '16px' }}></div>
      <div className="bg-secondary opacity-25 rounded-2 mb-3" style={{ width: '40%', height: '14px' }}></div>
      <div className="d-flex justify-content-between align-items-center pt-2 border-top">
        <div className="bg-secondary opacity-25 rounded-3" style={{ width: '90px', height: '24px' }}></div>
        <div className="bg-success opacity-25 rounded-pill" style={{ width: '110px', height: '36px' }}></div>
      </div>
    </div>
  );
};

export default SkeletonCard;

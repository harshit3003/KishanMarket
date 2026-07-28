import React from 'react';

const StockProgressBar = ({ totalQuantity, availableQuantity, status }) => {
  const total = parseFloat(totalQuantity) || 50;
  const avail = availableQuantity !== undefined && availableQuantity !== null ? parseFloat(availableQuantity) : total;

  const percent = Math.min(100, Math.max(0, Math.round((avail / total) * 100)));
  const isSoldOut = status === 'sold' || avail <= 0;
  const isLowStock = !isSoldOut && percent < 20;

  let barColor = 'bg-success';
  if (percent < 20) barColor = 'bg-danger';
  else if (percent < 50) barColor = 'bg-warning text-dark';

  return (
    <div className="my-2 text-start">
      <div className="d-flex justify-content-between align-items-center mb-1" style={{ fontSize: '0.75rem' }}>
        <span className="fw-bold text-secondary">
          Stock: {isSoldOut ? '0' : avail} / {total} quintals
        </span>
        {isSoldOut ? (
          <span className="badge bg-danger text-white fw-bold px-2 py-1">Sold Out</span>
        ) : isLowStock ? (
          <span className="badge bg-warning text-dark fw-bold px-2 py-1 animate-pulse">Low Stock ⚠️</span>
        ) : (
          <span className="text-muted">{percent}% Left</span>
        )}
      </div>

      <div className="progress" style={{ height: '7px', borderRadius: '4px', backgroundColor: '#e2e8f0' }}>
        <div 
          className={`progress-bar ${barColor}`} 
          role="progressbar" 
          style={{ width: `${isSoldOut ? 0 : percent}%`, transition: 'width 0.4s ease' }}
          aria-valuenow={percent} 
          aria-valuemin="0" 
          aria-valuemax="100"
        ></div>
      </div>
    </div>
  );
};

export default StockProgressBar;

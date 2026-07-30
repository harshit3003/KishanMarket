import React from 'react';

const EmptyState = ({ icon = "fas fa-folder-open", title = "No Data Found", description = "There are currently no items to display in this view.", actionText, onAction }) => {
  return (
    <div className="text-center py-5 px-4 rounded-4 glass-card-premium my-3 border" style={{ background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)', borderColor: 'rgba(0,0,0,0.05)' }}>
      <div className="mb-3 d-inline-flex align-items-center justify-content-center rounded-circle" style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.2) 100%)', color: 'var(--primary)' }}>
        <i className={`${icon} fa-2x`}></i>
      </div>
      <h5 className="fw-bold text-dark mb-2">{title}</h5>
      <p className="text-muted small mx-auto mb-4" style={{ maxWidth: '400px', lineHeight: '1.5' }}>
        {description}
      </p>
      {actionText && onAction && (
        <button className="btn-primary-dark btn-premium-hover px-4 py-2 rounded-pill fw-bold" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

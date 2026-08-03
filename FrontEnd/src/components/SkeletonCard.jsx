import React from 'react';

const SkeletonCard = ({ variant = 'card', count = 1 }) => {
  const items = Array.from({ length: count });

  return (
    <>
      <style>{`
        @keyframes skeletonShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .km-skeleton-shimmer {
          background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
          background-size: 200% 100%;
          animation: skeletonShimmer 1.5s infinite linear;
          border-radius: 8px;
        }
      `}</style>

      {items.map((_, idx) => (
        <React.Fragment key={idx}>
          {variant === 'table' && (
            <div className="d-flex align-items-center justify-content-between p-3 mb-2 rounded-3" style={{ background: '#1e293b', border: '1px solid #334155' }}>
              <div className="km-skeleton-shimmer" style={{ width: '25%', height: '20px' }}></div>
              <div className="km-skeleton-shimmer" style={{ width: '20%', height: '20px' }}></div>
              <div className="km-skeleton-shimmer" style={{ width: '15%', height: '20px' }}></div>
              <div className="km-skeleton-shimmer rounded-pill" style={{ width: '10%', height: '24px' }}></div>
            </div>
          )}

          {variant === 'profile' && (
            <div className="p-4 rounded-4" style={{ background: '#1e293b', border: '1px solid #334155' }}>
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="km-skeleton-shimmer rounded-circle" style={{ width: '70px', height: '70px' }}></div>
                <div className="w-50">
                  <div className="km-skeleton-shimmer mb-2" style={{ width: '60%', height: '24px' }}></div>
                  <div className="km-skeleton-shimmer" style={{ width: '40%', height: '16px' }}></div>
                </div>
              </div>
              <div className="km-skeleton-shimmer mb-2" style={{ width: '100%', height: '14px' }}></div>
              <div className="km-skeleton-shimmer mb-2" style={{ width: '90%', height: '14px' }}></div>
            </div>
          )}

          {variant === 'chat' && (
            <div className="d-flex flex-column gap-3 p-3">
              <div className="km-skeleton-shimmer align-self-start rounded-4 p-3" style={{ width: '60%', height: '50px' }}></div>
              <div className="km-skeleton-shimmer align-self-end rounded-4 p-3" style={{ width: '50%', height: '50px' }}></div>
              <div className="km-skeleton-shimmer align-self-start rounded-4 p-3" style={{ width: '45%', height: '40px' }}></div>
            </div>
          )}

          {variant === 'analytics' && (
            <div className="row g-3 mb-4">
              <div className="col-3"><div className="km-skeleton-shimmer p-4 rounded-4" style={{ height: '90px' }}></div></div>
              <div className="col-3"><div className="km-skeleton-shimmer p-4 rounded-4" style={{ height: '90px' }}></div></div>
              <div className="col-3"><div className="km-skeleton-shimmer p-4 rounded-4" style={{ height: '90px' }}></div></div>
              <div className="col-3"><div className="km-skeleton-shimmer p-4 rounded-4" style={{ height: '90px' }}></div></div>
            </div>
          )}

          {(variant === 'card' || variant === 'list') && (
            <div className="card shadow-sm border-0 rounded-4 p-4 mb-3" style={{ background: '#1e293b', border: '1px solid #334155' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="km-skeleton-shimmer" style={{ width: '140px', height: '22px' }}></div>
                <div className="km-skeleton-shimmer rounded-pill" style={{ width: '85px', height: '26px' }}></div>
              </div>
              <div className="km-skeleton-shimmer mb-2" style={{ width: '75%', height: '18px' }}></div>
              <div className="km-skeleton-shimmer mb-3" style={{ width: '45%', height: '14px' }}></div>
              <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary">
                <div className="km-skeleton-shimmer" style={{ width: '100px', height: '26px' }}></div>
                <div className="km-skeleton-shimmer rounded-pill" style={{ width: '120px', height: '38px' }}></div>
              </div>
            </div>
          )}
        </React.Fragment>
      ))}
    </>
  );
};

export default SkeletonCard;

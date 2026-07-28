import React, { useState, useEffect } from 'react';

const ReviewsList = ({ targetUserMobile }) => {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (targetUserMobile) {
      setIsLoading(true);
      fetch(`/api/reviews/user/${encodeURIComponent(targetUserMobile)}`)
        .then(res => res.ok ? res.json() : [])
        .then(data => setReviews(data))
        .catch(err => console.error("Error loading user reviews:", err))
        .finally(() => setIsLoading(false));
    }
  }, [targetUserMobile]);

  if (isLoading) {
    return <div className="text-center py-3 small text-muted">Loading reviews...</div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-3 bg-light rounded border">
        <i className="fas fa-comment-slash text-muted opacity-50 mb-1"></i>
        <div className="small text-muted">No reviews yet for this user.</div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-2">
      {reviews.map((r, idx) => (
        <div key={r.id || idx} className="p-3 bg-white rounded border shadow-sm text-start">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <div className="fw-bold text-dark small d-flex align-items-center gap-1">
              <i className="fas fa-user-circle text-secondary me-1"></i>
              {r.from_user_name || 'Verified User'}
            </div>
            <div className="text-warning small">
              {[...Array(5)].map((_, i) => (
                <i key={i} className={`fas fa-star ${i < r.rating ? 'text-warning' : 'text-muted opacity-25'}`} style={{ fontSize: '0.75rem' }}></i>
              ))}
            </div>
          </div>
          {r.comment && <p className="small text-secondary mb-1 font-italic">"{r.comment}"</p>}
          <div className="text-end opacity-50" style={{ fontSize: '0.65rem' }}>
            {r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB') : 'Verified Trade'}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReviewsList;

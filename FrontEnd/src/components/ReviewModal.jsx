import React, { useState } from 'react';
import toast from 'react-hot-toast';

const ReviewModal = ({ isOpen, onClose, transactionData, currentUser, onReviewSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !transactionData) return null;

  const targetMobile = transactionData.toUserMobile || transactionData.seller_mobile || transactionData.buyerMobile || '';
  const targetName = transactionData.toUserName || transactionData.seller || transactionData.buyer || 'Member';
  const cropName = transactionData.cropName || transactionData.name || 'Crop Transaction';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || !currentUser.mobile) {
      toast.error("Please log in to submit a review.");
      return;
    }

    if (!targetMobile) {
      toast.error("Target user mobile information is missing.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: transactionData.orderId || transactionData.id ? `order_${transactionData.orderId || transactionData.id}` : null,
          from_user_mobile: currentUser.mobile,
          from_user_name: currentUser.name || 'Customer',
          to_user_mobile: targetMobile,
          to_user_name: targetName,
          rating,
          comment: comment.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`⭐ ${rating}-Star Review submitted for ${targetName}!`);
        if (onReviewSubmitted) onReviewSubmitted(data);
        onClose();
      } else {
        toast.error(data.error || "Failed to submit review.");
      }
    } catch (err) {
      toast.error("Network error submitting review.");
    }
    setIsSubmitting(false);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1200,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="glass-card-premium p-4 text-start" style={{
        width: '90%', maxWidth: '460px', background: 'white', borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
      }}>
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
          <div className="d-flex align-items-center gap-2">
            <i className="fas fa-star text-warning fs-4"></i>
            <div>
              <h5 className="fw-bold text-dark m-0">Rate Transaction</h5>
              <small className="text-muted">Item: {cropName}</small>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="text-center my-3 p-3 bg-light rounded-3 border">
            <div className="small text-muted mb-2">How was your trading experience with <strong>{targetName}</strong>?</div>
            
            {/* Interactive Star Widget */}
            <div className="d-flex justify-content-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <i
                  key={star}
                  className={`fas fa-star fa-2x ${ (hoverRating || rating) >= star ? 'text-warning' : 'text-muted opacity-25' }`}
                  style={{ cursor: 'pointer', transition: 'transform 0.1s ease' }}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                ></i>
              ))}
            </div>
            <div className="fw-bold text-success small">
              {rating === 5 && '🌟 Excellent Experience!'}
              {rating === 4 && '👍 Good Service'}
              {rating === 3 && '😐 Average'}
              {rating === 2 && '👎 Below Expectations'}
              {rating === 1 && '⚠️ Poor Experience'}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-bold">Review Comment (Optional)</label>
            <textarea
              className="form-control form-control-sm"
              rows="3"
              placeholder="Write a brief comment about payment promptness, crop quality, or communication..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            ></textarea>
          </div>

          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-sm btn-warning fw-bold px-4 text-dark" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;

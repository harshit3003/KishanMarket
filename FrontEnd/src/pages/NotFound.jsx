import React from 'react';
import { Link } from 'react-router-dom';
import BackgroundLayer from '../components/BackgroundLayer';

const NotFound = () => {
  return (
    <>
      <BackgroundLayer />
      <div className="container d-flex flex-column justify-content-center align-items-center text-center" style={{ minHeight: '100vh' }}>
        <div className="glass-card-premium p-5" style={{ maxWidth: '600px' }}>
          <h1 className="fw-bold text-success mb-3" style={{ fontSize: '5rem' }}>404</h1>
          <h3 className="fw-bold mb-4">Page Not Found</h3>
          <p className="text-muted mb-4">
            Oops! It looks like you've wandered off the farm. The page you are looking for doesn't exist or has been moved.
          </p>
          <Link to="/" className="btn btn-success btn-lg rounded-pill px-5 fw-bold btn-premium-hover">
            <i className="fas fa-home me-2"></i> Return Home
          </Link>
        </div>
      </div>
    </>
  );
};

export default NotFound;

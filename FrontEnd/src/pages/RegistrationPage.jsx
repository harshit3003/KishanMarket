import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../assets/global.css';
import '../assets/dynamic-features.css';
import '../assets/registration-style.css';

const RegistrationPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    location: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false
  });

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchLocations = async (query) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5`);
      const data = await res.json();
      if (data.results) {
        setSuggestions(data.results);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
      }
    } catch (e) {
      setSuggestions([]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    if (name === 'location') {
      fetchLocations(value);
    }
  };

  const handleSelectLocation = (loc) => {
    const formatted = loc.admin1 ? `${loc.name}, ${loc.admin1}` : `${loc.name}, ${loc.country}`;
    setFormData({ ...formData, location: formatted });
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, role, location, mobile, password, confirmPassword, termsAccepted } = formData;

    // Validation
    if (!role) {
      toast.error("Please select a role (Buyer/Seller) to continue.");
      return;
    }
    if (mobile.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!termsAccepted) {
      toast.error("You must accept the Terms and Conditions.");
      return;
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobile, location, role, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || "Registration failed");
        return;
      }

      // Save to device persistent registered_users storage
      const localUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
      const updatedUsers = [...localUsers.filter(u => u.mobile !== mobile), { name, mobile, role, location, password }];
      localStorage.setItem('registered_users', JSON.stringify(updatedUsers));

      // Login logic: Keep active session in local storage
      localStorage.setItem('displayUserName', name);
      localStorage.setItem('currentUser', JSON.stringify({ name, mobile, role, location }));

      // Direct redirection based on role
      toast.success("Account created successfully!");
      if (role === 'seller') {
        navigate('/seller');
      } else {
        navigate('/buyer');
      }
    } catch (err) {
      toast.error("Server connection error. Please try again.");
      console.error(err);
    }
  };

  return (
    <>
      
      {/* Fixed Premium Navbar */}
      <nav className="navbar">
        <div className="container d-flex justify-content-between align-items-center">
          <Link className="navbar-brand fw-bold text-decoration-none" to="/">
            <i className="fas fa-seedling me-2"></i>Kishan<span>Market</span>
          </Link>
          <div>
            <Link to="/login" className="btn-primary-dark text-decoration-none" style={{ padding: '8px 15px', fontSize: '0.9rem' }}>
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', paddingTop: '100px', paddingBottom: '50px' }}>
        <div className="glass-card-premium p-5 w-100" style={{ maxWidth: '500px', transformStyle: 'preserve-3d' }}>
          <div className="text-center mb-4" style={{ transform: 'translateZ(40px)' }}>
            <h2 className="section-title border-0 pb-0 mb-2" style={{ color: 'var(--primary)' }}>Create Account</h2>
            <p className="text-muted">Kisaan aur Vyapari ka Sahi Sangam</p>
          </div>

          <form id="registrationForm" onSubmit={handleSubmit} style={{ transform: 'translateZ(20px)' }}>
            <div className="mb-3">
              <label htmlFor="name" className="form-label fw-bold">
                <i className="fas fa-user me-2" style={{ color: 'var(--accent)' }}></i>Aapka Naam
              </label>
              <input type="text" id="name" name="name" className="form-control custom-input input-premium" placeholder="Poora Naam" required autoComplete="off" value={formData.name} onChange={handleChange} />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">
                <i className="fas fa-id-badge me-2" style={{ color: 'var(--accent)' }}></i>Aap Kaun Hain?
              </label>
              <div className="role-toggle d-flex gap-3 mt-2">
                <label className="w-100">
                  <input type="radio" name="role" value="seller" required checked={formData.role === 'seller'} onChange={handleChange} />
                  <div className="role-btn h-100">
                    <i className="fas fa-tractor"></i>
                    <span>Kisaan</span>
                    <small>(Seller)</small>
                  </div>
                </label>
                <label className="w-100">
                  <input type="radio" name="role" value="buyer" required checked={formData.role === 'buyer'} onChange={handleChange} />
                  <div className="role-btn h-100">
                    <i className="fas fa-shopping-basket"></i>
                    <span>Vyapari</span>
                    <small>(Buyer)</small>
                  </div>
                </label>
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="location" className="form-label fw-bold">
                <i className="fas fa-map-marker-alt me-2" style={{ color: 'var(--accent)' }}></i>Location / Mandi
              </label>
              <div className="position-relative">
                <input type="text" id="location" name="location" className="form-control custom-input input-premium" placeholder="e.g. Karnal, Haryana" required autoComplete="off" value={formData.location} onChange={handleChange} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} />
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="list-group position-absolute w-100 shadow" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                    {suggestions.map((s, idx) => (
                      <li key={idx} className="list-group-item list-group-item-action" style={{ cursor: 'pointer' }} onMouseDown={() => handleSelectLocation(s)}>
                        {s.name}{s.admin1 ? `, ${s.admin1}` : ''} <small className="text-muted">({s.country})</small>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="mobile" className="form-label fw-bold">
                <i className="fas fa-mobile-alt me-2" style={{ color: 'var(--accent)' }}></i>Mobile Number
              </label>
              <input type="tel" id="mobile" name="mobile" className="form-control custom-input input-premium" placeholder="10 Digit Number" required maxLength="10" value={formData.mobile} onChange={handleChange} />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label fw-bold">
                <i className="fas fa-lock me-2" style={{ color: 'var(--accent)' }}></i>Password
              </label>
              <input type="password" id="password" name="password" className="form-control custom-input input-premium" placeholder="Create Password (min 6 chars)" required value={formData.password} onChange={handleChange} />
            </div>

            <div className="mb-4">
              <label htmlFor="confirmPassword" className="form-label fw-bold">
                <i className="fas fa-check-circle me-2" style={{ color: 'var(--accent)' }}></i>Confirm Password
              </label>
              <input type="password" id="confirmPassword" name="confirmPassword" className="form-control custom-input input-premium" placeholder="Re-enter Password" required value={formData.confirmPassword} onChange={handleChange} />
            </div>

            <div className="mb-4 form-check d-flex align-items-center gap-2">
              <input type="checkbox" className="form-check-input" id="termsAccepted" name="termsAccepted" required checked={formData.termsAccepted} onChange={handleChange} style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }} />
              <label className="form-check-label small text-muted" htmlFor="termsAccepted" style={{ cursor: 'pointer' }}>
                I agree to the <a href="#" className="text-success text-decoration-none fw-bold">Terms & Conditions</a> and <a href="#" className="text-success text-decoration-none fw-bold">Privacy Policy</a>
              </label>
            </div>

            <button type="submit" className="btn-primary-dark w-100 btn-premium-hover fw-bold py-2" style={{ transform: 'translateZ(30px)' }}>
              Join KishanMarket <i className="fas fa-arrow-right ms-2"></i>
            </button>

            <div className="text-center mt-4" style={{ transform: 'translateZ(10px)' }}>
              <div className="trust-badges d-flex justify-content-center gap-4 text-muted" style={{ fontSize: '0.8rem' }}>
                <span><i className="fas fa-shield-alt text-success me-1"></i>Secure</span>
                <span><i className="fas fa-lock text-success me-1"></i>Private</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default RegistrationPage;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../assets/global.css';
import '../assets/dynamic-features.css';
import '../assets/login-style.css';

const LoginPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        loginPhone: '',
        loginPassword: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const inputPhone = formData.loginPhone.trim();
        const inputPassword = formData.loginPassword;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile: inputPhone, password: inputPassword })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                toast.error(data.error || "Invalid credentials. Please check your phone and password.");
                return;
            }

            const foundUser = data.user;
            sessionStorage.setItem('isAuthenticated', 'true');
            sessionStorage.setItem('currentUser', JSON.stringify(foundUser));
            localStorage.setItem('displayUserName', foundUser.name);
            localStorage.setItem('currentUser', JSON.stringify(foundUser));
            if (data.token) {
              localStorage.setItem('token', data.token);
              sessionStorage.setItem('token', data.token);
            }

            if (data.adminToken || foundUser.role === 'admin') {
              sessionStorage.setItem('adminToken', data.adminToken || 'KM_ADMIN_AUTHORIZED_TOKEN_2026');
            }

            toast.success(`Welcome back, ${foundUser.name}!`);
            if (foundUser.role === 'admin') {
                navigate('/admin');
            } else if (foundUser.role === 'seller') {
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
            <nav className="navbar" style={{ position: 'fixed', top: 0, width: '100%', zIndex: 1000, padding: '20px 30px', background: 'rgba(27, 67, 50, 0.95)', backdropFilter: 'blur(10px)' }}>
                <div className="container-fluid d-flex justify-content-between align-items-center px-4">
                    <Link className="navbar-brand fw-bold text-decoration-none text-white fs-4" to="/">
                        <i className="fas fa-seedling me-2 text-warning"></i>Kishan<span style={{ color: '#f59e0b' }}>Market</span>
                    </Link>
                    <div>
                        <Link to="/register" className="btn text-white fw-bold px-4 py-2" style={{ background: '#52b788', borderRadius: '10px', fontSize: '0.9rem' }}>
                            Sign Up
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Container */}
            <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', paddingTop: '100px', paddingBottom: '50px' }}>
                <div className="glass-card-premium p-5 w-100" style={{ maxWidth: '450px', background: 'rgba(255,255,255,0.95)', borderRadius: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}>
                    <div className="text-center mb-4">
                        <h2 className="fw-bold mb-2" style={{ color: '#1b4332' }}>Welcome Back</h2>
                        <p className="text-muted small">Login to your account</p>
                    </div>

                    <form id="loginForm" onSubmit={handleLogin}>
                        <div className="mb-3">
                            <label htmlFor="loginPhone" className="form-label fw-bold text-secondary small">
                                <i className="fas fa-mobile-alt me-2 text-success"></i>Mobile Number
                            </label>
                            <input type="tel" id="loginPhone" className="form-control p-3 border-2" style={{ borderRadius: '12px' }} placeholder="10 Digit Number" required maxLength="10" value={formData.loginPhone} onChange={handleChange} />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="loginPassword" className="form-label fw-bold text-secondary small">
                                <i className="fas fa-lock me-2 text-success"></i>Password
                            </label>
                            <input type="password" id="loginPassword" className="form-control p-3 border-2" style={{ borderRadius: '12px' }} placeholder="Enter Password" required value={formData.loginPassword} onChange={handleChange} />
                        </div>

                        <button type="submit" className="btn w-100 text-white fw-bold py-3 shadow" style={{ background: '#1b4332', borderRadius: '12px', fontSize: '1rem' }}>
                            Login <i className="fas fa-arrow-right ms-2"></i>
                        </button>

                        <div className="text-center mt-4">
                            <div className="trust-badges d-flex justify-content-center gap-4 text-muted small">
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

export default LoginPage;

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

    const handleLogin = (e) => {
        e.preventDefault();
        const inputPhone = formData.loginPhone.trim();
        const inputPassword = formData.loginPassword;

        // Database se users list nikalna
        const users = JSON.parse(localStorage.getItem('kishanUsers')) || [];

        // User ko mobile number aur password se dhoondna
        const foundUser = users.find(u => u.mobile === inputPhone && u.password === inputPassword);

        if (foundUser) {
            localStorage.setItem('displayUserName', foundUser.name);
            localStorage.setItem('currentUser', JSON.stringify(foundUser));
            toast.success(`Welcome back, ${foundUser.name}!`);

            if (foundUser.role === "seller") {
                navigate('/seller');
            } else {
                navigate('/buyer');
            }
        } else {
            toast.error("Invalid credentials. Please try again or create an account.");
        }
    };

    return (
        <>
            
            {/* Fixed Premium Navbar */}
            <nav className="navbar" style={{ position: 'fixed', top: 0, width: '100%', zIndex: 1000 }}>
                <div className="container d-flex justify-content-between align-items-center">
                    <Link className="navbar-brand fw-bold text-decoration-none" to="/">
                        <i className="fas fa-seedling me-2"></i>Kishan<span>Market</span>
                    </Link>
                    <div>
                        <Link to="/register" className="btn-primary-dark text-decoration-none" style={{ padding: '8px 15px', fontSize: '0.9rem' }}>
                            Sign Up
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Container */}
            <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', paddingTop: '100px', paddingBottom: '50px' }}>
                <div className="glass-card-premium p-5 w-100" style={{ maxWidth: '450px', transformStyle: 'preserve-3d' }}>
                    <div className="text-center mb-4" style={{ transform: 'translateZ(40px)' }}>
                        <h2 className="section-title border-0 pb-0 mb-2" style={{ color: 'var(--primary)' }}>Welcome Back</h2>
                        <p className="text-muted">Login to your account</p>
                    </div>

                    <form id="loginForm" onSubmit={handleLogin} style={{ transform: 'translateZ(20px)' }}>
                        <div className="mb-3">
                            <label htmlFor="loginPhone" className="form-label fw-bold">
                                <i className="fas fa-mobile-alt me-2" style={{ color: 'var(--accent)' }}></i>Mobile Number
                            </label>
                            <input type="tel" id="loginPhone" className="form-control custom-input input-premium" placeholder="10 Digit Number" required maxLength="10" value={formData.loginPhone} onChange={handleChange} />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="loginPassword" className="form-label fw-bold">
                                <i className="fas fa-lock me-2" style={{ color: 'var(--accent)' }}></i>Password
                            </label>
                            <input type="password" id="loginPassword" className="form-control custom-input input-premium" placeholder="Enter Password" required value={formData.loginPassword} onChange={handleChange} />
                        </div>

                        <button type="submit" className="btn-primary-dark w-100 btn-premium-hover fw-bold py-2" style={{ transform: 'translateZ(30px)' }}>
                            Login <i className="fas fa-arrow-right ms-2"></i>
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

export default LoginPage;

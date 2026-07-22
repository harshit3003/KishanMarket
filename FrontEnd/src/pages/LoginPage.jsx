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
            
            if (response.ok && data.user) {
                const foundUser = data.user;
                localStorage.setItem('displayUserName', foundUser.name);
                localStorage.setItem('currentUser', JSON.stringify(foundUser));
                
                // Keep local device accounts list updated
                const localUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
                const updatedUsers = [...localUsers.filter(u => u.mobile !== foundUser.mobile), foundUser];
                localStorage.setItem('registered_users', JSON.stringify(updatedUsers));

                toast.success(`Welcome back, ${foundUser.name}!`);
                if (foundUser.role === "seller") {
                    navigate('/seller');
                } else {
                    navigate('/buyer');
                }
                return;
            }
        } catch (err) {
            console.log("Server login error, attempting local device account match...");
        }

        // Fallback: Check local device registered accounts (handles server restarts & offline tab logins)
        const localUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
        const matchedLocalUser = localUsers.find(u => u.mobile === inputPhone && u.password === inputPassword);

        if (matchedLocalUser) {
            const userObj = {
                name: matchedLocalUser.name,
                mobile: matchedLocalUser.mobile,
                role: matchedLocalUser.role,
                location: matchedLocalUser.location || ''
            };
            localStorage.setItem('displayUserName', userObj.name);
            localStorage.setItem('currentUser', JSON.stringify(userObj));
            
            // Re-sync user back to backend database in background
            fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: matchedLocalUser.name,
                    mobile: matchedLocalUser.mobile,
                    location: matchedLocalUser.location || '',
                    role: matchedLocalUser.role,
                    password: matchedLocalUser.password
                })
            }).catch(() => {});

            toast.success(`Welcome back, ${userObj.name}!`);
            if (userObj.role === "seller") {
                navigate('/seller');
            } else {
                navigate('/buyer');
            }
        } else {
            toast.error("Invalid mobile number or password. Please try again or create an account.");
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

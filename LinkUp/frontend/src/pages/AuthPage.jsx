import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Image as ImageIcon, CreditCard, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';
import './Auth.css';

const authSlides = [
  {
    title: "Plan Together.",
    desc: "Create isolated digital environments for your groups. A space acts as a central hub where only invited members can interact.",
    icon: <Users size={80} style={{ color: 'white', opacity: 0.9 }} />
  },
  {
    title: "Share Memories.",
    desc: "Stop asking 'Can you send me those pictures?' The Shared Gallery allows every member to upload high-quality photos.",
    icon: <ImageIcon size={80} style={{ color: 'white', opacity: 0.9 }} />
  },
  {
    title: "Split Expenses.",
    desc: "Money shouldn't ruin a good trip. Our built-in expense tracker allows anyone to log an expense effortlessly.",
    icon: <CreditCard size={80} style={{ color: 'white', opacity: 0.9 }} />
  }
];

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % authSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin 
      ? { email: formData.email, password: formData.password }
      : { username: formData.username, email: formData.email, password: formData.password };

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('gatherly_token', data.token);
        localStorage.setItem('gatherly_user', JSON.stringify(data));
        // Redirect back to invite link if user came from one
        const inviteRedirect = sessionStorage.getItem('invite_redirect');
        if (inviteRedirect) {
          sessionStorage.removeItem('invite_redirect');
          navigate(inviteRedirect);
        } else {
          navigate('/userdashboard');
        }
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-sidebar">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        
        <div>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            <svg
              width={48}
              height={48}
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="30" cy="25" r="12" fill="white" />
              <circle cx="70" cy="25" r="12" fill="rgba(255,255,255,0.6)" />
              <path
                d="M 30 45 C 5 45, 5 85, 30 85 C 55 85, 45 45, 70 45 C 95 45, 95 85, 70 85 C 45 85, 55 45, 30 45 Z"
                stroke="white"
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.04em' }}>
              Gatherly
            </span>
          </Link>
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              style={{ position: 'absolute' }}
            >
              <div style={{ marginBottom: '2rem' }}>
                {authSlides[currentSlide].icon}
              </div>
              <h1 style={{ color: 'white', fontSize: '3.5rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.1 }}>
                {authSlides[currentSlide].title}
              </h1>
              <p style={{ color: 'white', fontSize: '1.25rem', opacity: 0.9, maxWidth: '450px', lineHeight: 1.6 }}>
                {authSlides[currentSlide].desc}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      <div className="auth-main">
        <div className="auth-container">
          <div className="auth-header">
            <h2>{isLogin ? 'Sign In' : 'Create Account'}</h2>
            <p>{isLogin ? 'Access your active spaces and groups.' : 'Start organizing your events beautifully.'}</p>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label>Username</label>
                <input type="text" name="username" value={formData.username} onChange={handleChange} required placeholder="e.g. alexander" />
              </div>
            )}
            
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="you@example.com" />
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                  placeholder="••••••••" 
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          
          <div className="auth-switch">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button type="button" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

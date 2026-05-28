import React, { useState, useEffect } from 'react';
import { User, Settings, Bell, Lock, Camera, Check, Shield, Globe } from 'lucide-react';
import './UserProfile.css';

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    phone: '',
    website: '',
    gender: 'Prefer not to say',
    profilePicture: '',
    language: 'English',
    country: 'India',
    profileVisibility: 'Public',
    statusMessage: '',
    theme: 'light',
    twoFactorEnabled: false,
    loginAlerts: true,
    emailNotifications: true,
    pushNotifications: true,
    workspaceUpdates: true,
    mentionAlerts: true
  });

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Load user from local storage
    const storedUserStr = localStorage.getItem('gatherly_user');
    if (storedUserStr) {
      try {
        const storedUser = JSON.parse(storedUserStr);
        setCurrentUser(storedUser);
        setFormData({
          username: storedUser.username || '',
          email: storedUser.email || '',
          bio: storedUser.bio || '',
          phone: storedUser.phone || '',
          website: storedUser.website || '',
          gender: storedUser.gender || 'Prefer not to say',
          profilePicture: storedUser.profilePicture || '',
          language: storedUser.language || 'English',
          country: storedUser.country || 'India',
          profileVisibility: storedUser.profileVisibility || 'Public',
          statusMessage: storedUser.statusMessage || '',
          theme: localStorage.getItem('gatherly_theme') || storedUser.theme || 'light',
          twoFactorEnabled: storedUser.twoFactorEnabled || false,
          loginAlerts: storedUser.loginAlerts !== undefined ? storedUser.loginAlerts : true,
          emailNotifications: storedUser.emailNotifications !== undefined ? storedUser.emailNotifications : true,
          pushNotifications: storedUser.pushNotifications !== undefined ? storedUser.pushNotifications : true,
          workspaceUpdates: storedUser.workspaceUpdates !== undefined ? storedUser.workspaceUpdates : true,
          mentionAlerts: storedUser.mentionAlerts !== undefined ? storedUser.mentionAlerts : true
        });
      } catch (err) {
        console.error("Error parsing user from localStorage", err);
      }
    }

    const syncTheme = () => {
      const currentTheme = localStorage.getItem('gatherly_theme') || 'light';
      setFormData(prev => ({...prev, theme: currentTheme}));
    };
    window.addEventListener('theme-sync', syncTheme);
    
    return () => {
      window.removeEventListener('theme-sync', syncTheme);
    };
  }, []);

  const handleChange = async (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    const name = e.target.name;
    
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      return updated;
    });

    // Instant local UI updates for theme
    if (name === 'theme') {
      const selectedTheme = value === 'system' ? 'light' : value;
      document.documentElement.setAttribute('data-theme', selectedTheme);
      localStorage.setItem('gatherly_theme', selectedTheme);
      window.dispatchEvent(new Event('theme-sync'));
    }

    // Google Translate auto-translation
    if (name === 'language') {
      let code = 'en';
      if (value === 'Kannada') code = 'kn';
      else if (value === 'Hindi') code = 'hi';
      else if (value === 'Telugu') code = 'te';
      
      document.cookie = `googtrans=/en/${code}; path=/`;
      document.cookie = `googtrans=/en/${code}; domain=.${document.domain}; path=/`;
      
      // We must reload for google translate script to catch it
      setTimeout(() => {
        window.location.reload();
      }, 300);
    }

    // Auto-save for toggles and radios (preventing auto-save on text inputs to avoid keystroke spam)
    if (e.target.type === 'checkbox' || e.target.type === 'radio' || e.target.tagName === 'SELECT') {
      // Small timeout to let state update, then save
      setTimeout(() => {
         document.getElementById('hidden-save-btn')?.click();
      }, 100);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);
    setSuccess(false);

    try {
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({
          id: currentUser._id,
          ...formData
        })
      });

      let data;
      const text = await response.text();
      try { 
        data = JSON.parse(text); 
      } catch(e) { 
        throw new Error(response.status === 413 ? "Image too large! Please try a smaller image." : "Server returned an invalid response. Is the backend running correctly?"); 
      }

      if (response.ok) {
        // Update local storage
        localStorage.setItem('gatherly_user', JSON.stringify({
          ...currentUser,
          ...data
        }));
        setCurrentUser({ ...currentUser, ...data });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        
        // Dispatch event for live theme update
        window.dispatchEvent(new Event('user-theme-changed'));
      } else {
        alert(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving profile: ' + err.message + '\nMake sure your backend server is running on port 5000!');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => {
          const updated = { ...prev, profilePicture: reader.result };
          setTimeout(() => document.getElementById('hidden-save-btn')?.click(), 150);
          return updated;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    document.getElementById('avatar-upload-input').click();
  };

  return (
    <div className="profile-page-wrapper">
      <div className="profile-container">
        
        {/* SIDEBAR */}
        <div className="profile-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-avatar">
              <img 
                src={formData.profilePicture || `https://ui-avatars.com/api/?name=${formData.username || 'User'}&background=0D8ABC&color=fff`} 
                alt="Profile" 
              />
            </div>
            <h3>{formData.username || 'User'}</h3>
            <span className="sidebar-role">{currentUser?.role || 'Member'}</span>
          </div>

          <nav className="sidebar-nav">
            <button 
              className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={18} /> Edit Profile
            </button>
            <button 
              className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={18} /> Account Settings
            </button>
            <button 
              className={`nav-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Shield size={18} /> Security & Privacy
            </button>
            <button 
              className={`nav-btn ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <Bell size={18} /> Notifications
            </button>
          </nav>
        </div>

        {/* CONTENT AREA */}
        <div className="profile-content">
          
          {activeTab === 'profile' && (
            <div className="content-section-anim">
              <div className="content-header">
                <h2>Edit Profile</h2>
                <p>Manage your personal information and how you appear to others.</p>
              </div>

              <div className="avatar-edit-section">
                <div className="avatar-large">
                  <img 
                    src={formData.profilePicture || `https://ui-avatars.com/api/?name=${formData.username || 'User'}&background=0D8ABC&color=fff`} 
                    alt="Profile" 
                  />
                  <input 
                    type="file" 
                    id="avatar-upload-input" 
                    accept="image/*" 
                    style={{display: 'none'}} 
                    onChange={handleAvatarChange} 
                  />
                  <button className="change-avatar-btn" onClick={triggerFileInput} type="button">
                    <Camera size={16} />
                  </button>
                </div>
                <div className="avatar-text">
                  <h3>Profile Picture</h3>
                  <p>A picture helps people recognize you and lets you know when you're signed in to your account.</p>
                </div>
              </div>

              <form className="profile-form" onSubmit={handleSubmit}>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Username</label>
                    <input 
                      type="text" 
                      name="username"
                      value={formData.username} 
                      onChange={handleChange}
                      placeholder="e.g. johndoe"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email} 
                      onChange={handleChange}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Bio</label>
                  <textarea 
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Write a little bit about yourself..."
                    rows="3"
                  ></textarea>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input 
                      type="tel" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div className="form-group">
                    <label>Website</label>
                    <div className="input-with-icon">
                      <Globe size={16} className="input-icon" />
                      <input 
                        type="url" 
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://yoursite.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Custom">Custom</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div className="form-actions">
                  {success && <span className="success-msg"><Check size={16} /> Profile updated successfully!</span>}
                  <button type="submit" id="hidden-save-btn" className="save-btn" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>

              </form>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="content-section-anim">
              <div className="content-header">
                <h2>Account Settings</h2>
                <p>Customize your experience, region settings, and account visibility.</p>
              </div>

              <form className="profile-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Current Status</label>
                  <input 
                    type="text" 
                    name="statusMessage"
                    value={formData.statusMessage} 
                    onChange={handleChange}
                    placeholder="e.g. Working remotely, In a meeting..."
                  />
                  <small style={{color: 'var(--text-gray)', fontSize: '0.8rem', marginTop: '4px'}}>This will be shown on your profile and to your team members.</small>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Language</label>
                    <select name="language" value={formData.language} onChange={handleChange}>
                      <option value="English">English</option>
                      <option value="Kannada">Kannada</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Telugu">Telugu</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Country/Region</label>
                    <select name="country" value={formData.country} onChange={handleChange}>
                      <option value="India">India</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="Singapore">Singapore</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{marginTop: '1rem'}}>
                  <label>Profile Visibility</label>
                  <div className="radio-group" style={{display: 'flex', gap: '1rem', marginTop: '0.5rem'}}>
                    {['Public', 'Team Only', 'Private'].map((opt) => (
                      <label key={opt} style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'var(--bg-main)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-light)', flex: 1}}>
                        <input 
                          type="radio" 
                          name="profileVisibility" 
                          value={opt}
                          checked={formData.profileVisibility === opt}
                          onChange={handleChange}
                          style={{accentColor: 'var(--primary-blue)', transform: 'scale(1.2)'}}
                        />
                        <span style={{fontWeight: 600, color: 'var(--text-dark)'}}>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{marginTop: '1rem'}}>
                  <label>Theme Preference</label>
                  <div className="radio-group" style={{display: 'flex', gap: '1rem', marginTop: '0.5rem'}}>
                    {['light', 'dark', 'system'].map((opt) => (
                      <label key={opt} style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'var(--bg-main)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-light)', flex: 1}}>
                        <input 
                          type="radio" 
                          name="theme" 
                          value={opt}
                          checked={formData.theme === opt}
                          onChange={handleChange}
                          style={{accentColor: 'var(--primary-blue)', transform: 'scale(1.2)'}}
                        />
                        <span style={{fontWeight: 600, color: 'var(--text-dark)', textTransform: 'capitalize'}}>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-actions">
                  {success && <span className="success-msg"><Check size={16} /> Settings saved!</span>}
                  <button type="submit" id="hidden-save-btn" className="save-btn" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="content-section-anim">
              <div className="content-header">
                <h2>Security & Privacy</h2>
                <p>Manage your account security and who can see your information.</p>
              </div>

              <form className="profile-form" onSubmit={handleSubmit}>
                <div className="settings-group">
                  <div className="setting-row">
                    <div className="setting-info">
                      <h4>Two-Factor Authentication (2FA)</h4>
                      <p>Add an extra layer of security to your account.</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" name="twoFactorEnabled" checked={formData.twoFactorEnabled} onChange={handleChange} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  
                  <div className="setting-row">
                    <div className="setting-info">
                      <h4>Login Alerts</h4>
                      <p>Get notified when anyone logs into your account from an unrecognized device.</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" name="loginAlerts" checked={formData.loginAlerts} onChange={handleChange} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="settings-group" style={{marginTop: '2rem'}}>
                  <div className="setting-row" style={{flexDirection: 'column', alignItems: 'flex-start', gap: '1rem'}}>
                    <div className="setting-info">
                      <h4>Change Password</h4>
                      <p>Update your password to keep your account secure.</p>
                    </div>
                    <div className="form-row" style={{width: '100%'}}>
                      <div className="form-group">
                        <label>New Password</label>
                        <input type="password" placeholder="Enter new password" />
                      </div>
                      <div className="form-group">
                        <label>Confirm Password</label>
                        <input type="password" placeholder="Confirm new password" />
                      </div>
                    </div>
                    <button type="button" className="btn-block-outline" style={{padding: '0.5rem 1rem', display: 'block', width: 'auto', border: '1px solid var(--primary-blue)', color: 'var(--primary-blue)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontWeight: 600}}>Update Password</button>
                  </div>
                </div>

                <div className="settings-group" style={{marginTop: '2rem', borderColor: '#fca5a5'}}>
                  <div className="setting-row">
                    <div className="setting-info">
                      <h4 style={{color: '#ef4444'}}>Danger Zone</h4>
                      <p>Permanently delete your account and all associated data.</p>
                    </div>
                    <button type="button" style={{padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600}} onClick={() => alert('Account deletion would require secondary confirmation.')}>Delete Account</button>
                  </div>
                </div>

                <div className="form-actions">
                  {success && <span className="success-msg"><Check size={16} /> Security settings saved!</span>}
                  <button type="submit" id="hidden-save-btn" className="save-btn" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="content-section-anim">
              <div className="content-header">
                <h2>Notifications</h2>
                <p>Choose how you want to be notified about activity in LinkUp.</p>
              </div>

              <form className="profile-form" onSubmit={handleSubmit}>
                <div className="settings-group">
                  <div className="setting-row">
                    <div className="setting-info">
                      <h4>Email Notifications</h4>
                      <p>Receive daily summaries and important alerts via email.</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" name="emailNotifications" checked={formData.emailNotifications} onChange={handleChange} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  
                  <div className="setting-row">
                    <div className="setting-info">
                      <h4>Push Notifications</h4>
                      <p>Get immediate desktop or mobile push notifications.</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" name="pushNotifications" checked={formData.pushNotifications} onChange={handleChange} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="setting-row">
                    <div className="setting-info">
                      <h4>Workspace Updates</h4>
                      <p>Get notified when tasks are completed or files are uploaded.</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" name="workspaceUpdates" checked={formData.workspaceUpdates} onChange={handleChange} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="setting-row">
                    <div className="setting-info">
                      <h4>Mentions & Replies</h4>
                      <p>Get notified when someone mentions you in a chat.</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" name="mentionAlerts" checked={formData.mentionAlerts} onChange={handleChange} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  {success && <span className="success-msg"><Check size={16} /> Notification settings saved!</span>}
                  <button type="submit" id="hidden-save-btn" className="save-btn" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default UserProfile;

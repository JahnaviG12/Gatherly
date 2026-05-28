import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Image as ImageIcon, Bell, Trash2, CheckCircle2, MessageSquare, ArrowLeft, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'task', 'activity'
  const navigate = useNavigate();

  useEffect(() => {
    const loadNotifs = () => {
      const notifs = JSON.parse(localStorage.getItem('gatherly_notifications') || '[]');
      setNotifications(notifs);
    };
    loadNotifs();
    
    window.addEventListener('notifications_updated', loadNotifs);
    return () => window.removeEventListener('notifications_updated', loadNotifs);
  }, []);

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, unread: false }));
    setNotifications(updated);
    localStorage.setItem('gatherly_notifications', JSON.stringify(updated));
    
    const readIds = JSON.parse(localStorage.getItem('gatherly_read_notifs') || '[]');
    notifications.forEach(n => {
      if (!readIds.includes(n.id)) readIds.push(n.id);
    });
    localStorage.setItem('gatherly_read_notifs', JSON.stringify(readIds));
    
    window.dispatchEvent(new Event('notifications_updated'));
  };

  const markAsRead = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, unread: false } : n);
    setNotifications(updated);
    localStorage.setItem('gatherly_notifications', JSON.stringify(updated));
    
    const readIds = JSON.parse(localStorage.getItem('gatherly_read_notifs') || '[]');
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem('gatherly_read_notifs', JSON.stringify(readIds));
    }
    
    window.dispatchEvent(new Event('notifications_updated'));
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.setItem('gatherly_notifications', JSON.stringify([]));
    window.dispatchEvent(new Event('notifications_updated'));
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'unread') return n.unread;
    if (filter === 'task') return n.type === 'task';
    if (filter === 'activity') return n.type === 'activity';
    if (filter === 'chat') return n.type === 'chat';
    return true;
  });

  return (
    <div className="notifications-page">
      <motion.button 
        className="modern-exit-fab"
        onClick={() => navigate('/userdashboard')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Return to Dashboard"
      >
        <LogOut size={24} />
      </motion.button>

      <div className="notif-page-header">
        <h1>All Notifications</h1>
        <div className="notif-actions">
          <button onClick={markAllRead} className="btn-notif-secondary">
            <CheckCircle2 size={16} /> Mark all read
          </button>
          <button onClick={clearAll} className="btn-notif-danger">
            <Trash2 size={16} /> Clear all
          </button>
        </div>
      </div>

      <div className="notif-filters">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
        <button className={filter === 'unread' ? 'active' : ''} onClick={() => setFilter('unread')}>Unread</button>
        <button className={filter === 'task' ? 'active' : ''} onClick={() => setFilter('task')}>Tasks</button>
        <button className={filter === 'activity' ? 'active' : ''} onClick={() => setFilter('activity')}>Activity</button>
        <button className={filter === 'chat' ? 'active' : ''} onClick={() => setFilter('chat')}>Chats</button>
      </div>

      <div className="notif-list-page">
        {filteredNotifs.length === 0 ? (
          <div className="empty-notifs">No notifications found.</div>
        ) : (
          filteredNotifs.map(n => (
            <div key={n.id} className={`notif-card ${n.unread ? 'unread' : ''}`} onClick={() => markAsRead(n.id)} style={{ cursor: 'pointer' }}>
              <div className={`notif-icon-large ${n.type}`}>
                {n.type === 'task' && <CheckSquare size={20} />}
                {n.type === 'activity' && <ImageIcon size={20} />}
                {n.type === 'system' && <Bell size={20} />}
                {n.type === 'chat' && <MessageSquare size={20} />}
                {(!n.type || !['task', 'activity', 'system', 'chat'].includes(n.type)) && <Bell size={20} />}
              </div>
              <div className="notif-content-large">
                <p><strong>{n.user || 'System'}</strong> {n.text}</p>
                <span className="time">{n.time}</span>
              </div>
              {n.unread && <div className="unread-dot-large"></div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;

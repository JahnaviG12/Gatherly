import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { History, ArrowLeft, Archive, CheckCircle, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import './HistoryPage.css';

const HistoryPage = () => {
  const [historySpaces, setHistorySpaces] = useState([]);
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [activeWorkspace, setActiveWorkspace] = useState(null);

  // Determine workspace context from URL params or localStorage
  useEffect(() => {
    if (workspaceId) {
      try {
        const allWorkspaces = JSON.parse(localStorage.getItem('gatherly_workspaces') || '[]');
        const foundWorkspace = allWorkspaces.find(ws => {
          const wsId = ws._id || ws.id;
          const wsIdStr = typeof wsId === 'object' ? (wsId.$oid || String(wsId)) : String(wsId || '');
          return wsIdStr === workspaceId;
        });
        if (foundWorkspace) {
          setActiveWorkspace(foundWorkspace);
          localStorage.setItem('gatherly_active_workspace', JSON.stringify(foundWorkspace));
        }
      } catch (e) {}
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem('gatherly_active_workspace'));
        setActiveWorkspace(saved);
      } catch (e) {}
    }
  }, [workspaceId]);

  useEffect(() => {
    // Attempt to load from localStorage first
    const savedSpaces = JSON.parse(localStorage.getItem('gatherly_workspaces') || '[]');
    
    // Filter completed or archived workspaces
    const completed = savedSpaces.filter(space => 
      space.status === 'completed' || space.isArchived === true || space.progress >= 100
    );
    
    // Fetch from backend
    fetch('http://localhost:5000/api/spaces')
      .then(res => res.json())
      .then(data => {
        const backendCompleted = data.filter(space => 
          space.status === 'completed' || space.isArchived === true || space.progress >= 100
        );
        setHistorySpaces(backendCompleted.length > 0 ? backendCompleted : completed);
      })
      .catch(err => {
        setHistorySpaces(completed);
      });
  }, []);

  const handleOpenWorkspace = (workspace) => {
    localStorage.setItem('gatherly_active_workspace', JSON.stringify(workspace));
    window.dispatchEvent(new Event('active_workspace_changed'));
    navigate(`/workspace/${workspace._id || workspace.id}`);
  };

  return (
    <div className="history-page">
      <motion.button 
        className="modern-exit-fab"
        onClick={() => navigate('/userdashboard')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Return to Dashboard"
      >
        <LogOut size={24} />
      </motion.button>

      <div className="history-header">
        <h1>Workspace History</h1>
        <p>View all your completed and archived spaces.</p>
      </div>

      <div className="history-grid">
        {historySpaces.length === 0 ? (
          <div className="empty-history">
            <Archive size={48} className="empty-icon" />
            <h3>No history yet</h3>
            <p>When you complete or archive a workspace, it will appear here.</p>
          </div>
        ) : (
          historySpaces.map(space => (
            <div 
              key={space._id || space.id} 
              className="history-card"
              onClick={() => handleOpenWorkspace(space)}
              style={{ cursor: 'pointer' }}
            >
              <div 
                className="history-cover" 
                style={{ backgroundImage: `url(${space.cover || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80'})` }}
              >
                <div className="history-status-badge">
                  <CheckCircle size={14} /> Completed
                </div>
              </div>
              <div className="history-details">
                <h3>{space.name}</h3>
                <p>{space.description || 'No description provided.'}</p>
                <div className="history-meta">
                  <span>Completed on: {new Date(space.updatedAt || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryPage;

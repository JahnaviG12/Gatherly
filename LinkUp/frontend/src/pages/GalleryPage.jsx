import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  Heart,
  MessageCircle,
  Share2,
  Download,
  X,
  Plus,
  MoreHorizontal,
  UploadCloud,
  Image as ImageIcon,
  Lock,
  Search,
  Grid3X3,
  LayoutGrid,
  Sparkles,
  Bookmark,
  Send,
  LogOut,
  Trash2,
  ArrowLeft
} from 'lucide-react';

import './GalleryPage.css';

const GalleryPage = () => {

  const { searchQuery } = useOutletContext();
  const navigate = useNavigate();
  const { workspaceId } = useParams();

  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [galleryData, setGalleryData] = useState([]);
  const [viewMode, setViewMode] = useState('masonry');
  const [commentInput, setCommentInput] = useState('');
  const [activeStoryAlbum, setActiveStoryAlbum] = useState(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [groupByMode, setGroupByMode] = useState('none'); // 'none', 'uploader', 'month'

  const fileInputRef = useRef(null);

  const [activeWorkspace, setActiveWorkspace] = useState(null);
  
  // Determine workspace context from URL params or localStorage
  useEffect(() => {
    if (workspaceId) {
      // Extract workspace from localStorage by ID
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
      // Fallback to active workspace from localStorage
      try {
        const saved = JSON.parse(localStorage.getItem('gatherly_active_workspace'));
        setActiveWorkspace(saved);
      } catch (e) {}
    }
  }, [workspaceId]);
  
  const [activeAlbum, setActiveAlbum] = useState(null);
  const [workspaceAlbums, setWorkspaceAlbums] = useState([]);

  const allWorkspaces = JSON.parse(
    localStorage.getItem('gatherly_workspaces') || '[]'
  );

  const currentUser = JSON.parse(
    localStorage.getItem('gatherly_user')
  );

  // Synchronize active workspace in real time across tabs and components
  useEffect(() => {
    const syncWorkspace = () => {
      try {
        const saved = localStorage.getItem('gatherly_active_workspace');
        setActiveWorkspace(saved ? JSON.parse(saved) : null);
      } catch (e) {
        setActiveWorkspace(null);
      }
    };

    window.addEventListener('active_workspace_changed', syncWorkspace);
    const handleStorage = (e) => {
      if (e.key === 'gatherly_active_workspace') syncWorkspace();
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('active_workspace_changed', syncWorkspace);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // ─── Socket.IO room join & events ──────────────────────────────────────────
  useEffect(() => {
    if (!activeWorkspace) return;
    const wId = activeWorkspace._id || activeWorkspace.id;
    const socket = io('http://localhost:5000');

    socket.emit('join_workspace', wId);

    // Listen for real-time gallery modifications
    socket.on('gallery_item_added', (item) => {
      setGalleryData(prev => prev.some(g => g._id === item._id) ? prev : [item, ...prev]);
    });

    socket.on('gallery_item_updated', (item) => {
      setGalleryData(prev => prev.map(g => g._id === item._id ? item : g));
      setSelectedMedia(prev => prev && prev._id === item._id ? item : prev);
    });

    socket.on('gallery_item_deleted', (itemId) => {
      setGalleryData(prev => prev.filter(g => g._id !== itemId && g.id !== itemId));
      setSelectedMedia(prev => prev && (prev._id === itemId || prev.id === itemId) ? null : prev);
    });

    return () => {
      socket.emit('leave_workspace', wId);
      socket.disconnect();
    };
  }, [activeWorkspace]);

  /* ========================================= */
  /* DB SYNC HELPER */
  /* ========================================= */

  const syncGalleryToDB = async (updatedGallery, updatedAlbums = null) => {
    if (!activeWorkspace) return;
    const workspaceId = activeWorkspace._id || activeWorkspace.id;

    // Persist albums array inside space document
    if (updatedAlbums) {
      try {
        await fetch(`http://localhost:5000/api/spaces/${workspaceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ albums: updatedAlbums })
        });
      } catch (e) {
        console.error('Failed to sync gallery albums to DB:', e);
      }
    }
  };

  /* ========================================= */
  /* LOAD GALLERY */
  /* ========================================= */

  useEffect(() => {
    if (!activeWorkspace) return;

    const workspaceId = activeWorkspace._id || activeWorkspace.id || 'default';
    const workspaceName = activeWorkspace.name || 'Workspace';

    // 1. Fetch space details to get albums array
    fetch(`http://localhost:5000/api/spaces/${workspaceId}`)
      .then(res => res.ok ? res.json() : null)
      .then(space => {
        if (space) {
          const dbAlbums = space.albums || [];
          if (dbAlbums.length === 0) {
            const defaultAlbums = [
              { id: 'a1', name: `${workspaceName} Media`, cover: `https://picsum.photos/seed/${workspaceId}-1/800/600`, items: 4 }
            ];
            setWorkspaceAlbums(defaultAlbums);
            syncGalleryToDB(null, defaultAlbums);
          } else {
            setWorkspaceAlbums(dbAlbums);
          }
        }
      })
      .catch(console.error);

    // 2. Fetch shared gallery items from the dedicated Gallery endpoint
    fetch(`http://localhost:5000/api/gallery/workspace/${workspaceId}`)
      .then(res => res.ok ? res.json() : [])
      .then(items => {
        if (items.length === 0) {
          // Seed initial shared images to DB so the team has content
          const defaultItems = [
            { workspaceId, albumId: 'a1', url: `https://picsum.photos/seed/${workspaceId}-1/800/600`, uploader: 'Alex', likes: 24, caption: 'Perfect sunset!' },
            { workspaceId, albumId: 'a1', url: `https://picsum.photos/seed/${workspaceId}-2/800/600`, uploader: 'Sarah', likes: 12, caption: 'Day 1 hiking squad' },
            { workspaceId, albumId: 'a1', url: `https://picsum.photos/seed/${workspaceId}-3/800/600`, uploader: 'Mike', likes: 42, caption: 'Team lunch!' }
          ];

          defaultItems.forEach(item => {
            fetch('http://localhost:5000/api/gallery', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item)
            }).catch(console.error);
          });
        } else {
          setGalleryData(items);
        }
      })
      .catch(err => {
        console.error('Failed to load gallery items from DB, falling back to local cache', err);
        const savedGallery = JSON.parse(localStorage.getItem(`gallery_${workspaceId}`)) || [];
        setGalleryData(savedGallery);
      });

  }, [activeWorkspace]);

  const uploadFile = (file) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64data = reader.result;
      const workspaceId = activeWorkspace?._id || activeWorkspace?.id;
      try {
        const res = await fetch('http://localhost:5000/api/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId,
            albumId: activeAlbum?.id || 'a1',
            url: base64data,
            uploader: currentUser?.username || 'User',
            avatar: `https://ui-avatars.com/api/?name=${currentUser?.username || 'User'}&background=random&color=fff`,
            type: file.type.includes('video') ? 'video' : 'photo',
            caption: file.name
          })
        });
        if (res.ok) {
          const newItem = await res.json();
          setGalleryData(prev => prev.some(g => g._id === newItem._id) ? prev : [newItem, ...prev]);
        }
      } catch (e) {
        console.error('Upload failed', e);
      }
    };
    reader.readAsDataURL(file);
  };

  /* ========================================= */
  /* DRAG DROP */
  /* ========================================= */

  useEffect(() => {

    const handleDragEnter = (e) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      setIsDragging(false);
    };

    const handleDragOver = (e) => {
      e.preventDefault();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (!files.length) return;
      files.forEach(uploadFile);
    };

    window.addEventListener(
      'dragenter',
      handleDragEnter
    );

    window.addEventListener(
      'dragleave',
      handleDragLeave
    );

    window.addEventListener(
      'dragover',
      handleDragOver
    );

    window.addEventListener(
      'drop',
      handleDrop
    );

    return () => {

      window.removeEventListener(
        'dragenter',
        handleDragEnter
      );

      window.removeEventListener(
        'dragleave',
        handleDragLeave
      );

      window.removeEventListener(
        'dragover',
        handleDragOver
      );

      window.removeEventListener(
        'drop',
        handleDrop
      );

    };

  }, [galleryData]);

  const storyItems = activeStoryAlbum ? galleryData.filter(item => item.albumId === activeStoryAlbum.id) : [];
  const currentStory = storyItems[storyIndex];

  useEffect(() => {
    if (activeStoryAlbum && currentStory) {
      const timer = setTimeout(() => {
        if (storyIndex < storyItems.length - 1) {
          setStoryIndex(storyIndex + 1);
        } else {
          setActiveStoryAlbum(null);
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activeStoryAlbum, storyIndex, storyItems.length]);

  /* ========================================= */
  /* ALBUMS VIEW (NO ACTIVE WORKSPACE) */
  /* ========================================= */

  if (!activeWorkspace) {
    const userWorkspaces = allWorkspaces.length > 0 ? allWorkspaces : [];

    return (
      <div className="gallery-empty-state" style={{flexDirection: 'column', padding: '3rem', alignItems: 'flex-start', justifyContent: 'flex-start', height: '100%', minHeight: '80vh', background: 'var(--bg-main)', color: 'var(--text-dark)', width: '100%'}}>
        
        <motion.button 
          className="modern-exit-fab"
          onClick={() => {
            if (workspaceId) {
              navigate(-1);
            } else {
              navigate('/userdashboard');
            }
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Return to Dashboard"
        >
          <LogOut size={24} />
        </motion.button>

        <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '2rem'}}>
          <h2 style={{fontSize: '2.5rem', margin: 0, fontWeight: 800, color: 'var(--text-dark)'}}>Your Workspace Albums</h2>
        </div>
        
        {userWorkspaces.length === 0 ? (
          <div className="gallery-empty-card" style={{margin: '0 auto', marginTop: '10%'}}>
            <ImageIcon size={40} color="#0ea5e9"/>
            <h2>No Albums Found</h2>
            <p>You haven't joined any workspaces yet.</p>
            <a href="/userdashboard">Go to Dashboard</a>
          </div>
        ) : (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2.5rem', width: '100%'}}>
            {userWorkspaces.map(ws => (
              <div key={ws.id || ws._id} onClick={() => { setActiveWorkspace(ws); localStorage.setItem('gatherly_active_workspace', JSON.stringify(ws)); window.dispatchEvent(new Event('active_workspace_changed')); }} style={{cursor: 'pointer', background: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', transition: 'transform 0.2s, box-shadow 0.2s', border: '1px solid var(--border-light)'}} onMouseOver={e => {e.currentTarget.style.transform='translateY(-8px)'; e.currentTarget.style.boxShadow='0 20px 40px rgba(0,0,0,0.1)';}} onMouseOut={e => {e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 10px 25px rgba(0,0,0,0.05)';}}>
                <div style={{display: 'flex', gap: '2px', height: '200px', overflow: 'hidden'}}>
                  <div style={{flex: 2, background: `url(https://picsum.photos/seed/${ws.id || ws._id}-1/800/600) center/cover`}}></div>
                  <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '2px'}}>
                    <div style={{flex: 1, background: `url(https://picsum.photos/seed/${ws.id || ws._id}-2/400/300) center/cover`}}></div>
                    <div style={{flex: 1, background: `url(https://picsum.photos/seed/${ws.id || ws._id}-3/400/300) center/cover`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      <div style={{background: 'rgba(0,0,0,0.5)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem'}}>+4</div>
                    </div>
                  </div>
                </div>
                <div style={{padding: '1.5rem'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem'}}>
                    <div style={{padding: '0.4rem', background: 'rgba(13, 143, 128, 0.1)', borderRadius: '8px', color: 'var(--accent-primary)'}}><ImageIcon size={16}/></div>
                    <h3 style={{margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-dark)'}}>{ws.name} Album</h3>
                  </div>
                  <p style={{margin: 0, color: 'var(--text-gray)', fontSize: '0.9rem'}}>7 Items • Shared with {ws.members?.length || 0} Members</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ========================================= */
  /* FILTERED DATA */
  /* ========================================= */

  const filteredGallery = galleryData.filter((item) => {

    const matchesSearch =
      item.uploader
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesFilter =
      activeFilter === 'All'
        ? true
        : activeFilter === 'Favorites'
        ? item.likes >= 20
        : activeFilter === 'Recent'
        ? item.createdAt === 'Now'
        : activeFilter === 'Videos'
        ? item.type === 'video'
        : true;

    const matchesAlbum = activeAlbum ? item.albumId === activeAlbum.id : true;

    return matchesSearch && matchesFilter && matchesAlbum;

  });

  /* ========================================= */
  /* ADD COMMENT */
  /* ========================================= */

  const handleAddComment = async () => {
    if (!commentInput.trim() || !selectedMedia) return;
    const itemId = selectedMedia._id || selectedMedia.id;
    try {
      const res = await fetch(`http://localhost:5000/api/gallery/${itemId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: currentUser?.username || 'User',
          text: commentInput
        })
      });
      if (res.ok) {
        const updatedItem = await res.json();
        setGalleryData(prev => prev.map(g => g._id === updatedItem._id ? updatedItem : g));
        setSelectedMedia(updatedItem);
        setCommentInput('');
      }
    } catch (e) {
      console.error('Failed to add comment', e);
    }
  };

  const handleLikeItem = async (itemId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/gallery/${itemId}/like`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const updatedItem = await res.json();
        setGalleryData(prev => prev.map(g => g._id === updatedItem._id ? updatedItem : g));
        setSelectedMedia(updatedItem);
      }
    } catch (e) {
      console.error('Failed to like item', e);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this media?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/gallery/${itemId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setGalleryData(prev => prev.filter(g => g._id !== itemId && g.id !== itemId));
        setSelectedMedia(null);
      }
    } catch (e) {
      console.error('Failed to delete item', e);
    }
  };

  return (

    <>

      <main className="gallery-main-content">
      
        {/* MODERN FLOATING EXIT BUTTON */}
        <motion.button 
          className="modern-exit-fab"
          onClick={() => {
            if (workspaceId) {
              navigate(-1);
            } else {
              navigate(`/workspace/${activeWorkspace.id || activeWorkspace._id}`);
            }
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Return to Workspace Cockpit"
          style={{ bottom: '6rem' }} /* To avoid overlapping with upload FAB */
        >
          <LogOut size={24} />
        </motion.button>

        {/* HEADER */}

        <div className="gallery-header-top">

          <div className="gallery-title">
            {activeAlbum ? (
              <button 
                onClick={() => setActiveAlbum(null)}
                style={{background: 'transparent', border: 'none', color: 'var(--text-gray)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: 0, marginBottom: '0.5rem'}}
              >
                <X size={16}/> Back to Workspace Album
              </button>
            ) : (
              <button 
                onClick={() => { setActiveWorkspace(null); localStorage.removeItem('gatherly_active_workspace'); window.dispatchEvent(new Event('active_workspace_changed')); }}
                style={{background: 'transparent', border: 'none', color: 'var(--text-gray)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: 0, marginBottom: '0.5rem'}}
              >
                <X size={16}/> Back to All Workspaces
              </button>
            )}
            <h1 style={{marginTop: 0}}>
              {activeAlbum ? activeAlbum.name : activeWorkspace.name + ' Gallery'}
            </h1>

            <p>
              Shared memories and collaborative
              uploads from your workspace.
            </p>

          </div>

          <div className="gallery-header-actions" style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>

            {activeAlbum && (
              <div style={{display:'flex', gap:'0.25rem', alignItems:'center', background:'var(--bg-card)', padding:'0.25rem 0.5rem', borderRadius:'12px', border:'1px solid var(--border-light)'}}>
                <span style={{fontSize:'0.75rem', fontWeight:700, color:'var(--text-gray)', paddingRight:'0.25rem'}}>Group:</span>
                <button onClick={() => setGroupByMode('none')} style={{fontSize:'0.75rem', fontWeight:groupByMode==='none'?800:600, padding:'0.3rem 0.6rem', border:'none', borderRadius:'8px', background:groupByMode==='none'?'var(--accent-primary)':'transparent', color:groupByMode==='none'?'white':'var(--text-gray)', cursor:'pointer', transition:'0.2s'}}>None</button>
                <button onClick={() => setGroupByMode('uploader')} style={{fontSize:'0.75rem', fontWeight:groupByMode==='uploader'?800:600, padding:'0.3rem 0.6rem', border:'none', borderRadius:'8px', background:groupByMode==='uploader'?'var(--accent-primary)':'transparent', color:groupByMode==='uploader'?'white':'var(--text-gray)', cursor:'pointer', transition:'0.2s'}}>Uploader</button>
                <button onClick={() => setGroupByMode('month')} style={{fontSize:'0.75rem', fontWeight:groupByMode==='month'?800:600, padding:'0.3rem 0.6rem', border:'none', borderRadius:'8px', background:groupByMode==='month'?'var(--accent-primary)':'transparent', color:groupByMode==='month'?'white':'var(--text-gray)', cursor:'pointer', transition:'0.2s'}}>Date</button>
              </div>
            )}

            <div style={{display: 'flex', gap: '0.25rem'}}>
              <button
                className={`gallery-view-btn ${
                  viewMode === 'masonry'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  setViewMode('masonry')
                }
              >
                <LayoutGrid size={16} />
              </button>

              <button
                className={`gallery-view-btn ${
                  viewMode === 'grid'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  setViewMode('grid')
                }
              >
                <Grid3X3 size={16} />
              </button>
            </div>

          </div>

        </div>

        {/* STORIES */}

        <div className="stories-container">

          {workspaceAlbums.map(album => (
            <div 
              key={album.id}
              className={`story-item ${activeStoryAlbum?.id === album.id ? 'active' : ''}`}
              onClick={() => {
                const items = galleryData.filter(item => item.albumId === album.id);
                if (items.length > 0) {
                  setActiveStoryAlbum(album);
                  setStoryIndex(0);
                } else {
                  setActiveAlbum(album);
                }
              }}
              style={{cursor: 'pointer'}}
            >
              <div className="story-ring">
                <img
                  src={album.cover || activeWorkspace.img || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=150&q=80'}
                  alt=""
                  className="story-img"
                />
              </div>
              <span>
                {album.name}
              </span>
            </div>
          ))}

        </div>

        {/* FILTERS */}

        <div className="gallery-filters">

          {[
            'All',
            'Favorites',
            'Videos',
            'Recent'
          ].map((filter) => (

            <button
              key={filter}
              className={`filter-pill ${
                activeFilter === filter
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setActiveFilter(filter)
              }
            >
              {filter}
            </button>

          ))}

        </div>

        {/* GALLERY OR ALBUMS */}

        {!activeAlbum ? (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2.5rem', width: '100%', marginTop: '2rem'}}>
            {workspaceAlbums.map(album => (
              <div key={album.id} onClick={() => setActiveAlbum(album)} style={{cursor: 'pointer', background: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: 'transform 0.2s', border: '1px solid var(--border-light)'}} onMouseOver={e => e.currentTarget.style.transform='translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform='none'}>
                <div style={{display: 'flex', gap: '2px', height: '200px', overflow: 'hidden'}}>
                  <div style={{flex: 2, background: `url(${album.cover}) center/cover`}}></div>
                  <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '2px'}}>
                    <div style={{flex: 1, background: `url(${album.cover.replace('-1', '-2')}) center/cover`}}></div>
                    <div style={{flex: 1, background: `url(${album.cover.replace('-1', '-3')}) center/cover`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      <div style={{background: 'rgba(0,0,0,0.5)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem'}}>+{album.items}</div>
                    </div>
                  </div>
                </div>
                <div style={{padding: '1.5rem'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem'}}>
                    <div style={{padding: '0.4rem', background: 'rgba(13, 143, 128, 0.1)', borderRadius: '8px', color: 'var(--accent-primary)'}}><ImageIcon size={16}/></div>
                    <h3 style={{margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-dark)'}}>{album.name}</h3>
                  </div>
                  <p style={{margin: 0, color: 'var(--text-gray)', fontSize: '0.9rem'}}>{album.items + 3} Items • Workspace Media</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{marginTop: '2rem'}}>
            {groupByMode === 'none' ? (
              <div className={viewMode === 'masonry' ? 'masonry-grid' : 'normal-grid'}>
                {filteredGallery.map((item) => (
                  <motion.div
                    layout
                    key={item.id}
                    className="masonry-item"
                    whileHover={{ y: -4 }}
                    onClick={() => setSelectedMedia(item)}
                  >
                    <img src={item.url} alt="" />
                    <div className="masonry-overlay">
                      <div className="masonry-top">
                        <span className="masonry-badge">{activeWorkspace.name}</span>
                      </div>
                      <div className="masonry-bottom">
                        <div className="masonry-uploader">
                          <img src={item.avatar} alt="" />
                          <span>{item.uploader}</span>
                        </div>
                        <div className="masonry-stats">
                          <span><Heart size={14} /> {item.likes}</span>
                          <span><MessageCircle size={14} /> {item.comments.length}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div style={{display: 'flex', flexDirection: 'column', gap: '3rem'}}>
                {(() => {
                  const groups = {};
                  filteredGallery.forEach(item => {
                    let key = 'Other';
                    if (groupByMode === 'uploader') {
                      key = item.uploader || 'Anonymous';
                    } else if (groupByMode === 'month') {
                      key = item.createdAt || 'Shared Recently';
                    }
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(item);
                  });

                  return Object.keys(groups).map((groupTitle) => (
                    <div key={groupTitle} style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem'}}>
                        <span style={{fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)'}}>
                          {groupByMode === 'uploader' ? `👤 Shared by ${groupTitle}` : `📅 ${groupTitle}`}
                        </span>
                        <span style={{fontSize: '0.8rem', color: 'var(--text-gray)', fontWeight: 700, padding: '0.2rem 0.6rem', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)'}}>
                          {groups[groupTitle].length} {groups[groupTitle].length === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      
                      <div className={viewMode === 'masonry' ? 'masonry-grid' : 'normal-grid'}>
                        {groups[groupTitle].map((item) => (
                          <motion.div
                            layout
                            key={item.id}
                            className="masonry-item"
                            whileHover={{ y: -4 }}
                            onClick={() => setSelectedMedia(item)}
                          >
                            <img src={item.url} alt="" />
                            <div className="masonry-overlay">
                              <div className="masonry-top">
                                <span className="masonry-badge">{activeWorkspace.name}</span>
                              </div>
                              <div className="masonry-bottom">
                                <div className="masonry-uploader">
                                  <img src={item.avatar} alt="" />
                                  <span>{item.uploader}</span>
                                </div>
                                <div className="masonry-stats">
                                  <span><Heart size={14} /> {item.likes}</span>
                                  <span><MessageCircle size={14} /> {item.comments.length}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        )}

      </main>

      {/* FILE INPUT */}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          const files = Array.from(e.target.files);
          files.forEach(uploadFile);
        }}
      />

      {/* FLOATING BUTTON */}

      <button
        className="fab-upload"
        onClick={() =>
          fileInputRef.current?.click()
        }
      >
        <Plus size={28} />
      </button>

      {/* DRAG OVERLAY */}

      <AnimatePresence>

        {isDragging && (

          <motion.div
            className="drag-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >

            <UploadCloud size={90} />

            <h2>Drop Photos Here</h2>

            <p>
              Upload directly into
              {activeWorkspace.name}
            </p>

          </motion.div>

        )}

      </AnimatePresence>

      {/* LIGHTBOX */}

      <AnimatePresence>

        {selectedMedia && (

          <motion.div
            className="lightbox-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >

            <button
              className="lightbox-close"
              onClick={() =>
                setSelectedMedia(null)
              }
            >
              <X size={24} />
            </button>

            <motion.div
              className="lightbox-content"
              initial={{
                scale: 0.95,
                opacity: 0
              }}
              animate={{
                scale: 1,
                opacity: 1
              }}
              exit={{
                scale: 0.95,
                opacity: 0
              }}
            >

              <div className="lightbox-media">

                <img
                  src={selectedMedia.url}
                  alt=""
                />

              </div>

              <div className="lightbox-sidebar">

                <div className="lightbox-header">

                  <div className="lb-uploader">

                    <img
                      src={selectedMedia.avatar}
                      alt=""
                    />

                    <div>

                      <h4>
                        {selectedMedia.uploader}
                      </h4>

                      <p>
                        {activeWorkspace.name}
                      </p>

                    </div>

                  </div>

                   <div className="lb-actions">
                    <button className="lb-icon-btn" onClick={() => handleLikeItem(selectedMedia._id || selectedMedia.id)} style={{color: selectedMedia.likes > 0 ? '#ef4444' : 'inherit'}}>
                      <Heart size={18} fill={selectedMedia.likes > 0 ? '#ef4444' : 'none'} />
                    </button>

                    {(currentUser?.username === selectedMedia.uploader || selectedMedia.uploader === 'You') && (
                      <button className="lb-icon-btn delete-btn" onClick={() => handleDeleteItem(selectedMedia._id || selectedMedia.id)} style={{color: 'var(--accent-red)'}}>
                        <Trash2 size={18} />
                      </button>
                    )}

                    <button className="lb-icon-btn">
                      <Bookmark size={18} />
                    </button>

                    <button className="lb-icon-btn">
                      <Share2 size={18} />
                    </button>
                  </div>

                </div>

                <div className="lightbox-comments">

                  {selectedMedia.comments
                    .length === 0 && (
                    <div className="empty-comments">
                      No comments yet
                    </div>
                  )}

                  {selectedMedia.comments.map(
                    (comment) => (

                      <div
                        key={comment._id || comment.id || Math.random()}
                        className="comment-item"
                      >

                        <div className="comment-avatar">
                          {comment.user?.charAt(0)}
                        </div>

                        <div className="comment-body">

                          <strong>
                            {comment.user}
                          </strong>

                          <p>
                            {comment.text}
                          </p>

                        </div>

                      </div>

                    )
                  )}

                </div>

                <div className="lightbox-footer">

                  <div className="lb-reactions-row">

                    <button className="lb-reaction-btn">
                      ❤️
                    </button>

                    <button className="lb-reaction-btn">
                      🔥
                    </button>

                    <button className="lb-reaction-btn">
                      😂
                    </button>

                    <button className="lb-reaction-btn">
                      🙌
                    </button>

                  </div>

                  <div className="lb-comment-input">

                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentInput}
                      onChange={(e) =>
                        setCommentInput(
                          e.target.value
                        )
                      }
                    />

                    <button
                      onClick={
                        handleAddComment
                      }
                    >
                      <Send size={16} />
                    </button>

                  </div>

                </div>

              </div>

            </motion.div>

          </motion.div>

        )}

      </AnimatePresence>

      {/* STORY VIEWER */}
      <AnimatePresence>
        {activeStoryAlbum && currentStory && (
          <motion.div
            className="story-viewer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: '#000',
              zIndex: 99999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Progress Bars */}
            <div style={{ position: 'absolute', top: '1rem', left: '1rem', right: '1rem', display: 'flex', gap: '4px', zIndex: 10 }}>
              {storyItems.map((item, idx) => (
                <div key={item.id} style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', overflow: 'hidden' }}>
                  <motion.div 
                    initial={{ width: idx < storyIndex ? '100%' : '0%' }}
                    animate={{ width: idx === storyIndex ? '100%' : idx < storyIndex ? '100%' : '0%' }}
                    transition={{ duration: idx === storyIndex ? 5 : 0, ease: "linear" }}
                    style={{ height: '100%', background: '#fff' }}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div style={{ position: 'absolute', top: '2rem', left: '1rem', right: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img src={currentStory.avatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #fff' }} />
                <span style={{ color: '#fff', fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{currentStory.uploader}</span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>{currentStory.createdAt}</span>
              </div>
              <button 
                onClick={() => setActiveStoryAlbum(null)}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.5rem' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Tap Areas */}
            <div 
              style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', zIndex: 5, cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                if (storyIndex > 0) setStoryIndex(storyIndex - 1);
              }}
            />
            <div 
              style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '30%', zIndex: 5, cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                if (storyIndex < storyItems.length - 1) setStoryIndex(storyIndex + 1);
                else setActiveStoryAlbum(null);
              }}
            />

            {/* Content */}
            <motion.img 
              key={currentStory.id}
              src={currentStory.url} 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.05, opacity: 0 }}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </>

  );

};

export default GalleryPage;
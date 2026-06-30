import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, ArrowRight, Rocket, CheckCircle, UploadCloud, Wand2, ImageIcon, CheckSquare, DollarSign, Calendar, Activity, Folder } from 'lucide-react';

const COVERS = [
  { name: 'Travel & Nature', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80' },
  { name: 'Work & Code', url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=800&q=80' },
  { name: 'Creative Design', url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80' },
  { name: 'Events & Meets', url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80' },
  { name: 'Abstract Art', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=800&q=80' },
  { name: 'Cozy & Minimal', url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80' }
];

const MODULES = [
  { id: 'gallery', name: 'Memory Gallery', icon: <ImageIcon size={18}/> },
  { id: 'teamhub', name: 'Team Hub & Tasks', icon: <CheckSquare size={18}/> },
  { id: 'expenses', name: 'Expenses & Split', icon: <DollarSign size={18}/> },
  { id: 'calendar', name: 'Calendar Events', icon: <Calendar size={18}/> },
  { id: 'pulse', name: 'Docs & Pulse', icon: <Activity size={18}/> },
  { id: 'files', name: 'Files & Docs', icon: <Folder size={18}/> },
];

const TYPES = ['Trip', 'Project', 'Startup', 'Event', 'Study Group', 'Custom'];
const COLORS = ['#0ea5e9', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b'];

const defaultData = {
  type: 'Project', name: '', description: '', color: '#0ea5e9', privacy: 'Private',
  cover: COVERS[0].url, members: [], newMemberEmail: '', newMemberRole: 'Editor',
  modules: { gallery: true, teamhub: true, expenses: true, calendar: false, pulse: true, files: true },
  aiPrompt: '', aiLoading: false, aiComplete: false
};

const WorkspaceWizard = ({ onClose, onLaunch, currentUser }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(defaultData);

  const set = (patch) => setData(d => ({ ...d, ...patch }));

  const handleSimulateAI = () => {
    set({ aiLoading: true });
    setTimeout(() => set({ aiLoading: false, aiComplete: true }), 2000);
  };

  const handleLaunch = () => {
    onLaunch(data);
    setStep(1);
    setData(defaultData);
  };

  return (
    <div className="modal-overlay">
      <motion.div className="modal-content wizard-modal-content" initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}}>
        <button className="modal-close" onClick={onClose} style={{zIndex:10,top:'1.5rem',right:'1.5rem'}}><X size={20}/></button>
        <div className="wizard-header">
          <h2>Create Workspace</h2>
          <div className="wizard-progress">
            {[1,2,3,4,5].map(s => <div key={s} className={`wizard-step-dot ${step===s?'active':''} ${step>s?'completed':''}`}/>)}
          </div>
        </div>

        <div className="wizard-body">
          {step === 1 && (
            <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}}>
              <h3 style={{marginBottom:'0.5rem',fontSize:'1.2rem',fontWeight:800}}>What kind of workspace?</h3>
              <p style={{color:'var(--text-gray)',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Select a preset to auto-configure modules.</p>
              <div className="type-grid">
                {TYPES.map(t => (
                  <div key={t} className={`type-card ${data.type===t?'selected':''}`} onClick={() => set({type:t})}>
                    <div className="type-icon"><Sparkles size={24}/></div>
                    <h4>{t}</h4>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}}>
              <h3 style={{marginBottom:'0.5rem',fontSize:'1.2rem',fontWeight:800}}>Workspace Details</h3>
              <p style={{color:'var(--text-gray)',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Give it a name and identity.</p>
              <div className="form-group">
                <label>Workspace Name</label>
                <input type="text" value={data.name} onChange={e=>set({name:e.target.value})} placeholder="e.g. Goa Trip 2026"/>
              </div>
              <div className="form-group">
                <label>Short Description</label>
                <input type="text" value={data.description} onChange={e=>set({description:e.target.value})} placeholder="What is the goal?"/>
              </div>
              <div className="wizard-two-col">
                <div className="form-group">
                  <label>Privacy</label>
                  <select value={data.privacy} onChange={e=>set({privacy:e.target.value})}>
                    <option>Private (Invite Only)</option>
                    <option>Team (Discoverable)</option>
                    <option>Public</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Theme Color</label>
                  <div className="color-picker">
                    {COLORS.map(c => <div key={c} onClick={()=>set({color:c})} className={`color-circle ${data.color===c?'selected':''}`} style={{background:c}}/>)}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}}>
              <h3 style={{marginBottom:'0.5rem',fontSize:'1.2rem',fontWeight:800}}>Select Cover Image</h3>
              <p style={{color:'var(--text-gray)',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Pick a preset or upload your own image from your device.</p>
              <div className="cover-picker-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.75rem',marginBottom:'1.5rem'}}>
                {COVERS.map(cov => (
                  <div key={cov.name} onClick={()=>set({cover:cov.url})} style={{position:'relative',height:'80px',borderRadius:'12px',overflow:'hidden',cursor:'pointer',border:data.cover===cov.url?'3px solid var(--accent-primary)':'1px solid var(--border-light)',transition:'all 0.2s'}}>
                    <img src={cov.url} alt={cov.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    <div style={{position:'absolute',bottom:0,left:0,right:0,background:'rgba(10,29,28,0.75)',color:'white',fontSize:'0.65rem',fontWeight:800,textAlign:'center',padding:'0.25rem 0'}}>{cov.name}</div>
                  </div>
                ))}
              </div>
              <label htmlFor="cover-file-input" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'0.6rem',border:'2px dashed var(--border-light)',borderRadius:'14px',padding:'1.25rem',cursor:'pointer',background:'var(--bg-main)',transition:'border-color 0.2s'}}
                onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor='var(--accent-primary)';}}
                onDragLeave={e=>{e.currentTarget.style.borderColor='var(--border-light)';}}
                onDrop={e=>{e.preventDefault();e.currentTarget.style.borderColor='var(--border-light)';const f=e.dataTransfer.files[0];if(f&&f.type.startsWith('image/')){const r=new FileReader();r.onloadend=()=>set({cover:r.result});r.readAsDataURL(f);}}}>
                <UploadCloud size={28} style={{color:'var(--accent-primary)',opacity:0.8}}/>
                <div style={{textAlign:'center'}}>
                  <p style={{fontWeight:700,color:'var(--text-dark)',margin:0,fontSize:'0.9rem'}}>Click to upload or drag & drop</p>
                  <p style={{fontSize:'0.75rem',color:'var(--text-gray)',margin:'0.2rem 0 0'}}>PNG, JPG, WEBP up to 10MB</p>
                </div>
                {data.cover?.startsWith('data:') && <span style={{fontSize:'0.8rem',color:'var(--accent-primary)',fontWeight:800}}>✓ Custom image ready!</span>}
                <input id="cover-file-input" type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files[0];if(f){const r=new FileReader();r.onloadend=()=>set({cover:r.result});r.readAsDataURL(f);}}}/>
              </label>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}}>
              <h3 style={{marginBottom:'0.5rem',fontSize:'1.2rem',fontWeight:800}}>Configure Modules</h3>
              <p style={{color:'var(--text-gray)',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Turn on the tools you need. You can change these later.</p>
              <div className="module-toggle-grid">
                {MODULES.map(m => {
                  const on = data.modules[m.id];
                  return (
                    <div key={m.id} className={`module-toggle-card ${on?'enabled':''}`} onClick={()=>set({modules:{...data.modules,[m.id]:!on}})}>
                      <div className="module-toggle-info">
                        <div className="module-toggle-icon">{m.icon}</div>
                        <div className="module-toggle-text"><h4>{m.name}</h4></div>
                      </div>
                      <div className={`toggle-switch ${on?'on':''}`}><div className="toggle-handle"/></div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}}>
              <h3 style={{marginBottom:'0.5rem',fontSize:'1.2rem',fontWeight:800}}>AI Workspace Setup</h3>
              <p style={{color:'var(--text-gray)',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Let AI auto-generate starter folders, tasks and structures.</p>
              {!data.aiComplete ? (
                <div className="ai-setup-box">
                  {data.aiLoading ? (
                    <div className="ai-loading-spinner"><Sparkles size={40}/></div>
                  ) : (
                    <>
                      <Wand2 size={24} color="#0ea5e9" style={{marginBottom:'1rem'}}/>
                      <textarea placeholder="e.g. We are planning a 5-day trip to Goa for 12 people..." value={data.aiPrompt} onChange={e=>set({aiPrompt:e.target.value})}/>
                      <button className="btn-primary" onClick={handleSimulateAI}><Sparkles size={16}/> Generate with AI</button>
                    </>
                  )}
                </div>
              ) : (
                <div className="ai-setup-box" style={{background:'rgba(13,143,128,0.08)',borderColor:'var(--accent-primary)'}}>
                  <CheckCircle size={40} color="var(--accent-primary)" style={{margin:'0 auto 1rem auto'}}/>
                  <h4 style={{fontSize:'1.1rem',fontWeight:800,color:'var(--text-dark)',marginBottom:'0.5rem'}}>Workspace Initialized!</h4>
                  <p style={{fontSize:'0.85rem',color:'var(--text-gray)'}}>AI has prepared 8 starter tasks, 3 document templates, and 2 gallery folders.</p>
                </div>
              )}
            </motion.div>
          )}
        </div>

        <div className="wizard-footer">
          {step > 1 ? (
            <button className="btn-outline" style={{padding:'0.8rem 1.5rem',borderRadius:'12px',background:'transparent',border:'1px solid var(--border-light)',cursor:'pointer',fontWeight:700}} onClick={()=>setStep(s=>s-1)}>Back</button>
          ) : <div/>}
          {step < 5 ? (
            <button className="btn-primary" style={{width:'auto',padding:'0.8rem 2rem'}} onClick={()=>setStep(s=>s+1)}>Next Step <ArrowRight size={16}/></button>
          ) : (
            <button className="btn-primary" style={{width:'auto',padding:'0.8rem 2rem',background:'#10b981'}} onClick={handleLaunch}>Launch Workspace <Rocket size={16}/></button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default WorkspaceWizard;

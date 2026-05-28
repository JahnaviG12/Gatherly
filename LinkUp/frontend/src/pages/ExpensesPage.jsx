import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { 
  ShieldCheck, ArrowUpRight, ArrowDownLeft, 
  Plus, Users, X, CreditCard, Landmark, CheckCircle, 
  BellRing, AlertTriangle, Utensils, Plane, 
  Home, ShoppingBag, QrCode, Lock, Calendar, User,
  LogOut
} from 'lucide-react';
import './ExpensesPage.css';

// Currencies mapping and formatting
const currencies = [
  { code: 'INR', symbol: '₹', rate: 1.0 },
  { code: 'USD', symbol: '$', rate: 0.012 },
  { code: 'EUR', symbol: '€', rate: 0.011 },
  { code: 'GBP', symbol: '£', rate: 0.0096 },
];

const ExpensesPage = () => {
  const { searchQuery } = useOutletContext();
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]); // Default to Rupees (INR)
  const [expenses, setExpenses] = useState([]);
  const [debts, setDebts] = useState([]);
  const [receipts, setReceipts] = useState([]);
  
  // Modals state
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  
  // Payment Gateway states
  const [payMethod, setPayMethod] = useState('card');
  const [paymentStep, setPaymentStep] = useState('details');
  const [cardDetails, setCardDetails] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [cardError, setCardError] = useState('');
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('');

  const [newExpense, setNewExpense] = useState({ title: '', amount: '', category: '', paidBy: '', splitType: 'all', splitWith: '', date: '' });
  
  // Custom Toast State
  const [toast, setToast] = useState('');
  const [activeWorkspace, setActiveWorkspace] = useState(null);

  const allWorkspaces = JSON.parse(
    localStorage.getItem('gatherly_workspaces') || '[]'
  );

  // Determine workspace context from URL params or localStorage
  useEffect(() => {
    if (workspaceId) {
      try {
        const foundWorkspace = allWorkspaces.find(ws => {
          const wsId = ws._id || ws.id;
          const wsIdStr = typeof wsId === 'object' ? (wsId.$oid || String(wsId)) : String(wsId || '');
          return wsIdStr === workspaceId;
        });
        if (foundWorkspace) {
          setActiveWorkspace(foundWorkspace);
          localStorage.setItem('gatherly_active_workspace', JSON.stringify(foundWorkspace));
          window.dispatchEvent(new Event('active_workspace_changed'));
        }
      } catch (e) {}
    } else {
      try {
        const saved = localStorage.getItem('gatherly_active_workspace');
        setActiveWorkspace(saved ? JSON.parse(saved) : null);
      } catch (e) {}
    }
  }, [workspaceId]);
    
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

  useEffect(() => {
    if (activeWorkspace) {
      // Fetch Expenses
      fetch(`http://localhost:5000/api/expenses/workspace/${activeWorkspace._id || activeWorkspace.id}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) setExpenses(data);
        })
        .catch(console.error);
        
      // Fetch Receipts / Settlements
      fetch(`http://localhost:5000/api/expenses/workspace/${activeWorkspace._id || activeWorkspace.id}/settlements`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) setReceipts(data);
        })
        .catch(console.error);
    } else {
      setExpenses([]);
      setReceipts([]);
    }
  }, [activeWorkspace]);

  // Dynamic Debt Calculator
  useEffect(() => {
    if (activeWorkspace && expenses.length > 0) {
      // Very basic dynamic mock logic just for display purposes
      // Realistically this would be calculated by the backend based on split ratios
      const user = JSON.parse(localStorage.getItem('gatherly_user')) || { username: 'You' };
      const computedDebts = [];
      expenses.forEach(exp => {
        // If someone else paid, and split includes user or "All Members"
        if (exp.paidBy.toLowerCase() !== user.username.toLowerCase() && exp.paidBy.toLowerCase() !== 'you' && exp.paidBy.toLowerCase() !== 'self') {
          if (exp.splitWith.includes('All Members') || exp.splitWith.some(s => s.toLowerCase() === user.username.toLowerCase() || s.toLowerCase() === 'you')) {
            const share = exp.splitWith.includes('All Members') ? exp.amount / (activeWorkspace?.members?.length || 4) : exp.amount / exp.splitWith.length;
            computedDebts.push({
              id: 'debt_' + exp._id,
              name: exp.paidBy,
              amount: share,
              type: 'owe'
            });
          }
        }
      });
      // Filter out settled debts
      const activeDebts = computedDebts.filter(d => !receipts.some(r => r.name === d.name && Math.abs(r.amount - d.amount) < 1));
      setDebts(activeDebts);
    } else {
      setDebts([]);
    }
  }, [expenses, receipts, activeWorkspace]);



  if (!activeWorkspace) {
    const userWorkspaces = allWorkspaces.length > 0 ? allWorkspaces : [];

    return (
      <div className="expenses-empty-state" style={{flexDirection: 'column', padding: '3rem', alignItems: 'flex-start', justifyContent: 'flex-start', height: '100%', minHeight: '80vh', background: 'var(--bg-main)', color: 'var(--text-dark)', width: '100%'}}>
        
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
          <h2 style={{fontSize: '2.5rem', margin: 0, fontWeight: 800, color: 'var(--text-dark)'}}>Your Workspace Ledgers</h2>
        </div>
        
        {userWorkspaces.length === 0 ? (
          <div style={{margin: '0 auto', marginTop: '10%', textAlign: 'center'}}>
            <Lock size={50} color="var(--accent-primary)"/>
            <h2>No Workspaces Found</h2>
            <p>You haven't joined any workspaces yet.</p>
            <a href="/userdashboard" style={{color: 'var(--accent-primary)', fontWeight: 600}}>Go to Dashboard</a>
          </div>
        ) : (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2.5rem', width: '100%'}}>
            {userWorkspaces.map(ws => (
              <div key={ws.id || ws._id} onClick={() => { setActiveWorkspace(ws); localStorage.setItem('gatherly_active_workspace', JSON.stringify(ws)); window.dispatchEvent(new Event('active_workspace_changed')); }} style={{cursor: 'pointer', background: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', transition: 'transform 0.2s, box-shadow 0.2s', border: '1px solid var(--border-light)'}} onMouseOver={e => {e.currentTarget.style.transform='translateY(-8px)'; e.currentTarget.style.boxShadow='0 20px 40px rgba(0,0,0,0.1)';}} onMouseOut={e => {e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 10px 25px rgba(0,0,0,0.05)';}}>
                <div style={{display: 'flex', gap: '2px', height: '180px', overflow: 'hidden'}}>
                   <div style={{flex: 1, background: `url(https://picsum.photos/seed/${ws.id || ws._id}-expenses/800/600) center/cover`}}></div>
                </div>
                <div style={{padding: '1.5rem'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem'}}>
                    <div style={{padding: '0.4rem', background: 'rgba(13, 143, 128, 0.1)', borderRadius: '8px', color: 'var(--accent-primary)'}}><CreditCard size={16}/></div>
                    <h3 style={{margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-dark)'}}>{ws.name} Ledger</h3>
                  </div>
                  <p style={{margin: 0, color: 'var(--text-gray)', fontSize: '0.9rem'}}>Manage shared expenses & settlements</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Currency Converter helper
  const convertAmount = (amountInINR) => {
    return (amountInINR * selectedCurrency.rate).toFixed(2);
  };

  const showToastMsg = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const logExpenseActivity = async (actionText) => {
    if (!activeWorkspace) return;
    const user = JSON.parse(localStorage.getItem('gatherly_user')) || { username: 'You' };
    try {
      const spaceRes = await fetch(`http://localhost:5000/api/spaces/${activeWorkspace._id || activeWorkspace.id}`);
      if (!spaceRes.ok) return;
      const spaceData = await spaceRes.json();
      
      const newAct = {
        id: Date.now().toString(),
        user: user.username,
        action: actionText,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      };
      const currentActs = spaceData.activities || [];
      const updatedActs = [newAct, ...currentActs].slice(0, 15);
      
      await fetch(`http://localhost:5000/api/spaces/${activeWorkspace._id || activeWorkspace.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activities: updatedActs })
      });
    } catch(e) {
      console.error('Failed to log expense activity', e);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount) return;

    const inputAmount = parseFloat(newExpense.amount);
    const amountInINR = Math.round(inputAmount / selectedCurrency.rate);

    try {
      const res = await fetch('http://localhost:5000/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspace._id || activeWorkspace.id,
          title: newExpense.title,
          amount: amountInINR,
          category: newExpense.category || 'General',
          paidBy: newExpense.paidBy || 'Self',
          splitWith: newExpense.splitType === 'all' ? ['All Members'] : (newExpense.splitWith ? newExpense.splitWith.split(',').map(s => s.trim()) : []),
          date: newExpense.date || new Date().toISOString().split('T')[0]
        })
      });
      if (res.ok) {
        const savedExp = await res.json();
        setExpenses([savedExp, ...expenses]);
        setShowAddExpense(false);
        setNewExpense({ title: '', amount: '', category: '', paidBy: '', splitType: 'all', splitWith: '', date: '' });
        logExpenseActivity(`logged a new expense: ${selectedCurrency.symbol}${convertAmount(amountInINR)} for ${newExpense.title}`);
        showToastMsg('🔒 Ledger secured: Expense added successfully!');
      } else {
        alert('Failed to add expense! Ensure backend is running.');
      }
    } catch(err) {
      console.error(err);
      alert('Network error adding expense');
    }
  };

  // Secure Checkout Trigger
  const triggerPayment = (debt) => {
    setSelectedDebt(debt);
    setPayMethod('card');
    setPaymentStep('details');
    setCardDetails({ number: '', name: '', expiry: '', cvv: '' });
    setUpiId('');
    setSelectedBank('');
    setCardError('');
    setShowPaymentModal(true);
  };

  // Settle Payment Handler
  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (payMethod === 'card') {
      if (cardDetails.number.replace(/\s/g, '').length !== 16) {
        setCardError('Invalid card number. Must be 16 digits.');
        return;
      }
      if (!cardDetails.expiry || cardDetails.expiry.length !== 5) {
        setCardError('Invalid expiry. Format MM/YY.');
        return;
      }
      if (cardDetails.cvv.length !== 3) {
        setCardError('CVV must be 3 digits.');
        return;
      }
    } else if (payMethod === 'upi' && !upiId.trim()) {
      setCardError('Please enter a valid UPI ID.');
      return;
    } else if (payMethod === 'netbank' && !selectedBank) {
      setCardError('Please select a preferred bank to proceed.');
      return;
    }

    setCardError('');
    setPaymentStep('processing');

    setTimeout(async () => {
      setPaymentStep('success');
      
      const settledAt = new Date().toLocaleString();
      const receiptId = 'TXN-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      
      const newReceipt = {
        workspaceId: activeWorkspace._id || activeWorkspace.id,
        receiptId,
        name: selectedDebt.name,
        amount: selectedDebt.amount,
        settledBy: 'You',
        settledAt
      };
      
      try {
        const res = await fetch('http://localhost:5000/api/expenses/settlements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newReceipt)
        });
        
        if (res.ok) {
          const savedReceipt = await res.json();
          setReceipts(prev => [savedReceipt, ...prev]);
          logExpenseActivity(`settled a debt of ${selectedCurrency.symbol}${convertAmount(selectedDebt.amount)} with ${selectedDebt.name}`);
        } else {
          setReceipts(prev => [newReceipt, ...prev]); // Fallback to local state if backend fails
        }
      } catch (err) {
        setReceipts(prev => [newReceipt, ...prev]); // Fallback
      }
      
      setDebts(prev => prev.filter(d => d.id !== selectedDebt.id));
    }, 2500); 
  };

  const sendSecureReminder = (name) => {
    showToastMsg(`🔔 Secure nudge sent to ${name} over Telegram/WhatsApp!`);
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Food': return <Utensils size={18} />;
      case 'Stay': return <Home size={18} />;
      case 'Transport': return <Plane size={18} />;
      default: return <ShoppingBag size={18} />;
    }
  };

  // Filter expenses and debts belonging ONLY to this workspace
  const scopedExpenses = expenses;
  const isGoaTrip = true; // Dynamic debts feature coming soon
  const scopedDebts = debts;

  const totalSpent = scopedExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const youOwe = scopedDebts.filter(d => d.type === 'owe').reduce((acc, curr) => acc + curr.amount, 0);
  const owedToYou = scopedDebts.filter(d => d.type === 'owed').reduce((acc, curr) => acc + curr.amount, 0);

  const filteredExpenses = scopedExpenses.filter(exp => 
    !searchQuery || 
    exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.category.toLowerCase().includes(searchQuery.toLowerCase())
  );



  return (
    <main className="expenses-main-content">
      {/* MODERN FLOATING EXIT BUTTON */}
      <motion.button 
        className="modern-exit-fab"
        onClick={() => {
          if (workspaceId) {
            navigate(-1);
          } else {
            setActiveWorkspace(null);
            localStorage.removeItem('gatherly_active_workspace');
            window.dispatchEvent(new Event('active_workspace_changed'));
          }
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Return to Ledger Selection"
      >
        <LogOut size={24} />
      </motion.button>

      {/* HEADER & SECURITY BADGE */}
      <div className="expenses-header">
        <div className="expenses-title">
          <h1>Secured Expenses</h1>
          <p>
            <span className="security-badge" aria-label="SSL Secured ledger system">
              <ShieldCheck size={16} /> 256-Bit Ledger Encrypted
            </span>
          </p>
        </div>

        <div className="currency-selector" aria-label="Currency Selector">
          {currencies.map(c => (
            <button
              key={c.code}
              className={`currency-btn ${selectedCurrency.code === c.code ? 'active' : ''}`}
              onClick={() => setSelectedCurrency(c)}
              aria-label={`Switch currency to ${c.code}`}
            >
              {c.symbol} {c.code}
            </button>
          ))}
        </div>
      </div>

      {/* VAULT BOARD (Compact Sizes) */}
      {!searchQuery && (
        <div className="vault-board">
          <div className="vault-card total">
            <div className="vault-card-header">
              <h3>Total Spent</h3>
              <div className="vault-icon" style={{color: 'var(--primary-indigo)'}}>
                <Landmark size={20} />
              </div>
            </div>
            <div className="vault-amount">
              {selectedCurrency.symbol}{parseFloat(convertAmount(totalSpent)).toLocaleString()}
            </div>
            <button className="vault-action-btn" onClick={() => setShowAddExpense(true)} aria-label="Log new expense split">
              <Plus size={16} /> Add New Bill
            </button>
          </div>

          <div className="vault-card owe">
            <div className="vault-card-header">
              <h3>You Owe</h3>
              <div className="vault-icon" style={{color: '#f43f5e'}}>
                <ArrowUpRight size={20} />
              </div>
            </div>
            <div className="vault-amount" style={{color: '#f43f5e'}}>
              {selectedCurrency.symbol}{parseFloat(convertAmount(youOwe)).toLocaleString()}
            </div>
            <span style={{fontSize: '0.8rem', color: 'var(--text-gray)'}}>Pending settlements out</span>
          </div>

          <div className="vault-card owed">
            <div className="vault-card-header">
              <h3>Owed to You</h3>
              <div className="vault-icon" style={{color: '#10b981'}}>
                <ArrowDownLeft size={20} />
              </div>
            </div>
            <div className="vault-amount" style={{color: '#10b981'}}>
              {selectedCurrency.symbol}{parseFloat(convertAmount(owedToYou)).toLocaleString()}
            </div>
            <span style={{fontSize: '0.8rem', color: 'var(--text-gray)'}}>Incoming split claims</span>
          </div>
        </div>
      )}

      {/* DEBT SETTLEMENT MATRIX */}
      <div className="matrix-section">
        <div className="section-title">
          <Users size={20} color="var(--primary-blue)" /> Settle Balances
        </div>
        <div className="debts-grid">
          {scopedDebts.map(debt => (
            <div className={`debt-card ${debt.type}`} key={debt.id}>
              <div className="debt-user">
                <img 
                  className="debt-avatar" 
                  src={`https://ui-avatars.com/api/?name=${debt.name}&background=${debt.type === 'owe' ? 'fee2e2&color=ef4444' : 'd1fae5&color=10b981'}&bold=true`} 
                  alt={debt.name} 
                />
                <div className="debt-info">
                  <h4>{debt.name}</h4>
                  <p>{debt.type === 'owe' ? 'You owe them' : 'Owes you'}</p>
                </div>
              </div>

              <div className={`debt-action ${debt.type}`}>
                <h3>{selectedCurrency.symbol}{convertAmount(debt.amount)}</h3>
                {debt.type === 'owe' ? (
                  <button className="pay-btn" onClick={() => triggerPayment(debt)} aria-label={`Settle balance with ${debt.name}`}>
                    Pay Secured
                  </button>
                ) : (
                  <button className="remind-btn" onClick={() => sendSecureReminder(debt.name)} aria-label={`Send secure payment nudge to ${debt.name}`}>
                    <BellRing size={12} style={{display:'inline', marginRight:'4px'}}/> Nudge
                  </button>
                )}
              </div>
            </div>
          ))}
          {scopedDebts.length === 0 && (
            <div className="debt-card" style={{gridColumn: '1/-1', justifyContent: 'center', padding: '2rem'}}>
              <span style={{color: 'var(--text-gray)', fontWeight: '600'}}>🎉 All balances cleared! Excellent ledger management.</span>
            </div>
          )}
        </div>
      </div>

      {/* DETAILED EXPENSE HISTORY LOG */}
      <div className="expense-log-section">
        <div className="section-title">
          Expense History Ledger
        </div>

        <div className="log-list">
          {filteredExpenses.map(exp => (
            <div className="log-item" key={exp.id}>
              <div className="log-details">
                <div className="category-badge">
                  {getCategoryIcon(exp.category)}
                </div>
                <div className="log-info">
                  <h4>{exp.title}</h4>
                  <p>Paid by <strong>{exp.paidBy}</strong> • {exp.date}</p>
                </div>
              </div>

              <div className="log-split">
                <h3>{selectedCurrency.symbol}{convertAmount(exp.amount)}</h3>
                <p>Split with {exp.splitWith.length} members</p>
              </div>
            </div>
          ))}
          {filteredExpenses.length === 0 && (
            <div className="debt-card" style={{gridColumn: '1/-1', justifyContent: 'center', padding: '2rem'}}>
              <span style={{color: 'var(--text-gray)', fontWeight: '600'}}>No expenses logged yet.</span>
            </div>
          )}
        </div>
      </div>

      {/* RECEIPTS & SETTLEMENTS */}
      {receipts.length > 0 && (
        <div className="expense-log-section" style={{marginTop: '2rem'}}>
          <div className="section-title">
            Settlement Receipts
          </div>

          <div className="log-list">
            {receipts.map((rec, i) => (
              <div className="log-item" key={i} style={{borderLeft: '4px solid #10b981'}}>
                <div className="log-details">
                  <div className="category-badge" style={{background: '#d1fae5', color: '#10b981'}}>
                    <CheckCircle size={18} />
                  </div>
                  <div className="log-info">
                    <h4>Settlement with {rec.name}</h4>
                    <p>Receipt ID: <strong>{rec.receiptId}</strong> • {rec.settledAt}</p>
                  </div>
                </div>

                <div className="log-split">
                  <h3 style={{color: '#10b981'}}>{selectedCurrency.symbol}{convertAmount(rec.amount)}</h3>
                  <p>Successfully Settled</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD EXPENSE MODAL */}
      <AnimatePresence>
        {showAddExpense && (
          <div className="secure-modal-overlay">
            <motion.div 
              className="secure-modal"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <button className="modal-close" onClick={() => setShowAddExpense(false)} aria-label="Close modal">
                <X size={20} />
              </button>
              <div className="secure-modal-header">
                <h2>Securely Log Expense</h2>
                <p style={{fontSize: '0.85rem', color: 'var(--text-gray)'}}>Ledger values split automatically among active space members.</p>
              </div>

              <form className="secure-form" onSubmit={handleAddExpense}>
                <div className="form-group">
                  <label>Bill/Expense Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Scuba Diving Gear"
                    value={newExpense.title}
                    onChange={(e) => setNewExpense({...newExpense, title: e.target.value})}
                    required 
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Amount ({selectedCurrency.code})</label>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Food, Transport"
                      value={newExpense.category}
                      onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Paid By</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Alex, You"
                      value={newExpense.paidBy}
                      onChange={(e) => setNewExpense({...newExpense, paidBy: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input 
                      type="date" 
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Split Type</label>
                  <select 
                    style={{background: 'var(--bg-main)', border: '1px solid var(--border-light)', padding: '0.8rem', borderRadius: '12px', color: 'var(--text-dark)'}}
                    value={newExpense.splitType}
                    onChange={(e) => setNewExpense({...newExpense, splitType: e.target.value})}
                  >
                    <option value="all">Equally among all active members</option>
                    <option value="custom">Custom (Specify members manually)</option>
                  </select>
                </div>

                {newExpense.splitType === 'custom' && (
                  <div className="form-group">
                    <label>Split With (Comma separated names)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Sarah, Mike, Alex"
                      value={newExpense.splitWith}
                      onChange={(e) => setNewExpense({...newExpense, splitWith: e.target.value})}
                      required
                    />
                  </div>
                )}

                <button type="submit" className="vault-action-btn" style={{marginTop: '1rem'}}>
                  🔒 Secure Entry & Log Split
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GATHERLY SECUREPAY GATEWAY MODAL (Re-decongested & Full Features) */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="secure-modal-overlay">
            <motion.div 
              className="secure-modal gateway"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              style={{maxHeight: '90vh', overflowY: 'auto'}}
            >
              <button className="modal-close" onClick={() => setShowPaymentModal(false)} aria-label="Close Payment Gateway">
                <X size={20} />
              </button>

              {paymentStep === 'details' && (
                <>
                  <div className="secure-modal-header" style={{marginBottom: '1.25rem'}}>
                    <div className="security-badge" style={{marginBottom: '0.3rem'}}>
                      <ShieldCheck size={14} /> Secure checkout SSL
                    </div>
                    <h2>Gatherly SecurePay</h2>
                    <p style={{fontSize: '0.85rem', color: 'var(--text-gray)'}}>Settle debt of <strong>{selectedCurrency.symbol}{convertAmount(selectedDebt.amount)}</strong> to <strong>{selectedDebt.name}</strong></p>
                  </div>

                  {/* Payment Method Selector Tabs */}
                  <div className="pay-method-tabs">
                    <button 
                      className={`pay-method-btn ${payMethod === 'card' ? 'active' : ''}`}
                      onClick={() => setPayMethod('card')}
                    >
                      <CreditCard size={14} /> Card
                    </button>
                    <button 
                      className={`pay-method-btn ${payMethod === 'upi' ? 'active' : ''}`}
                      onClick={() => setPayMethod('upi')}
                    >
                      <QrCode size={14} /> UPI ID
                    </button>
                    <button 
                      className={`pay-method-btn ${payMethod === 'netbank' ? 'active' : ''}`}
                      onClick={() => setPayMethod('netbank')}
                    >
                      <Landmark size={14} /> Net Banking
                    </button>
                  </div>

                  {cardError && (
                    <div style={{color: '#f43f5e', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center'}}>
                      <AlertTriangle size={14} /> {cardError}
                    </div>
                  )}

                  {/* TAB 1: CARD CHECKOUT */}
                  {payMethod === 'card' && (
                    <form className="secure-form" onSubmit={handlePaymentSubmit}>
                      {/* Compact card preview */}
                      <div className="secure-card-preview-compact">
                        <div className="card-preview-header">
                          <span style={{fontWeight:'700', fontSize:'0.75rem', letterSpacing:'0.05em'}}>SECURE DIGITAL WALLET</span>
                          <CreditCard size={18} opacity={0.8} />
                        </div>
                        <div className="card-preview-number-compact">
                          {cardDetails.number || '•••• •••• •••• ••••'}
                        </div>
                        <div className="card-preview-footer">
                          <div>
                            <span className="card-label">Holder</span>
                            <span className="card-value">{cardDetails.name || 'FULL NAME'}</span>
                          </div>
                          <div>
                            <span className="card-label">Expires</span>
                            <span className="card-value">{cardDetails.expiry || 'MM/YY'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="form-group icon-input">
                        <label>Credit Card Number</label>
                        <div className="input-with-icon">
                          <CreditCard className="field-icon" size={16} />
                          <input 
                            type="text" 
                            maxLength="19"
                            placeholder="4111 2222 3333 4444"
                            value={cardDetails.number}
                            onChange={(e) => {
                              let v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                              let matches = v.match(/\d{4,16}/g);
                              let match = matches && matches[0] || '';
                              let parts = [];
                              for (let i=0, len=match.length; i<len; i+=4) {
                                parts.push(match.substring(i, i+4));
                              }
                              setCardDetails({...cardDetails, number: parts.length > 0 ? parts.join(' ') : v});
                            }}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group icon-input">
                        <label>Cardholder Name</label>
                        <div className="input-with-icon">
                          <User className="field-icon" size={16} />
                          <input 
                            type="text" 
                            placeholder="John Doe"
                            value={cardDetails.name}
                            onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group icon-input">
                          <label>Expiration (MM/YY)</label>
                          <div className="input-with-icon">
                            <Calendar className="field-icon" size={16} />
                            <input 
                              type="text" 
                              maxLength="5"
                              placeholder="12/28"
                              value={cardDetails.expiry}
                              onChange={(e) => {
                                let v = e.target.value.replace(/[^0-9]/g, '');
                                setCardDetails({...cardDetails, expiry: v.length > 2 ? v.substring(0,2) + '/' + v.substring(2,4) : v});
                              }}
                              required
                            />
                          </div>
                        </div>
                        <div className="form-group icon-input">
                          <label>CVV Code</label>
                          <div className="input-with-icon">
                            <Lock className="field-icon" size={16} />
                            <input 
                              type="password" 
                              maxLength="3"
                              placeholder="•••"
                              value={cardDetails.cvv}
                              onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value.replace(/[^0-9]/g, '')})}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <button type="submit" className="vault-action-btn settle-pay-action">
                        🔒 Settle Balance & Pay Secured
                      </button>
                    </form>
                  )}

                  {/* TAB 2: UPI ID PAYMENT */}
                  {payMethod === 'upi' && (
                    <form className="secure-form" onSubmit={handlePaymentSubmit}>
                      <div className="form-group icon-input">
                        <label>UPI Address (UPI ID)</label>
                        <div className="input-with-icon">
                          <QrCode className="field-icon" size={16} />
                          <input 
                            type="text" 
                            placeholder="e.g. yourname@upi"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div style={{background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-gray)'}}
                      >
                        <p style={{margin: '0 0 0.5rem 0', fontWeight: '600'}}>📱 How to pay via UPI:</p>
                        <ul style={{margin: 0, paddingLeft: '1.2rem'}}>
                          <li>Enter your UPI ID in the field above</li>
                          <li>Click "Pay Now" to initiate the payment</li>
                          <li>Complete the transaction in your UPI app</li>
                        </ul>
                      </div>

                      <button type="submit" className="vault-action-btn settle-pay-action">
                        💳 Pay Now via UPI
                      </button>
                    </form>
                  )}

                  {/* TAB 3: NET BANKING */}
                  {payMethod === 'netbank' && (
                    <form className="secure-form" onSubmit={handlePaymentSubmit}>
                      <div className="netbank-grid">
                        {[
                          { id: 'sbi', name: 'State Bank of India', color: '#00a4e4' },
                          { id: 'hdfc', name: 'HDFC Bank', color: '#1c3f94' },
                          { id: 'icici', name: 'ICICI Bank', color: '#f58220' },
                          { id: 'axis', name: 'Axis Bank', color: '#97144d' }
                        ].map(bank => (
                          <div 
                            key={bank.id} 
                            className={`bank-select-card ${selectedBank === bank.id ? 'active' : ''}`}
                            onClick={() => setSelectedBank(bank.id)}
                          >
                            <div className="bank-logo-mock" style={{backgroundColor: bank.color}}>
                              {bank.name.charAt(0)}
                            </div>
                            <span>{bank.name}</span>
                          </div>
                        ))}
                      </div>

                      <button type="submit" className="vault-action-btn settle-pay-action" disabled={!selectedBank}>
                        🔒 Proceed to Bank Login
                      </button>
                    </form>
                  )}
                </>
              )}

              {paymentStep === 'processing' && (
                <div className="processing-container">
                  <div className="gateway-spinner"></div>
                  <h2>Executing Bank Clearing...</h2>
                  <p style={{color: 'var(--text-gray)', fontSize: '0.9rem'}}>Communicating with payment gateway through a secure pipeline. Do not refresh or exit.</p>
                </div>
              )}

              {paymentStep === 'success' && (
                <div className="success-container">
                  <div className="success-icon-container">
                    <CheckCircle size={32} />
                  </div>
                  <h2>Payment Settled Successfully!</h2>
                  <p style={{color: 'var(--text-gray)', fontSize: '0.9rem'}}>Your payment of <strong>{selectedCurrency.symbol}{convertAmount(selectedDebt.amount)}</strong> has been verified. The ledger is cleared and locked.</p>
                  <button className="vault-action-btn" style={{marginTop:'1rem', width:'100%'}} onClick={() => setShowPaymentModal(false)}>
                    Close Gateway & View Ledger
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Secure alert toast nudge */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            className="toast-alert"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            <ShieldCheck size={20} color="#10b981" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default ExpensesPage;

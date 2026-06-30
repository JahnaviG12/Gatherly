const User    = require('../models/User');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_gatherly_jwt_key_2026';
const genToken   = (id, role) => jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '30d' });

/* ── Register ── POST /api/auth/register */
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: 'Please add all fields' });

    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'Email is already registered' });

    const hashed = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const user   = await User.create({ username, email, password: hashed, role: 'user' });

    if (user) res.status(201).json({ _id: user._id, username: user.username, email: user.email, role: user.role, token: genToken(user._id, user.role) });
    else       res.status(400).json({ message: 'Invalid user data' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Login ── POST /api/auth/login */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: 'Invalid email or password' });
    if (user.isBlocked)
      return res.status(403).json({ message: 'Your account has been blocked by an administrator.' });
    res.json({ _id: user._id, username: user.username, email: user.email, role: user.role, token: genToken(user._id, user.role) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Admin Login ── POST /api/auth/admin/login */
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: 'Invalid email or password' });
    if (user.role !== 'admin')
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    res.json({ _id: user._id, username: user.username, email: user.email, role: user.role, token: genToken(user._id, user.role) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/* ── Update Profile ── PUT /api/auth/profile */
exports.updateProfile = async (req, res) => {
  try {
    const {
      id, username, email, bio, phone, website, gender, profilePicture,
      language, country, profileVisibility, statusMessage, theme,
      twoFactorEnabled, loginAlerts, emailNotifications,
      pushNotifications, workspaceUpdates, mentionAlerts
    } = req.body;

    if (!id) return res.status(400).json({ message: 'User ID is required' });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const set = (field, val) => { if (val !== undefined) user[field] = val; };
    user.username = username || user.username;
    user.email    = email    || user.email;
    ['bio','phone','website','gender','language','country','profileVisibility','statusMessage','theme',
     'twoFactorEnabled','loginAlerts','emailNotifications','pushNotifications','workspaceUpdates','mentionAlerts','profilePicture'
    ].forEach(f => set(f, req.body[f]));

    const u = await user.save();
    res.json({
      _id: u._id, username: u.username, email: u.email, bio: u.bio, phone: u.phone,
      website: u.website, gender: u.gender, language: u.language, country: u.country,
      profileVisibility: u.profileVisibility, statusMessage: u.statusMessage, theme: u.theme,
      twoFactorEnabled: u.twoFactorEnabled, loginAlerts: u.loginAlerts,
      emailNotifications: u.emailNotifications, pushNotifications: u.pushNotifications,
      workspaceUpdates: u.workspaceUpdates, mentionAlerts: u.mentionAlerts,
      profilePicture: u.profilePicture, role: u.role, token: genToken(u._id, u.role),
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

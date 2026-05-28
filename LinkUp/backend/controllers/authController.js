const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'supersecret_gatherly_jwt_key_2026', {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Please add all fields' });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Email is already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            role: 'user' // Default to user
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            if (user.isBlocked) {
                return res.status(403).json({ message: 'Your account has been blocked by an administrator.' });
            }
            
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authenticate an admin
// @route   POST /api/auth/admin/login
exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            // Strictly check for admin role
            if (user.role !== 'admin') {
                return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
            }

            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
    try {
        const { 
            id, username, email, bio, phone, website, gender, profilePicture, 
            language, country, profileVisibility, statusMessage, theme,
            twoFactorEnabled, loginAlerts, emailNotifications, 
            pushNotifications, workspaceUpdates, mentionAlerts 
        } = req.body;

        if (!id) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.username = username || user.username;
        user.email = email || user.email;
        user.bio = bio !== undefined ? bio : user.bio;
        user.phone = phone !== undefined ? phone : user.phone;
        user.website = website !== undefined ? website : user.website;
        user.gender = gender !== undefined ? gender : user.gender;
        user.language = language !== undefined ? language : user.language;
        user.country = country !== undefined ? country : user.country;
        user.profileVisibility = profileVisibility !== undefined ? profileVisibility : user.profileVisibility;
        user.statusMessage = statusMessage !== undefined ? statusMessage : user.statusMessage;
        user.theme = theme !== undefined ? theme : user.theme;
        
        user.twoFactorEnabled = twoFactorEnabled !== undefined ? twoFactorEnabled : user.twoFactorEnabled;
        user.loginAlerts = loginAlerts !== undefined ? loginAlerts : user.loginAlerts;
        user.emailNotifications = emailNotifications !== undefined ? emailNotifications : user.emailNotifications;
        user.pushNotifications = pushNotifications !== undefined ? pushNotifications : user.pushNotifications;
        user.workspaceUpdates = workspaceUpdates !== undefined ? workspaceUpdates : user.workspaceUpdates;
        user.mentionAlerts = mentionAlerts !== undefined ? mentionAlerts : user.mentionAlerts;

        if (profilePicture !== undefined) {
            user.profilePicture = profilePicture;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            bio: updatedUser.bio,
            phone: updatedUser.phone,
            website: updatedUser.website,
            gender: updatedUser.gender,
            language: updatedUser.language,
            country: updatedUser.country,
            profileVisibility: updatedUser.profileVisibility,
            statusMessage: updatedUser.statusMessage,
            theme: updatedUser.theme,
            twoFactorEnabled: updatedUser.twoFactorEnabled,
            loginAlerts: updatedUser.loginAlerts,
            emailNotifications: updatedUser.emailNotifications,
            pushNotifications: updatedUser.pushNotifications,
            workspaceUpdates: updatedUser.workspaceUpdates,
            mentionAlerts: updatedUser.mentionAlerts,
            profilePicture: updatedUser.profilePicture,
            role: updatedUser.role,
            token: generateToken(updatedUser._id, updatedUser.role),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

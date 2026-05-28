const express = require('express');
const router = express.Router();
const { register, login, adminLogin, updateProfile } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.put('/profile', updateProfile);

module.exports = router;

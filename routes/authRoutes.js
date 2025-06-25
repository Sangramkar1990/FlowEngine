const express = require('express');
const { register, login, getMe, logout, updatePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validateRegistration = require('../middleware/validateRegistration');

const router = express.Router();

// Auth routes
router.post('/register', validateRegistration, register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/logout', logout);
router.put('/update-password', protect, updatePassword);

module.exports = router;

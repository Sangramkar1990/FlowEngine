const express = require('express');
const { register, login, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validateRegistration = require('../middleware/validateRegistration');

const router = express.Router();

// Auth routes
router.post('/register', validateRegistration, register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/logout', logout);

module.exports = router;

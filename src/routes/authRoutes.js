const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const authValidators = require('../validators/authValidators');
const { authLimiter } = require('../middleware/rateLimiter');

// Public routes
router.post('/register', authLimiter, validate(authValidators.register), AuthController.register);
router.post('/login', authLimiter, validate(authValidators.login), AuthController.login);
router.post('/refresh', validate(authValidators.refreshToken), AuthController.refreshToken);

// Protected routes
router.use(authMiddleware);
router.post('/logout', AuthController.logout);
router.get('/me', AuthController.getMe);
router.put('/profile', AuthController.updateProfile);
router.put('/change-password', validate(authValidators.changePassword), AuthController.changePassword);

module.exports = router;

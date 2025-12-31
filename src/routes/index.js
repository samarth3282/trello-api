const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const projectRoutes = require('./projectRoutes');
const boardRoutes = require('./boardRoutes');
const taskRoutes = require('./taskRoutes');
const commentRoutes = require('./commentRoutes');

// API Routes
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/boards', boardRoutes);
router.use('/tasks', taskRoutes);
router.use('/comments', commentRoutes);

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;

"use strict";
const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes').default;
const userRoutes = require('./user.routes').default;
const gymRoutes = require('./gym.routes').default;
const roleRoutes = require('./role.routes').default;
const trainerMatchRoutes = require('./trainerMatch.routes').default;
const exerciseRoutes = require('./exercise.routes').default;
const programRoutes = require('./program.routes').default;
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/gyms', gymRoutes);
router.use('/roles', roleRoutes);
router.use('/trainer-matches', trainerMatchRoutes);
router.use('/exercises', exerciseRoutes);
router.use('/programs', programRoutes);
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'API routes are working!'
    });
});
module.exports = router;
//# sourceMappingURL=index.js.map
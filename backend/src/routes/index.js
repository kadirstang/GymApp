const express = require('express');
const router = express.Router();

// Import route modules (TypeScript routes will be compiled)
const authRoutes = require('./auth.routes').default;
const userRoutes = require('./user.routes').default;
const gymRoutes = require('./gym.routes').default;
const roleRoutes = require('./role.routes').default;
const trainerMatchRoutes = require('./trainerMatch.routes').default;
const exerciseRoutes = require('./exercise.routes').default;
const programRoutes = require('./program.routes').default;
const workoutLogRoutes = require('./workoutLog.routes').default;
const equipmentRoutes = require('./equipment.routes').default;
const productCategoryRoutes = require('./productCategory.routes').default;
const productRoutes = require('./product.routes').default;
const orderRoutes = require('./order.routes').default;
const analyticsRoutes = require('./analytics.routes').default;

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/gyms', gymRoutes);
router.use('/roles', roleRoutes);
router.use('/trainer-matches', trainerMatchRoutes);
router.use('/exercises', exerciseRoutes);
router.use('/programs', programRoutes); // Program exercises are nested: /programs/:programId/exercises
router.use('/workout-logs', workoutLogRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/product-categories', productCategoryRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/analytics', analyticsRoutes);

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API routes are working!'
  });
});

module.exports = router;

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// 🔒 User validation helper
const validateUserData = (userData) => {
  const { role, gymId } = userData;

  // SUPER_ADMIN gymId'ye sahip olmamalı
  if (role === 'SUPER_ADMIN' && gymId !== null) {
    throw new Error('SuperAdmin cannot be assigned to a gym');
  }

  // Diğer tüm roller gymId'ye sahip olmalı
  if (role !== 'SUPER_ADMIN' && !gymId) {
    throw new Error('Non-SuperAdmin users must be assigned to a gym');
  }

  return true;
};

// JWT Token oluşturma
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      gymId: user.gymId,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Token doğrulama middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // User'ın hala var olduğunu kontrol et
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { gym: true }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// SuperAdmin yetkisi kontrolü
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'SuperAdmin access required' });
  }
  next();
};

// Gym Owner yetkisi kontrolü
const requireOwner = (req, res, next) => {
  if (req.user.role !== 'OWNER' && req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'Owner or SuperAdmin access required' });
  }
  next();
};

// Gym Coach+ yetkisi kontrolü
const requireCoach = (req, res, next) => {
  if (!['COACH', 'OWNER', 'SUPER_ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Coach or higher access required' });
  }
  next();
};

// Aynı gym'e erişim kontrolü (SuperAdmin hariç)
const requireSameGym = (req, res, next) => {
  if (req.user.role === 'SUPER_ADMIN') {
    return next(); // SuperAdmin her gym'e erişebilir
  }

  const targetGymId = parseInt(req.params.gymId || req.body.gymId);

  if (req.user.gymId !== targetGymId) {
    return res.status(403).json({ message: 'Access denied to this gym' });
  }
  next();
};

module.exports = {
  generateToken,
  authenticateToken,
  requireSuperAdmin,
  requireOwner,
  requireCoach,
  requireSameGym,
  validateUserData
};

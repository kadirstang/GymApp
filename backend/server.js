require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const {
  generateToken,
  authenticateToken,
  requireSuperAdmin,
  requireOwner,
  requireCoach,
  requireSameGym,
  validateUserData
} = require('./middleware/auth');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', message: 'Gym OS API is running!' });
});

// 🔐 AUTH ENDPOINTS
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { gym: true }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      token,
      userType: user.role === 'SUPER_ADMIN' ? 'superadmin' : 'gym_user'
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, gymName } = req.body;
  if (!email || !password || !gymName) {
    return res.status(400).json({ message: 'Email, password, and gym name are required.' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // SuperAdmin sabit bilgileri
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@gymos.com';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';
    const superAdminName = process.env.SUPER_ADMIN_NAME || 'Kadir (SuperAdmin)';
    const hashedSuperAdminPassword = await bcrypt.hash(superAdminPassword, 10);

    const result = await prisma.$transaction(async (tx) => {
      // Yeni gym oluştur
      const newGym = await tx.gym.create({
        data: {
          name: gymName,
        },
      });

      // 🔒 Gym owner validation
      const ownerData = {
        email: email,
        password: hashedPassword,
        name: name,
        role: 'OWNER',
        gymId: newGym.id,
      };
      validateUserData(ownerData);

      // Gym owner'ı oluştur
      const newUser = await tx.user.create({
        data: ownerData,
      });

      // Bu gym için SuperAdmin ekle (sadece bu gymde yoksa)
      const existingSuperAdmin = await tx.user.findFirst({
        where: {
          email: superAdminEmail,
        },
      });

      let superAdmin = null;
      if (!existingSuperAdmin) {
        // 🔒 SuperAdmin validation
        const superAdminData = {
          email: superAdminEmail,
          password: hashedSuperAdminPassword,
          name: superAdminName,
          role: 'SUPER_ADMIN',
          gymId: null,
        };
        validateUserData(superAdminData);

        superAdmin = await tx.user.create({
          data: superAdminData,
        });
      }

      return { newUser, superAdmin, gym: newGym };
    });

    const { password: _, ...userWithoutPassword } = result.newUser;
    res.status(201).json({
      user: userWithoutPassword,
      gym: result.gym,
      superAdminAdded: !!result.superAdmin
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Email already in use.' });
    }
    res.status(500).json({ message: 'Something went wrong.', error: error.message });
  }
});

// 🏢 SUPERADMIN ENDPOINTS
// SuperAdmin Dashboard
app.get('/api/superadmin/dashboard', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const [gymCount, userCount, ownerCount, coachCount, memberCount] = await Promise.all([
      prisma.gym.count(),
      prisma.user.count(),
      prisma.user.count({ where: { role: 'OWNER' } }),
      prisma.user.count({ where: { role: 'COACH' } }),
      prisma.user.count({ where: { role: 'MEMBER' } })
    ]);

    const recentGyms = await prisma.gym.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          where: { role: 'OWNER' },
          select: { name: true, email: true }
        }
      }
    });

    res.json({
      stats: {
        gymCount,
        userCount,
        ownerCount,
        coachCount,
        memberCount
      },
      recentGyms
    });
  } catch (error) {
    res.status(500).json({ message: 'Dashboard data fetch failed', error: error.message });
  }
});

// SuperAdmin - Tüm Gym'leri Listele
app.get('/api/superadmin/gyms', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const where = search ? {
      name: {
        contains: search,
        mode: 'insensitive'
      }
    } : {};

    const [gyms, totalCount] = await Promise.all([
      prisma.gym.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.gym.count({ where })
    ]);

    res.json({
      gyms,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch gyms', error: error.message });
  }
});

// SuperAdmin - Gym Detayları
app.get('/api/superadmin/gyms/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const gym = await prisma.gym.findUnique({
      where: { id: parseInt(id) },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!gym) {
      return res.status(404).json({ message: 'Gym not found' });
    }

    res.json(gym);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch gym details', error: error.message });
  }
});

// SuperAdmin - Gym Güncelle
app.put('/api/superadmin/gyms/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, logoUrl, primaryColor } = req.body;

  try {
    const updatedGym = await prisma.gym.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(primaryColor !== undefined && { primaryColor })
      }
    });

    res.json(updatedGym);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Gym not found' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Gym name already exists' });
    }
    res.status(500).json({ message: 'Failed to update gym', error: error.message });
  }
});

// SuperAdmin - Gym Sil
app.delete('/api/superadmin/gyms/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.$transaction(async (tx) => {
      // Önce gym'deki tüm kullanıcıları sil
      await tx.user.deleteMany({
        where: { gymId: parseInt(id) }
      });

      // Sonra gym'i sil
      await tx.gym.delete({
        where: { id: parseInt(id) }
      });
    });

    res.json({ message: 'Gym and all associated users deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Gym not found' });
    }
    res.status(500).json({ message: 'Failed to delete gym', error: error.message });
  }
});

// SuperAdmin - Tüm Kullanıcıları Listele
app.get('/api/superadmin/users', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role || '';

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(role && role !== 'ALL' && { role }),
      // SuperAdmin'leri hariç tut (sadece gym kullanıcıları)
      role: { not: 'SUPER_ADMIN' }
    };

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          gym: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    // Şifreleri kaldır
    const safeUsers = users.map(({ password, ...user }) => user);

    res.json({
      users: safeUsers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

// SuperAdmin - Kullanıcı Detayları
app.get('/api/superadmin/users/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        gym: {
          select: { id: true, name: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
});

// SuperAdmin - Kullanıcı Güncelle
app.put('/api/superadmin/users/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, email, role, gymId } = req.body;

  try {
    const updateData = {
      ...(name && { name }),
      ...(email && { email }),
      ...(role && { role }),
      ...(gymId !== undefined && { gymId: gymId ? parseInt(gymId) : null })
    };

    // 🔒 Validation: Role ve gymId uyumluluğu
    if (updateData.role || updateData.gymId !== undefined) {
      const currentUser = await prisma.user.findUnique({
        where: { id: parseInt(id) }
      });

      const finalData = {
        role: updateData.role || currentUser.role,
        gymId: updateData.gymId !== undefined ? updateData.gymId : currentUser.gymId
      };

      validateUserData(finalData);
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        gym: {
          select: { id: true, name: true }
        }
      }
    });

    const { password, ...safeUser } = updatedUser;
    res.json(safeUser);
  } catch (error) {
    if (error.message.includes('SuperAdmin') || error.message.includes('gym')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
});

// SuperAdmin - Kullanıcı Sil
app.delete('/api/superadmin/users/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Cannot delete SuperAdmin users' });
    }

    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
});

// SuperAdmin - Profil Güncelleme
app.put('/api/superadmin/profile', authenticateToken, requireSuperAdmin, async (req, res) => {
  const { name, email, currentPassword, newPassword } = req.body;

  try {
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;

    // Şifre değişikliği isteniyorsa
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password required for password change' });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, req.user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData
    });

    const { password, ...safeUser } = updatedUser;
    res.json(safeUser);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

// 🏋️ GYM ENDPOINTS (Existing endpoints updated)
app.get('/api/gyms', async (req, res) => {
  try {
    const gyms = await prisma.gym.findMany();
    res.json(gyms);
  } catch (error) {
    res.status(500).json({ message: "Couldn't fetch gyms", error: error.message });
  }
});

app.get('/api/gyms/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const gym = await prisma.gym.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    if (!gym) {
      return res.status(404).json({ message: 'Gym not found' });
    }
    res.json(gym);
  } catch (error) {
    res.status(500).json({ message: "Couldn't fetch gym", error: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});

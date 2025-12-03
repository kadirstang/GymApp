const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateRolesForOrders() {
  try {
    // Update Trainer role
    const trainer = await prisma.role.findFirst({ where: { name: 'Trainer' } });
    if (trainer) {
      const trainerPermissions = {
        ...trainer.permissions,
        orders: {
          create: true,
          read: true,
          update: true,
          delete: true,
        },
      };

      await prisma.role.update({
        where: { id: trainer.id },
        data: { permissions: trainerPermissions }
      });
      console.log('✓ Trainer role updated with order permissions');
    }

    // Update Student role
    const student = await prisma.role.findFirst({ where: { name: 'Student' } });
    if (student) {
      const studentPermissions = {
        ...student.permissions,
        orders: {
          create: true,
          read: true,
          delete: true, // Can cancel their own pending orders
        },
      };

      await prisma.role.update({
        where: { id: student.id },
        data: { permissions: studentPermissions }
      });
      console.log('✓ Student role updated with order permissions (create, read, delete own)');
    }

    // Update GymOwner role
    const owner = await prisma.role.findFirst({ where: { name: 'GymOwner' } });
    if (owner) {
      const ownerPermissions = {
        ...owner.permissions,
        orders: {
          create: true,
          read: true,
          update: true,
          delete: true,
        },
      };

      await prisma.role.update({
        where: { id: owner.id },
        data: { permissions: ownerPermissions }
      });
      console.log('✓ GymOwner role updated with order permissions');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateRolesForOrders();

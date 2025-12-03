const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateRolesForProducts() {
  try {
    // Update Trainer role
    const trainer = await prisma.role.findFirst({ where: { name: 'Trainer' } });
    if (trainer) {
      const trainerPermissions = {
        ...trainer.permissions,
        products: {
          create: true,
          read: true,
          update: true,
          delete: true,
        },
        productCategories: {
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
      console.log('✓ Trainer role updated with product & category permissions');
    }

    // Update Student role
    const student = await prisma.role.findFirst({ where: { name: 'Student' } });
    if (student) {
      const studentPermissions = {
        ...student.permissions,
        products: {
          read: true,
        },
        productCategories: {
          read: true,
        },
      };

      await prisma.role.update({
        where: { id: student.id },
        data: { permissions: studentPermissions }
      });
      console.log('✓ Student role updated with product & category read permissions');
    }

    // Update GymOwner role
    const owner = await prisma.role.findFirst({ where: { name: 'GymOwner' } });
    if (owner) {
      const ownerPermissions = {
        ...owner.permissions,
        products: {
          create: true,
          read: true,
          update: true,
          delete: true,
        },
        productCategories: {
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
      console.log('✓ GymOwner role updated with product & category permissions');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateRolesForProducts();

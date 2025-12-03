const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateTrainerRole() {
  try {
    const trainer = await prisma.role.findFirst({ where: { name: 'Trainer' } });
    if (!trainer) {
      console.log('Trainer role not found');
      return;
    }

    const permissions = {
      ...trainer.permissions,
      equipment: {
        create: true,
        read: true,
        update: true,
        delete: true,
      },
    };

    await prisma.role.update({
      where: { id: trainer.id },
      data: { permissions }
    });

    console.log('✓ Trainer role updated with equipment permissions');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateTrainerRole();

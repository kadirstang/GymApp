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
      trainer_matches: {
        create: true,
        read: true,
        update: true,
        delete: true,
      },
      workoutLogs: {
        create: true,
        read: true,
        update: true,
        delete: true,
      },
      programs: {
        ...trainer.permissions.programs,
        create: true,
        read: true,
        update: true,
        delete: true,
      },
      programExercises: {
        create: true,
        read: true,
        update: true,
        delete: true,
      },
      exercises: {
        read: true,
        create: true,
        update: true,
        delete: true,
      },
    };

    await prisma.role.update({
      where: { id: trainer.id },
      data: { permissions }
    });

    console.log('✓ Trainer role updated with workout log permissions');
    console.log('New permissions:', JSON.stringify(permissions, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateTrainerRole();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateStudentRole() {
  try {
    const student = await prisma.role.findFirst({ where: { name: 'Student' } });
    if (!student) {
      console.log('Student role not found');
      return;
    }

    const permissions = {
      ...student.permissions,
      workoutLogs: {
        create: true,
        read: true,
        update: true,
        delete: true,
      },
      programs: {
        read: true,
      },
      exercises: {
        read: true,
      },
      equipment: {
        read: true,
      },
    };

    await prisma.role.update({
      where: { id: student.id },
      data: { permissions }
    });

    console.log('✓ Student role updated with workout log permissions');
    console.log('New permissions:', JSON.stringify(permissions, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateStudentRole();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getTestData() {
  try {
    const gym = await prisma.gym.findFirst({
      select: { id: true, name: true, slug: true }
    });

    const studentRole = await prisma.role.findFirst({
      where: { name: 'Student' },
      select: { id: true, name: true }
    });

    console.log('\n=== Test Data for Auth Registration ===\n');
    console.log('Gym:');
    console.log(JSON.stringify(gym, null, 2));
    console.log('\nStudent Role:');
    console.log(JSON.stringify(studentRole, null, 2));
    console.log('\n=======================================\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getTestData();

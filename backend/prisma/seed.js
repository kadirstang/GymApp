const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create a test gym
  const gym = await prisma.gym.upsert({
    where: { slug: 'test-gym' },
    update: {},
    create: {
      name: 'Test Gym',
      slug: 'test-gym',
      address: '123 Fitness Street, City',
      contactPhone: '+1234567890',
      isActive: true,
    },
  });
  console.log('✅ Gym created:', gym.name);

  // 2. Create roles
  const gymOwnerRole = await prisma.role.upsert({
    where: { gymId_name: { gymId: gym.id, name: 'GymOwner' } },
    update: {
      permissions: {
        users: { read: true, create: true, update: true, delete: true },
        roles: { read: true, create: true, update: true, delete: true },
        gyms: { read: true, update: true },
        trainers: { read: true, create: true, update: true, delete: true },
        students: { read: true, create: true, update: true, delete: true },
        programs: { read: true, create: true, update: true, delete: true },
        exercises: { read: true, create: true, update: true, delete: true },
        equipment: { read: true, create: true, update: true, delete: true },
        products: { read: true, create: true, update: true, delete: true },
        orders: { read: true, create: true, update: true, delete: true },
      },
    },
    create: {
      gymId: gym.id,
      name: 'GymOwner',
      permissions: {
        users: { read: true, create: true, update: true, delete: true },
        roles: { read: true, create: true, update: true, delete: true },
        gyms: { read: true, update: true },
        trainers: { read: true, create: true, update: true, delete: true },
        students: { read: true, create: true, update: true, delete: true },
        programs: { read: true, create: true, update: true, delete: true },
        exercises: { read: true, create: true, update: true, delete: true },
        equipment: { read: true, create: true, update: true, delete: true },
        products: { read: true, create: true, update: true, delete: true },
        orders: { read: true, create: true, update: true, delete: true },
      },
    },
  });

  const trainerRole = await prisma.role.upsert({
    where: { gymId_name: { gymId: gym.id, name: 'Trainer' } },
    update: {
      permissions: {
        users: { read: true },
        students: { read: true, update: true },
        programs: { read: true, create: true, update: true, delete: true },
        exercises: { read: true },
        workouts: { read: true },
      },
    },
    create: {
      gymId: gym.id,
      name: 'Trainer',
      permissions: {
        users: { read: true },
        students: { read: true, update: true },
        programs: { read: true, create: true, update: true, delete: true },
        exercises: { read: true },
        workouts: { read: true },
      },
    },
  });

  const studentRole = await prisma.role.upsert({
    where: { gymId_name: { gymId: gym.id, name: 'Student' } },
    update: {},
    create: {
      gymId: gym.id,
      name: 'Student',
      permissions: {
        canViewOwnPrograms: true,
        canLogWorkouts: true,
        canViewOwnProgress: true,
        canOrderProducts: true,
      },
    },
  });
  console.log('✅ Roles created: GymOwner, Trainer, Student');

  // 3. Create users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@testgym.com' },
    update: {},
    create: {
      gymId: gym.id,
      roleId: gymOwnerRole.id,
      email: 'owner@testgym.com',
      passwordHash: hashedPassword,
      firstName: 'John',
      lastName: 'Owner',
      phone: '+1234567890',
    },
  });

  const trainer = await prisma.user.upsert({
    where: { email: 'trainer@testgym.com' },
    update: {},
    create: {
      gymId: gym.id,
      roleId: trainerRole.id,
      email: 'trainer@testgym.com',
      passwordHash: hashedPassword,
      firstName: 'Mike',
      lastName: 'Trainer',
      phone: '+1234567891',
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@testgym.com' },
    update: {},
    create: {
      gymId: gym.id,
      roleId: studentRole.id,
      email: 'student@testgym.com',
      passwordHash: hashedPassword,
      firstName: 'Alice',
      lastName: 'Student',
      phone: '+1234567892',
      birthDate: new Date('1995-05-15'),
      gender: 'Female',
    },
  });
  console.log('✅ Users created: Owner, Trainer, Student');

  // 4. Create exercises
  const exercises = [
    {
      name: 'Bench Press',
      description: 'Chest exercise using barbell',
      targetMuscleGroup: 'Chest',
      videoUrl: 'https://youtube.com/watch?v=example1',
    },
    {
      name: 'Squat',
      description: 'Leg exercise using barbell',
      targetMuscleGroup: 'Legs',
      videoUrl: 'https://youtube.com/watch?v=example2',
    },
    {
      name: 'Deadlift',
      description: 'Full body exercise using barbell',
      targetMuscleGroup: 'Back',
      videoUrl: 'https://youtube.com/watch?v=example3',
    },
    {
      name: 'Pull Up',
      description: 'Back exercise using bodyweight',
      targetMuscleGroup: 'Back',
      videoUrl: 'https://youtube.com/watch?v=example4',
    },
  ];

  for (const ex of exercises) {
    const existing = await prisma.exercise.findFirst({
      where: {
        gymId: gym.id,
        name: ex.name
      }
    });

    if (!existing) {
      await prisma.exercise.create({
        data: {
          gymId: gym.id,
          ...ex,
        },
      });
    }
  }
  console.log('✅ Exercises created: 4 exercises');

  // 5. Create equipment
  await prisma.equipment.create({
    data: {
      gymId: gym.id,
      name: 'Bench Press Station',
      description: 'Adjustable bench press with safety bars',
      videoUrl: 'https://youtube.com/watch?v=bench-tutorial',
      status: 'active',
    },
  });
  console.log('✅ Equipment created: Bench Press Station');

  // 6. Create product category and products
  const category = await prisma.productCategory.create({
    data: {
      gymId: gym.id,
      name: 'Supplements',
      imageUrl: 'https://example.com/supplements.jpg',
    },
  });

  await prisma.product.createMany({
    data: [
      {
        gymId: gym.id,
        categoryId: category.id,
        name: 'Whey Protein',
        description: '100% whey protein isolate',
        price: 49.99,
        stockQuantity: 50,
        isActive: true,
      },
      {
        gymId: gym.id,
        categoryId: category.id,
        name: 'Creatine Monohydrate',
        description: 'Pure creatine powder',
        price: 29.99,
        stockQuantity: 30,
        isActive: true,
      },
    ],
  });
  console.log('✅ Products created: Whey Protein, Creatine');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📝 Test credentials:');
  console.log('Owner: owner@testgym.com / password123');
  console.log('Trainer: trainer@testgym.com / password123');
  console.log('Student: student@testgym.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

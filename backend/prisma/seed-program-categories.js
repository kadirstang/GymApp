const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedProgramCategories() {
  console.log('🌱 Seeding program categories...');

  const categories = [
    {
      name: 'Strength Training',
      description: 'Build muscle mass and increase overall strength',
      icon: 'barbell',
      orderIndex: 1,
    },
    {
      name: 'Cardio & Conditioning',
      description: 'Improve cardiovascular fitness and endurance',
      icon: 'heart',
      orderIndex: 2,
    },
    {
      name: 'Flexibility & Mobility',
      description: 'Enhance range of motion and prevent injuries',
      icon: 'body',
      orderIndex: 3,
    },
    {
      name: 'Weight Loss',
      description: 'Fat burning and body composition improvement',
      icon: 'trending-down',
      orderIndex: 4,
    },
    {
      name: 'Muscle Building',
      description: 'Hypertrophy-focused programs for muscle growth',
      icon: 'fitness',
      orderIndex: 5,
    },
    {
      name: 'Beginner Orientation',
      description: 'Introduction to gym equipment and basic movements',
      icon: 'school',
      orderIndex: 6,
    },
  ];

  for (const category of categories) {
    const existing = await prisma.programCategory.findFirst({
      where: { name: category.name },
    });

    if (!existing) {
      await prisma.programCategory.create({
        data: category,
      });
      console.log(`✅ Created category: ${category.name}`);
    } else {
      console.log(`⏭️  Category already exists: ${category.name}`);
    }
  }

  console.log('✅ Program categories seeded successfully!');
}

seedProgramCategories()
  .catch((e) => {
    console.error('❌ Error seeding program categories:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

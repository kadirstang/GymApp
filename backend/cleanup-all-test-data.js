const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupAll() {
  try {
    console.log('🧹 Starting complete database cleanup...\n');

    // Delete in correct order (respecting foreign key constraints)

    // 1. Order items first
    const orderItems = await prisma.orderItem.deleteMany({});
    console.log(`✓ Deleted ${orderItems.count} order items`);

    // 2. Orders
    const orders = await prisma.order.deleteMany({});
    console.log(`✓ Deleted ${orders.count} orders`);

    // 3. Products
    const products = await prisma.product.deleteMany({});
    console.log(`✓ Deleted ${products.count} products`);

    // 4. Product categories
    const categories = await prisma.productCategory.deleteMany({});
    console.log(`✓ Deleted ${categories.count} product categories`);

    // 5. Equipment
    const equipment = await prisma.equipment.deleteMany({});
    console.log(`✓ Deleted ${equipment.count} equipment`);

    // 6. Workout log entries
    const logEntries = await prisma.workoutLogEntry.deleteMany({});
    console.log(`✓ Deleted ${logEntries.count} workout log entries`);

    // 7. Workout logs
    const workoutLogs = await prisma.workoutLog.deleteMany({});
    console.log(`✓ Deleted ${workoutLogs.count} workout logs`);

    // 8. Program exercises
    const programExercises = await prisma.programExercise.deleteMany({});
    console.log(`✓ Deleted ${programExercises.count} program exercises`);

    // 9. Workout programs
    const programs = await prisma.workoutProgram.deleteMany({});
    console.log(`✓ Deleted ${programs.count} workout programs`);

    // 10. Exercises
    const exercises = await prisma.exercise.deleteMany({});
    console.log(`✓ Deleted ${exercises.count} exercises`);

    // 11. Trainer matches
    const matches = await prisma.trainerMatch.deleteMany({});
    console.log(`✓ Deleted ${matches.count} trainer matches`);

    // 12. User measurements
    const measurements = await prisma.userMeasurement.deleteMany({});
    console.log(`✓ Deleted ${measurements.count} user measurements`);

    console.log('\n✅ Database cleanup completed successfully!');
    console.log('📝 Note: Users, Roles, and Gyms are preserved for testing\n');

  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupAll();

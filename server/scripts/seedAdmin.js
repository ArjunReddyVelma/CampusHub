require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('Error: MONGODB_URI environment variable is missing.');
      process.exit(1);
    }

    const adminName = process.env.ADMIN_NAME;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminName || !adminEmail || !adminPassword) {
      console.error('Error: ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be configured.');
      process.exit(1);
    }

    // Connect to database
    await mongoose.connect(mongoUri);
    console.log('Database connected successfully.');

    // Check if an admin already exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('An administrator account already exists. Skipping seeding process.');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Seed the initial administrator
    await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      mustChangePassword: false,
      accountSource: 'system',
      isActive: true
    });

    console.log('System administrator account seeded successfully.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(`Seeding error: ${err.message}`);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  }
};

seedAdmin();

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User';
import Wallet from './src/models/Wallet';
import bcrypt from 'bcryptjs';

dotenv.config();

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not defined');
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({ role: { $in: ['tutor', 'verified_tutor'] } });
    console.log('Cleared existing tutors');

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);

    const tutors = [
      {
        name: 'Ahmad Musa',
        email: 'ahmad.musa@abu.edu.ng',
        password,
        role: 'verified_tutor',
        admissionId: 'U21CO1015',
        department: 'Computer Engineering',
        faculty: 'Engineering',
        level: '400L',
        courses: ['COEN453', 'MATH201', 'CCSN311'],
        rating: 4.9,
        sessionsCompleted: 45,
        hourlyRate: 800,
        about: 'Final year Computer Engineering student specializing in Software Design and Algorithms.',
        availability: 'Mon-Fri: 4pm - 8pm'
      },
      {
        name: 'Fatima Ibrahim',
        email: 'fatima.ib@abu.edu.ng',
        password,
        role: 'verified_tutor',
        admissionId: 'U21CO1026',
        department: 'Software Engineering',
        faculty: 'Engineering',
        level: '300L',
        courses: ['CCSN411', 'MATH101'],
        rating: 4.7,
        sessionsCompleted: 28,
        hourlyRate: 700,
        about: 'Passionate about coding and tutoring.',
        availability: 'Sat-Sun: 10am - 4pm'
      },
      {
        name: 'John Okafor',
        email: 'john.okafor@abu.edu.ng',
        password,
        role: 'tutor',
        admissionId: 'U21CO1089',
        department: 'Mathematics',
        faculty: 'Science',
        level: '200L',
        courses: ['MATH101', 'MATH102'],
        rating: 0,
        sessionsCompleted: 0,
        hourlyRate: 500,
        about: 'Mathematics enthusiast.',
        availability: 'Mon-Wed: 2pm - 5pm'
      }
    ];

    for (const tutor of tutors) {
       const newUser = await User.create(tutor as any);
       await Wallet.create({ userId: newUser._id, balance: 0, transactions: [] });
    }

    console.log('Successfully seeded 3 tutors with wallets');
    process.exit();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();

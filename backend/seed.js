"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = __importDefault(require("./src/models/User"));
const Wallet_1 = __importDefault(require("./src/models/Wallet"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
dotenv_1.default.config();
const seedData = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri)
            throw new Error('MONGODB_URI not defined');
        await mongoose_1.default.connect(mongoUri);
        console.log('Connected to MongoDB');
        // Clear existing data
        await User_1.default.deleteMany({ role: { $in: ['tutor', 'verified_tutor'] } });
        console.log('Cleared existing tutors');
        const salt = await bcryptjs_1.default.genSalt(10);
        const password = await bcryptjs_1.default.hash('password123', salt);
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
            const newUser = await User_1.default.create(tutor);
            await Wallet_1.default.create({ userId: newUser._id, balance: 0, transactions: [] });
        }
        console.log('Successfully seeded 3 tutors with wallets');
        process.exit();
    }
    catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};
seedData();
//# sourceMappingURL=seed.js.map
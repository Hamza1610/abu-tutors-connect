import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/abututors";

const seedAdmin = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB...");

        const adminEmail = "admin@abututors.com";
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log("Admin user already exists.");
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("admin123", salt);

        const admin = new User({
            name: "System Admin",
            email: adminEmail,
            password: hashedPassword,
            role: "admin",
            acceptedTerms: true,
            isProfileComplete: true,
            isApproved: true,
            registrationNumber: "ADMIN001"
        });

        await admin.save();
        console.log("Admin user created successfully!");
        console.log("Email: admin@abututors.com");
        console.log("Password: admin123");
        
        process.exit(0);
    } catch (error) {
        console.error("Error seeding admin:", error);
        process.exit(1);
    }
};

seedAdmin();

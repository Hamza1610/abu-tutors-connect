import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/abututors";

const resetAdmin = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB...");

        const adminEmail = "admin@abututors.com";
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("admin123", salt);

        const result = await User.findOneAndUpdate(
            { email: adminEmail },
            { 
                password: hashedPassword,
                role: 'admin',
                isApproved: true,
                isProfileComplete: true
            },
            { upsert: true, new: true }
        );

        console.log("Admin account reset/created successfully!");
        console.log("Email:", result.email);
        console.log("Password set to: admin123");
        
        process.exit(0);
    } catch (error) {
        console.error("Error resetting admin:", error);
        process.exit(1);
    }
};

resetAdmin();

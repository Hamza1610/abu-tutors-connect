import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/abututors";

const setAdmin = async (email: string) => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB...");

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.log(`User with email ${email} not found.`);
            process.exit(1);
        }

        user.role = 'admin';
        user.isApproved = true;
        user.isProfileComplete = true;
        
        await user.save();
        
        console.log(`Successfully promoted ${email} to ADMIN status.`);
        console.log("Details:");
        console.log(`- Name: ${user.name}`);
        console.log(`- Role: ${user.role}`);
        console.log(`- Approved: ${user.isApproved}`);
        
        process.exit(0);
    } catch (error) {
        console.error("Error setting admin status:", error);
        process.exit(1);
    }
};

const targetEmail = "saminuumar2027@gmail.com";
setAdmin(targetEmail);

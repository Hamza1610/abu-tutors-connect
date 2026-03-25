import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Session from './models/Session';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/abututors";

const migrate = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB for migration...");

        const result = await Session.updateMany(
            { venue: { $exists: false } },
            { $set: { venue: 'Not Specified' } }
        );

        console.log(`Migration completed: ${result.modifiedCount} sessions updated.`);
        process.exit(0);
    } catch (error) {
        console.error("Migration error:", error);
        process.exit(1);
    }
};

migrate();

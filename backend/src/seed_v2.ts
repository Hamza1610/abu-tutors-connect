import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Settings from './models/Settings';
import Venue from './models/Venue';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/abututors";

const seed = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB for seeding...");

        // Seed System Settings
        const settingsCount = await Settings.countDocuments();
        if (settingsCount === 0) {
            await Settings.create({});
            console.log("Default system settings created.");
        }

        // Seed Venues
        const venueCount = await Venue.countDocuments();
        if (venueCount === 0) {
            const venues = [
                { name: 'Wolfson Theatre', location: 'Faculty of Engineering' },
                { name: 'Umaru Shehu Theatre', location: 'College of Medicine' },
                { name: 'Abdullahi Smith Hall', location: 'Faculty of Arts' },
                { name: 'Long Hall', location: 'Faculty of Education' }
            ];
            await Venue.insertMany(venues);
            console.log("Default venues created.");
        }

        console.log("Seeding completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Seeding error:", error);
        process.exit(1);
    }
};

seed();

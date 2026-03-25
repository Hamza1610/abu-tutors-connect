"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Settings_1 = __importDefault(require("./models/Settings"));
const Venue_1 = __importDefault(require("./models/Venue"));
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/abututors";
const seed = async () => {
    try {
        await mongoose_1.default.connect(MONGODB_URI);
        console.log("Connected to MongoDB for seeding...");
        // Seed System Settings
        const settingsCount = await Settings_1.default.countDocuments();
        if (settingsCount === 0) {
            await Settings_1.default.create({});
            console.log("Default system settings created.");
        }
        // Seed Venues
        const venueCount = await Venue_1.default.countDocuments();
        if (venueCount === 0) {
            const venues = [
                { name: 'Wolfson Theatre', location: 'Faculty of Engineering' },
                { name: 'Umaru Shehu Theatre', location: 'College of Medicine' },
                { name: 'Abdullahi Smith Hall', location: 'Faculty of Arts' },
                { name: 'Long Hall', location: 'Faculty of Education' }
            ];
            await Venue_1.default.insertMany(venues);
            console.log("Default venues created.");
        }
        console.log("Seeding completed successfully.");
        process.exit(0);
    }
    catch (error) {
        console.error("Seeding error:", error);
        process.exit(1);
    }
};
seed();
//# sourceMappingURL=seed_v2.js.map
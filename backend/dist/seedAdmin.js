"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = __importDefault(require("./models/User"));
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/abututors";
const seedAdmin = async () => {
    try {
        await mongoose_1.default.connect(MONGODB_URI);
        console.log("Connected to MongoDB...");
        const adminEmail = "admin@abututors.com";
        const existingAdmin = await User_1.default.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log("Admin user already exists.");
            process.exit(0);
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash("admin123", salt);
        const admin = new User_1.default({
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
    }
    catch (error) {
        console.error("Error seeding admin:", error);
        process.exit(1);
    }
};
seedAdmin();
//# sourceMappingURL=seedAdmin.js.map
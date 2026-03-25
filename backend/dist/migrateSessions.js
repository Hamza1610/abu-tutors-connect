"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Session_1 = __importDefault(require("./models/Session"));
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/abututors";
const migrate = async () => {
    try {
        await mongoose_1.default.connect(MONGODB_URI);
        console.log("Connected to MongoDB for migration...");
        const result = await Session_1.default.updateMany({ venue: { $exists: false } }, { $set: { venue: 'Not Specified' } });
        console.log(`Migration completed: ${result.modifiedCount} sessions updated.`);
        process.exit(0);
    }
    catch (error) {
        console.error("Migration error:", error);
        process.exit(1);
    }
};
migrate();
//# sourceMappingURL=migrateSessions.js.map
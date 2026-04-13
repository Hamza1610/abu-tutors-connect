const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/abututors";

const SettingsSchema = new mongoose.Schema({
    isRegistrationFree: Boolean,
    registrationFee: Number
}, { strict: false });

const Settings = mongoose.model('Settings', SettingsSchema);

async function diagnose() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");
        
        const allSettings = await Settings.find({});
        console.log(`Found ${allSettings.length} settings documents`);
        
        allSettings.forEach((s, i) => {
            console.log(`Settings ${i}:`, JSON.stringify(s, null, 2));
        });
        
        const first = await Settings.findOne();
        console.log("Settings.findOne() would return:", JSON.stringify(first, null, 2));
        
        process.exit(0);
    } catch (err) {
        console.error("Diagnosis Error:", err);
        process.exit(1);
    }
}

diagnose();

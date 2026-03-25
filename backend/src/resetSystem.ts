import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import User from './models/User';
import Session from './models/Session';
import Escrow from './models/Escrow';
import Wallet from './models/Wallet';
import AdminLog from './models/AdminLog';
import NotificationModel from './models/Notification';
import SlotLock from './models/SlotLock';
import logger from './utils/logger';

dotenv.config();

const RESET_PASSWORD = process.env.RESET_PASSWORD || 'ABUTutorsReset2026';

async function resetSystem() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/abututors";
        console.log('--- SYSTEM RESET INITIATED ---');
        console.log('Connecting to database...');
        await mongoose.connect(MONGODB_URI);
        
        // 1. Delete all non-admin users
        console.log('Deleting non-admin users...');
        const userDeleteResult = await User.deleteMany({ role: { $ne: 'admin' } });
        console.log(`Deleted ${userDeleteResult.deletedCount} users.`);

        // 2. Clear all sessions and escrows
        console.log('Clearing sessions, escrows, and wallets...');
        await Session.deleteMany({});
        await Escrow.deleteMany({});
        await Wallet.deleteMany({}); // Wallets for deleted users are gone anyway, but good to clear all
        await SlotLock.deleteMany({});
        console.log('Cleared all transactional data.');

        // 3. Clear admin activities (but keep admin users)
        console.log('Clearing admin activity logs...');
        await AdminLog.deleteMany({});
        console.log('Cleared all admin activity logs.');

        // 4. Clear notifications
        console.log('Clearing all notifications...');
        await NotificationModel.deleteMany({});
        console.log('Cleared all notifications.');

        // 5. Cleanup uploads directory
        console.log('Cleaning up uploaded documents...');
        const uploadsDir = path.join(__dirname, '../uploads');
        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            for (const file of files) {
                if (file !== '.gitkeep') {
                    fs.unlinkSync(path.join(uploadsDir, file));
                }
            }
            console.log('Cleaned up uploads directory.');
        }

        console.log('\n--- SYSTEM RESET COMPLETE ---');
        console.log('Admin accounts preserved. All other data purged.');
        
        await mongoose.connection.close();
        process.exit(0);
    } catch (error: any) {
        console.error('CRITICAL ERROR DURING RESET:', error.message);
        process.exit(1);
    }
}

// Security Check: Only run if manually triggered or with environment flag
if (process.argv.includes('--confirm-reset')) {
    resetSystem();
} else {
    console.log('Reset cancelled. Use --confirm-reset flag to proceed.');
    process.exit(0);
}

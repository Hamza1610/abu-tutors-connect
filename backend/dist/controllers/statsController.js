"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTutorStats = void 0;
const Session_1 = __importDefault(require("../models/Session"));
const Wallet_1 = __importDefault(require("../models/Wallet"));
const logger_1 = __importDefault(require("../utils/logger"));
// @desc    Get tutor dashboard statistics
// @route   GET /api/stats/tutor
// @access  Private (Tutor)
const getTutorStats = async (req, res) => {
    try {
        const tutorId = req.user.id;
        // 1. Total Earnings from Wallet transactions
        const wallet = await Wallet_1.default.findOne({ userId: tutorId });
        const totalEarnings = wallet ? wallet.balance : 0; // Simplified for MVP: current balance as proxy for earnings
        // 2. Session Counts
        const completedSessions = await Session_1.default.countDocuments({ tutorId, status: 'completed' });
        const pendingSessions = await Session_1.default.countDocuments({ tutorId, status: 'pending' });
        const activeSessions = await Session_1.default.countDocuments({ tutorId, status: 'active' });
        // 3. Monthly Earnings (Current Month)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const monthlyTx = wallet?.transactions.filter(tx => tx.type === 'credit' && tx.date >= startOfMonth) || [];
        const monthlyEarnings = monthlyTx.reduce((sum, tx) => sum + tx.amount, 0);
        res.json({
            totalEarnings,
            monthlyEarnings,
            completedSessions,
            pendingSessions,
            activeSessions,
            rating: req.user.rating || 4.8 // Fallback rating
        });
    }
    catch (error) {
        logger_1.default.error(`Get Tutor Stats Error: ${error.message}`, { error });
        res.status(500).json({ message: 'Server error fetching tutor stats', error: error.message });
    }
};
exports.getTutorStats = getTutorStats;
//# sourceMappingURL=statsController.js.map
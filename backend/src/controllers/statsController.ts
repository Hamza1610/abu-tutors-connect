import { Request, Response } from 'express';
import Session from '../models/Session';
import Wallet from '../models/Wallet';
import logger from '../utils/logger';

// @desc    Get tutor dashboard statistics
// @route   GET /api/stats/tutor
// @access  Private (Tutor)
export const getTutorStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const tutorId = req.user.id;

        // 1. Total Earnings from Wallet transactions
        const wallet = await Wallet.findOne({ userId: tutorId });
        const totalEarnings = wallet ? wallet.balance : 0; // Simplified for MVP: current balance as proxy for earnings

        // 2. Session Counts
        const completedSessions = await Session.countDocuments({ tutorId, status: 'completed' });
        const pendingSessions = await Session.countDocuments({ tutorId, status: 'pending' });
        const activeSessions = await Session.countDocuments({ tutorId, status: 'active' });

        // 3. Monthly Earnings (Current Month)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyTx = wallet?.transactions.filter(tx => 
            tx.type === 'credit' && tx.date >= startOfMonth
        ) || [];
        const monthlyEarnings = monthlyTx.reduce((sum, tx) => sum + tx.amount, 0);

        res.json({
            totalEarnings,
            monthlyEarnings,
            completedSessions,
            pendingSessions,
            activeSessions,
            rating: req.user.rating || 4.8 // Fallback rating
        });
    } catch (error: any) {
        logger.error(`Get Tutor Stats Error: ${error.message}`, { error });
        res.status(500).json({ message: 'Server error fetching tutor stats', error: error.message });
    }
};

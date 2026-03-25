import { Request as ExpressRequest, Response } from 'express';
import User from '../models/User';
import Settings from '../models/Settings';
import Venue from '../models/Venue';
import Session from '../models/Session';
import Wallet from '../models/Wallet';
import Escrow from '../models/Escrow';
import AdminLog from '../models/AdminLog';
import logger from '../utils/logger';

interface Request extends ExpressRequest {
    user?: any;
}

// @desc    Get all pending tutors for approval
// @route   GET /api/admin/pending-tutors
// @access  Private/Admin
export const getPendingTutors = async (req: Request, res: Response): Promise<void> => {
    try {
        const tutors = await User.find({ 
            role: { $in: ['tutor', 'verified_tutor'] }, 
            isProfileComplete: true, 
            isApproved: false 
        }).select('-password');
        res.json(tutors);
    } catch (error: any) {
        logger.error(`Get Pending Tutors Error: ${error.message}`);
        res.status(500).json({ message: "Server error getting pending tutors" });
    }
};

// @desc    Approve or reject a tutor
// @route   PUT /api/admin/tutors/:id/approve
// @access  Private/Admin
export const approveTutor = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status } = req.body; // 'approve' or 'reject'
        const user = await User.findById(req.params.id);

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        if (status === 'approve') {
            user.isApproved = true;
            await AdminLog.create({
                adminId: req.user.id,
                action: 'APPROVE_TUTOR',
                targetId: user._id.toString(),
                details: `Approved tutor ${user.email}`
            });
            logger.info(`Tutor ${user.email} approved by admin`);
        } else {
            user.isApproved = false;
            user.isProfileComplete = false; // Reset profile completion for rejection
            await AdminLog.create({
                adminId: req.user.id,
                action: 'REJECT_TUTOR',
                targetId: user._id.toString(),
                details: `Rejected tutor ${user.email}`
            });
            logger.info(`Tutor ${user.email} rejected by admin`);
        }

        await user.save();
        res.json({ message: `Tutor ${status}d successfully`, user });
    } catch (error: any) {
        logger.error(`Approve Tutor Error: ${error.message}`);
        res.status(500).json({ message: "Server error during tutor approval" });
    }
};

// @desc    Get system settings
// @route   GET /api/admin/settings
// @access  Public (some fields) / Private (all fields)
export const getSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const settings = await Settings.findOne() || await Settings.create({});
        res.json(settings);
    } catch (error: any) {
        logger.error(`Get Settings Error: ${error.message}`);
        res.status(500).json({ message: "Server error getting settings" });
    }
};

// @desc    Update system settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
export const updateSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        let settings = await Settings.findOne();
        if (!settings) settings = new Settings({});

        settings.maxHourlyRate = req.body.maxHourlyRate ?? settings.maxHourlyRate;
        settings.registrationFee = req.body.registrationFee ?? settings.registrationFee;
        settings.isRegistrationFree = (req.body.isRegistrationFree !== undefined) ? req.body.isRegistrationFree : settings.isRegistrationFree;
        settings.minSessionsForVerify = req.body.minSessionsForVerify ?? settings.minSessionsForVerify;
        settings.minRatingForVerify = req.body.minRatingForVerify ?? settings.minRatingForVerify;
        settings.noShowPayoutPercent = req.body.noShowPayoutPercent ?? settings.noShowPayoutPercent;
        settings.platformCommissionPercent = req.body.platformCommissionPercent ?? settings.platformCommissionPercent;

        await settings.save();
        res.json(settings);
    } catch (error: any) {
        logger.error(`Update Settings Error: ${error.message}`);
        res.status(500).json({ message: "Server error updating settings" });
    }
};

// --- Venue Management ---

// @desc    Add a new venue
// @route   POST /api/admin/venues
// @access  Private/Admin
export const addVenue = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, location } = req.body;
        const venue = await Venue.create({ name, location });
        res.status(201).json(venue);
    } catch (error: any) {
        logger.error(`Add Venue Error: ${error.message}`);
        res.status(500).json({ message: "Server error adding venue" });
    }
};

// @desc    Get all venues
// @route   GET /api/admin/venues
// @access  Public (usually) or Private/Admin
export const getVenues = async (req: any, res: Response): Promise<void> => {
    try {
        const venues = await Venue.find().sort({ name: 1 });
        res.json(venues);
    } catch (error: any) {
        logger.error(`Get Venues Error: ${error.message}`);
        res.status(500).json({ message: "Server error getting venues" });
    }
};

// @desc    Update a venue
// @route   PUT /api/admin/venues/:id
// @access  Private/Admin
export const updateVenue = async (req: Request, res: Response): Promise<void> => {
    try {
        const venue = await Venue.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!venue) {
            res.status(404).json({ message: "Venue not found" });
            return;
        }
        res.json(venue);
    } catch (error: any) {
        logger.error(`Update Venue Error: ${error.message}`);
        res.status(500).json({ message: "Server error updating venue" });
    }
};

// @desc    Delete a venue
// @route   DELETE /api/admin/venues/:id
// @access  Private/Admin
export const deleteVenue = async (req: Request, res: Response): Promise<void> => {
    try {
        const venue = await Venue.findByIdAndDelete(req.params.id);
        if (!venue) {
            res.status(404).json({ message: "Venue not found" });
            return;
        }
        res.json({ message: "Venue deleted successfully" });
    } catch (error: any) {
        logger.error(`Delete Venue Error: ${error.message}`);
        res.status(500).json({ message: "Server error deleting venue" });
    }
};

// --- User Management ---

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error: any) {
        logger.error(`Get All Users Error: ${error.message}`);
        res.status(500).json({ message: "Server error getting users" });
    }
};

// @desc    Update user status (Suspend/Deactivate)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { role, isApproved } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        const oldRole = user.role;
        if (role) user.role = role;
        if (typeof isApproved === 'boolean') user.isApproved = isApproved;

        await user.save();

        await AdminLog.create({
            adminId: req.user.id,
            action: 'UPDATE_USER_STATUS',
            targetId: user._id.toString(),
            details: `Updated ${user.email}: Role ${oldRole}->${user.role}, Approved: ${user.isApproved}`
        });

        res.json({ message: "User status updated", user });
    } catch (error: any) {
        logger.error(`Update User Status Error: ${error.message}`);
        res.status(500).json({ message: "Server error updating user status" });
    }
};

// --- Session Monitoring ---

// @desc    Get all platform sessions
// @route   GET /api/admin/sessions
// @access  Private/Admin
export const getAllSessions = async (req: Request, res: Response): Promise<void> => {
    try {
        const sessions = await Session.find()
            .populate('tutorId', 'name email')
            .populate('tuteeId', 'name email')
            .sort({ createdAt: -1 })
            .limit(200);
        res.json(sessions);
    } catch (error: any) {
        logger.error(`Get All Sessions Error: ${error.message}`);
        res.status(500).json({ message: "Server error getting sessions" });
    }
};

// @desc    Admin session override (Cancel/Release)
// @route   PUT /api/admin/sessions/:id/override
// @access  Private/Admin
export const overrideSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, escrowStatus } = req.body;
        const session = await Session.findById(req.params.id);

        if (!session) {
            res.status(404).json({ message: "Session not found" });
            return;
        }

        if (status) session.status = status;
        if (escrowStatus) session.escrowStatus = escrowStatus;

        await session.save();
        
        await AdminLog.create({
            adminId: req.user.id,
            action: 'SESSION_OVERRIDE',
            targetId: session._id.toString(),
            details: `Manual override: Status->${status}, Escrow->${escrowStatus}`
        });

        res.json({ message: "Session updated by admin", session });
    } catch (error: any) {
        logger.error(`Session Override Error: ${error.message}`);
        res.status(500).json({ message: "Server error overriding session" });
    }
};

// --- Financial Monitoring ---

// @desc    Get platform financial overview
// @route   GET /api/admin/finances
// @access  Private/Admin
export const getFinancialStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const wallets = await Wallet.find();
        const totalWalletBalance = wallets.reduce((acc, w) => acc + w.balance, 0);
        
        const heldEscrows = await Escrow.find({ status: 'held' });
        const totalEscrowBalance = heldEscrows.reduce((acc, e) => acc + e.amount, 0);

        // Transaction counts in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentWalletActivity = wallets.reduce((acc, w) => {
            const recent = w.transactions.filter(t => new Date(t.date) > thirtyDaysAgo);
            return acc + recent.length;
        }, 0);

        const admin = await User.findOne({ role: 'admin' });
        let adminBalance = 0;
        if (admin) {
            const adminWallet = await Wallet.findOne({ userId: admin._id });
            adminBalance = adminWallet ? adminWallet.balance : 0;
        }

        res.json({
            totalWalletBalance,
            totalEscrowBalance,
            recentWalletActivity,
            adminBalance,
            platformFees: adminBalance, // Total revenue collected by admin so far
        });
    } catch (error: any) {
        logger.error(`Get Financial Stats Error: ${error.message}`);
        res.status(500).json({ message: "Server error getting finances" });
    }
};

// @desc    Reconcile Session escrowStatus with Escrow records
// @route   POST /api/admin/reconcile-escrow
// @access  Private/Admin
export const reconcileEscrows = async (req: Request, res: Response): Promise<void> => {
    try {
        const sessions = await Session.find({ escrowStatus: { $ne: 'none' } });
        let fixedCount = 0;

        for (const session of sessions) {
            const escrow = await Escrow.findOne({ sessionId: session._id });
            if (escrow && session.escrowStatus !== escrow.status as any) {
                logger.info(`Reconciling session ${session._id}: ${session.escrowStatus} -> ${escrow.status}`);
                session.escrowStatus = escrow.status as any;
                await session.save();
                fixedCount++;
            }
        }

        await AdminLog.create({
            adminId: req.user.id,
            action: 'RECONCILE_ESCROW',
            details: `Manually reconciled ${fixedCount} session escrow statuses.`
        });

        res.json({ message: `Reconciliation complete. Fixed ${fixedCount} sessions.`, fixedCount });
    } catch (error: any) {
        logger.error(`Reconcile Escrow Error: ${error.message}`);
        res.status(500).json({ message: "Server error during reconciliation" });
    }
};

// --- Activity History ---

// @desc    Get admin activity logs
// @route   GET /api/admin/logs
// @access  Private/Admin
export const getAdminLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const logs = await AdminLog.find()
            .populate('adminId', 'name email')
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(logs);
    } catch (error: any) {
        logger.error(`Get Admin Logs Error: ${error.message}`);
        res.status(500).json({ message: "Server error getting admin logs" });
    }
};

// --- Automated Tutor Upgrade Logic ---

export const checkTutorUpgrade = async (tutorId: string) => {
    try {
        const tutor = await User.findById(tutorId);
        if (!tutor || tutor.role === 'verified_tutor') return;

        const settings = await Settings.findOne() || await Settings.create({});
        
        if (tutor.sessionsCompleted >= settings.minSessionsForVerify && 
            tutor.averageRating >= settings.minRatingForVerify) {
            tutor.role = 'verified_tutor';
            await tutor.save();
            logger.info(`Tutor ${tutor.email} upgraded to Verified Status`);
        }
    } catch (error: any) {
        logger.error(`Tutor Upgrade Check Error: ${error.message}`);
    }
};

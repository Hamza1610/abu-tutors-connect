import { Request as ExpressRequest, Response } from 'express';
import Session from '../models/Session';
import Wallet from '../models/Wallet';
import User from '../models/User';
import NotificationModel from '../models/Notification';
import Escrow from '../models/Escrow';
import logger from '../utils/logger';
import mongoose from 'mongoose';
import Settings from '../models/Settings';
import { checkTutorUpgrade } from './adminController';
import { IUser } from '../models/User';
import SlotLock from '../models/SlotLock';

// Extend Request for local use if needed, though global namespace should handle it
interface Request extends ExpressRequest {
    user?: any;
}

// @desc    Book a new tutoring session
// @route   POST /api/sessions
// @access  Private (Tutee)
export const createSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const { tutorId, date, time, topic, amount, venue } = req.body;
        const tuteeId = req.user.id;

        // 1. Verify Tutor exists
        const tutor = await User.findById(tutorId);
        if (!tutor || (tutor.role !== 'tutor' && tutor.role !== 'verified_tutor')) {
            res.status(404).json({ message: 'Tutor not found' });
            return;
        }

        // 1.5 Check if slot is already taken or locked by someone else
        const slotTime = `${date}T${time}`;
        const existingSession = await Session.findOne({ 
            tutorId, 
            date: new Date(date), 
            time, 
            status: { $in: ['pending', 'active', 'completed'] } 
        });
        if (existingSession) {
            res.status(400).json({ message: 'Tutor is already booked for this slot' });
            return;
        }

        const activeLock = await SlotLock.findOne({ tutorId, slot: slotTime });
        if (activeLock && activeLock.tuteeId.toString() !== tuteeId) {
            res.status(400).json({ message: 'This slot is temporarily locked by another student' });
            return;
        }

        // 2. Pricing Enforcement & Validation from System Settings
        const settings = await Settings.findOne() || await Settings.create({});
        let finalizedAmount = 500; // Default for newbie
        
        if (tutor.role === 'verified_tutor') {
            const requestedAmount = Number(amount);
            const tutorRate = tutor.hourlyRate || finalizedAmount;
            
            // Ensure the amount matches the tutor's set rate and is within admin threshold
            if (requestedAmount > settings.maxHourlyRate) {
                res.status(400).json({ message: `Amount exceeds the system maximum of ₦${settings.maxHourlyRate}/hr` });
                return;
            }
            if (requestedAmount !== tutorRate) {
                res.status(400).json({ message: `Amount must match tutor's hourly rate of ₦${tutorRate}` });
                return;
            }
            finalizedAmount = requestedAmount;
        } else {
            // Newbie tutors use the default or a specific newbie rate
            finalizedAmount = 500; 
        }

        // 3. Check Tutee Wallet Balance
        const tuteeWallet = await Wallet.findOne({ userId: tuteeId });
        if (!tuteeWallet || tuteeWallet.balance < finalizedAmount) {
            res.status(400).json({ message: 'Insufficient wallet balance' });
            return;
        }

        // 4. Create Session with status 'pending'
        const newSession = new Session({
            tutorId,
            tuteeId,
            date: new Date(date),
            time,
            topic,
            venue,
            amount: finalizedAmount,
            status: 'pending',
            escrowStatus: 'held', // Sync with Escrow record
            startQRCodeData: `start_${Math.random().toString(36).substring(7)}_${tuteeId}`,
            completionQRCodeData: `complete_${Math.random().toString(36).substring(7)}_${tuteeId}`,
            startPIN: Math.floor(100000 + Math.random() * 900000).toString(),
            completionPIN: Math.floor(100000 + Math.random() * 900000).toString()
        });

        // 5. Save Session and Deduct from Tutee Wallet -> Move to Escrow
        await newSession.save();

        tuteeWallet.balance -= finalizedAmount;
        tuteeWallet.transactions.push({
            type: 'debit',
            amount: finalizedAmount,
            description: `Escrow held for session with ${tutor.name}`,
            date: new Date(),
            reference: (newSession._id as any).toString()
        });
        await tuteeWallet.save();

        // 6. Create Escrow Record
        await Escrow.create({
            tuteeId,
            tutorId,
            sessionId: newSession._id,
            amount: finalizedAmount,
            status: 'held'
        });

        // 7. Trigger Notification for Tutor (Renamed to NotificationModel)
        await NotificationModel.create({
            userId: tutorId,
            title: 'New Session Booked',
            message: `You have a new session booking for "${topic}" on ${new Date(date).toLocaleDateString()}.`,
            type: 'session',
            link: '/tutor-dashboard'
        });

        // 7.5 Remove slot from Tutor's availability matrix
        try {
            const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const sessionDate = new Date(date);
            const dayName = dayNames[sessionDate.getDay()];
            
            if (tutor.availability && Array.isArray(tutor.availability)) {
                let updated = false;
                const newAvailability = tutor.availability.map((avail: any) => {
                    if (avail.day === dayName && Array.isArray(avail.slots)) {
                        const originalCount = avail.slots.length;
                        avail.slots = avail.slots.filter((s: string) => s !== time);
                        if (avail.slots.length !== originalCount) updated = true;
                    }
                    return avail;
                });

                if (updated) {
                    await User.findByIdAndUpdate(tutorId, { availability: newAvailability });
                    logger.info(`Removed slot ${dayName} ${time} from Tutor ${tutorId} availability`);
                }
            }
        } catch (availError: any) {
            logger.error(`Failed to update tutor availability: ${availError.message}`);
            // Don't fail the whole booking if this fails
        }

        // 8. Clear Lock if exists
        await SlotLock.deleteOne({ tutorId, slot: slotTime, tuteeId });

        logger.info(`Session booked: Tutee ${tuteeId} -> Tutor ${tutorId}`);
        res.status(201).json(newSession);
    } catch (error: any) {
        logger.error(`Create Session Error: ${error.message}`, { error });
        res.status(500).json({ message: 'Server error booking session', error: error.message });
    }
};

// @desc    Get all sessions for current user (with lazy cleanup)
// @route   GET /api/sessions
// @access  Private
export const getUserSessions = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        
        // Lazy Cleanup of stale pending sessions (>15 mins past start)
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
        const staleSessions = await Session.find({
            status: 'pending',
            date: { $lte: new Date() },
            // This is tricky because 'time' is a string like "14:00".
            // For robust cleanup, we should compare the combined date-time.
        });

        for (const session of staleSessions) {
            const timeParts = session.time.split(':');
            const hours = parseInt(timeParts[0] || '0', 10);
            const mins = parseInt(timeParts[1] || '0', 10);
            const sessionStartTime = new Date(session.date);
            sessionStartTime.setHours(hours, mins, 0, 0);
            
            if (sessionStartTime < fifteenMinsAgo) {
                session.status = 'cancelled';
                session.escrowStatus = 'refunded';
                if (!session.venue) session.venue = 'Not Specified';
                await session.save();
                
                // Refund Escrow
                const escrow = await Escrow.findOne({ sessionId: session._id, status: 'held' });
                if (escrow) {
                    const tuteeWallet = await Wallet.findOne({ userId: session.tuteeId });
                    if (tuteeWallet) {
                        tuteeWallet.balance += escrow.amount;
                        tuteeWallet.transactions.push({
                            type: 'credit',
                            amount: escrow.amount,
                            description: `Auto-refund for stale session: ${session.topic}`,
                            date: new Date()
                        });
                        await tuteeWallet.save();
                    }
                    escrow.status = 'refunded';
                    await escrow.save();
                    logger.info(`Auto-cancelled stale session ${session._id}`);
                }
            }
        }

        const sessions = await Session.find({
            $or: [{ tutorId: userId }, { tuteeId: userId }]
        })
        .populate('tutorId', 'name role department documents')
        .populate('tuteeId', 'name role department documents')
        .sort({ date: 1, time: 1 });

        res.json(sessions);
    } catch (error: any) {
        logger.error(`Get Sessions Error: ${error.message}`, { error });
        res.status(500).json({ message: 'Server error fetching sessions', error: error.message });
    }
};

// @desc    Start a session (Tutor scans Tutee QR)
// @route   POST /api/sessions/:id/start
// @access  Private (Tutor)
export const startSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const tutorId = req.user.id;
        const { qrData, pin } = req.body;

        const session = await Session.findById(id);
        if (!session) {
            res.status(404).json({ message: 'Session not found' });
            return;
        }

        if (session.tutorId.toString() !== tutorId) {
            res.status(403).json({ message: 'Unauthorized: Only the assigned tutor can start this session' });
            return;
        }

        if (session.status !== 'pending') {
            res.status(400).json({ message: `Session already ${session.status}` });
            return;
        }

        // Verify QR Data OR PIN
        const isQRMatch = qrData && qrData === session.startQRCodeData;
        const isPinMatch = pin && pin === session.startPIN;

        if (!isQRMatch && !isPinMatch) {
            res.status(400).json({ message: 'Invalid Start QR Code or PIN' });
            return;
        }

        session.status = 'active';
        session.actualStartTime = new Date();
        await session.save();

        logger.info(`Session ${id} started at ${session.actualStartTime}`);
        res.json({ message: 'Session started successfully', session });
    } catch (error: any) {
        logger.error(`Start Session Error: ${error.message}`, { error });
        res.status(500).json({ message: 'Server error starting session' });
    }
};

// @desc    Complete a session (Tutor scans Tutee Completion QR)
// @route   POST /api/sessions/:id/complete
// @access  Private (Tutor)
export const completeSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { qrData, pin, rating } = req.body;

        const session = await Session.findById(id);
        if (!session) {
            res.status(404).json({ message: 'Session not found' });
            return;
        }

        if (session.tutorId.toString() !== req.user.id) {
            res.status(403).json({ message: 'Unauthorized: Only the assigned tutor can finalize this session' });
            return;
        }

        if (session.status !== 'active') {
            res.status(400).json({ message: 'Session must be active to complete' });
            return;
        }

        // Verify QR Data OR PIN
        const isQRMatch = qrData && qrData === session.completionQRCodeData;
        const isPinMatch = pin && pin === session.completionPIN;

        if (!isQRMatch && !isPinMatch) {
            res.status(400).json({ message: 'Invalid Completion QR Code or PIN' });
            return;
        }

        // 1. Update Session Status
        session.status = 'completed';
        session.escrowStatus = 'released';
        session.actualEndTime = new Date();
        await session.save();

        // 2. Release Escrow with 10% Commission
        const escrow = await Escrow.findOne({ sessionId: session._id, status: 'held' });
        if (escrow) {
            const settings = await Settings.findOne() || await Settings.create({});
            const commissionPercent = settings.platformCommissionPercent || 10;
            const commissionAmount = (escrow.amount * commissionPercent) / 100;
            const tutorEarnings = escrow.amount - commissionAmount;

            // 2a. Credit Tutor Wallet (90%)
            let tutorWallet = await Wallet.findOne({ userId: session.tutorId });
            if (!tutorWallet) {
                tutorWallet = new Wallet({ userId: session.tutorId, balance: 0, transactions: [] });
            }
            tutorWallet.balance += tutorEarnings;
            tutorWallet.transactions.push({
                type: 'credit',
                amount: tutorEarnings,
                description: `Earnings for session: ${session.topic}`,
                date: new Date(),
                reference: session._id.toString()
            });
            await tutorWallet.save();

            // 2b. Credit Admin Wallet (10%)
            const admin = await User.findOne({ role: 'admin' });
            if (admin) {
                let adminWallet = await Wallet.findOne({ userId: admin._id });
                if (!adminWallet) adminWallet = await Wallet.create({ userId: admin._id, balance: 0, transactions: [] });
                
                adminWallet.balance += commissionAmount;
                adminWallet.transactions.push({
                    type: 'credit',
                    amount: commissionAmount,
                    description: `Commission from session: ${session.topic} (Tutor: ${session.tutorId})`,
                    date: new Date(),
                    reference: session._id.toString()
                });
                await adminWallet.save();
            }

            escrow.status = 'released';
            await escrow.save();
        }

        // 3. Increment Tutor Stats & Check for Upgrade
        if (rating) {
            const tutor = await User.findById(session.tutorId);
            if (tutor) {
                tutor.averageRating = ((tutor.averageRating * tutor.sessionsCompleted) + rating) / (tutor.sessionsCompleted + 1);
                tutor.sessionsCompleted += 1;
                await tutor.save();
                await checkTutorUpgrade((tutor._id as any).toString());
            }
        } else {
            await User.findByIdAndUpdate(session.tutorId, { $inc: { sessionsCompleted: 1 } });
            await checkTutorUpgrade(session.tutorId.toString());
        }

        // 4. Notifications
        await NotificationModel.create({
            userId: session.tutorId,
            title: 'Payment Received',
            message: `Payment of ₦${session.amount} released for session on "${session.topic}".`,
            type: 'payment',
            link: '/wallet'
        });

        logger.info(`Session ${id} completed and escrow released`);
        res.json({ message: 'Session completed and payment released', session });
    } catch (error: any) {
        logger.error(`Complete Session Error: ${error.message}`, { error });
        res.status(500).json({ message: 'Server error completing session' });
    }
};

// @desc    Cancel session (Tutor No-Show or Tutee request within 15m)
// @route   POST /api/sessions/:id/cancel
// @access  Private
export const cancelSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const session = await Session.findById(id);

        if (!session) {
            res.status(404).json({ message: 'Session not found' });
            return;
        }

        if (session.status !== 'pending') {
            res.status(400).json({ message: 'Only pending sessions can be cancelled' });
            return;
        }

        // 1. Update Session Status
        session.status = 'cancelled';
        session.escrowStatus = 'refunded';
        await session.save();

        // 2. Resolve Escrow (Refund to Tutee)
        const escrow = await Escrow.findOne({ sessionId: session._id, status: 'held' });
        if (escrow) {
            let tuteeWallet = await Wallet.findOne({ userId: session.tuteeId });
            if (tuteeWallet) {
                tuteeWallet.balance += escrow.amount;
                tuteeWallet.transactions.push({
                    type: 'credit',
                    amount: escrow.amount,
                    description: `Refund for cancelled session: ${session.topic}`,
                    date: new Date(),
                    reference: session._id.toString()
                });
                await tuteeWallet.save();
            }
            escrow.status = 'refunded';
            await escrow.save();
        }

        logger.info(`Session ${id} cancelled and refunded`);
        res.json({ message: 'Session cancelled and fully refunded', session });
    } catch (error: any) {
        logger.error(`Cancel Session Error: ${error.message}`);
        res.status(500).json({ message: 'Server error cancelling session' });
    }
};

// @desc    Reschedule session
// @route   POST /api/sessions/:id/reschedule
// @access  Private
export const rescheduleSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { date, time } = req.body;
        const userId = req.user.id;

        if (!date || !time) {
            res.status(400).json({ message: 'New date and time are required' });
            return;
        }

        const session = await Session.findById(id);
        if (!session) {
            res.status(404).json({ message: 'Session not found' });
            return;
        }

        if (session.status !== 'pending') {
            res.status(400).json({ message: 'Only pending sessions can be rescheduled' });
            return;
        }

        // Verify user ownership
        if (session.tutorId.toString() !== userId && session.tuteeId.toString() !== userId) {
            res.status(403).json({ message: 'Unauthorized to reschedule this session' });
            return;
        }

        // Check for tutor availability
        const existingSession = await Session.findOne({ 
            tutorId: session.tutorId, 
            date: new Date(date), 
            time, 
            status: { $in: ['pending', 'active', 'completed'] },
            _id: { $ne: session._id } // Exclude current session
        });
        
        if (existingSession) {
            res.status(400).json({ message: 'Tutor is already booked for this new slot' });
            return;
        }

        // Update session
        const oldDate = session.date;
        const oldTime = session.time;
        session.date = new Date(date);
        session.time = time;
        await session.save();

        // Notify the other party
        const otherPartyId = session.tutorId.toString() === userId ? session.tuteeId : session.tutorId;
        const initiatorName = req.user.name || 'The other party';

        await NotificationModel.create({
            userId: otherPartyId,
            title: 'Session Rescheduled',
            message: `${initiatorName} has rescheduled your session for "${session.topic}" from ${new Date(oldDate).toLocaleDateString()} ${oldTime} to ${new Date(date).toLocaleDateString()} ${time}.`,
            type: 'session',
            link: '/my-sessions'
        });

        logger.info(`Session ${id} rescheduled to ${date} ${time} by ${userId}`);
        res.json({ message: 'Session rescheduled successfully', session });
    } catch (error: any) {
        logger.error(`Reschedule Session Error: ${error.message}`);
        res.status(500).json({ message: 'Server error rescheduling session' });
    }
};

// @desc    Report Tutee No-Show (Tutor receives percentage)
// @route   POST /api/sessions/:id/no-show
// @access  Private (Tutor)
export const reportTuteeNoShow = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const tutorId = req.user.id;

        const session = await Session.findById(id);
        if (!session) {
            res.status(404).json({ message: 'Session not found' });
            return;
        }

        if (session.tutorId.toString() !== tutorId) {
            res.status(403).json({ message: 'Unauthorized' });
            return;
        }

        if (session.status !== 'pending') {
            res.status(400).json({ message: 'Can only report no-show for pending sessions' });
            return;
        }

        // 1. Update Session Status
        session.status = 'cancelled';
        session.escrowStatus = 'released';
        await session.save();

        // 2. Resolve Escrow with partial payout
        const escrow = await Escrow.findOne({ sessionId: session._id, status: 'held' });
        const settings = await Settings.findOne() || await Settings.create({});
        const payoutPercent = settings.noShowPayoutPercent || 30;

        if (escrow) {
            const settings = await Settings.findOne() || await Settings.create({});
            const payoutPercent = settings.noShowPayoutPercent || 30;
            const commissionPercent = settings.platformCommissionPercent || 10;

            const baseTutorPayout = (escrow.amount * payoutPercent) / 100;
            const commissionAmount = (baseTutorPayout * commissionPercent) / 100;
            const netTutorPayout = baseTutorPayout - commissionAmount;
            const tuteeRefund = escrow.amount - baseTutorPayout;

            // Credit Tutor (Net)
            let tutorWallet = await Wallet.findOne({ userId: session.tutorId });
            if (!tutorWallet) tutorWallet = new Wallet({ userId: session.tutorId, balance: 0 });
            tutorWallet.balance += netTutorPayout;
            tutorWallet.transactions.push({
                type: 'credit',
                amount: netTutorPayout,
                description: `No-show payout (${payoutPercent}%) for session: ${session.topic}`,
                date: new Date(),
                reference: session._id.toString()
            });
            await tutorWallet.save();

            // Credit Admin (Commission on no-show payout)
            const admin = await User.findOne({ role: 'admin' });
            if (admin) {
                let adminWallet = await Wallet.findOne({ userId: admin._id });
                if (!adminWallet) adminWallet = await Wallet.create({ userId: admin._id, balance: 0 });
                adminWallet.balance += commissionAmount;
                adminWallet.transactions.push({
                    type: 'credit',
                    amount: commissionAmount,
                    description: `Commission from No-show: ${session.topic}`,
                    date: new Date(),
                    reference: session._id.toString()
                });
                await adminWallet.save();
            }

            // Refund Tutee
            let tuteeWallet = await Wallet.findOne({ userId: session.tuteeId });
            if (tuteeWallet) {
                tuteeWallet.balance += tuteeRefund;
                tuteeWallet.transactions.push({
                    type: 'credit',
                    amount: tuteeRefund,
                    description: `Partial refund for no-show session: ${session.topic}`,
                    date: new Date(),
                    reference: session._id.toString()
                });
                await tuteeWallet.save();
            }

            escrow.status = 'released';
            await escrow.save();
        }

        logger.info(`Tutee no-show reported for session ${id}.`);
        res.json({ message: 'Tutee no-show reported successfully', session });
    } catch (error: any) {
        logger.error(`No-Show Error: ${error.message}`);
        res.status(500).json({ message: 'Server error reporting no-show' });
    }
};

// @desc    Sync active session (Phase 4 Heartbeat)
// @route   POST /api/sessions/:id/sync
// @access  Private
export const syncSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { deviceTime } = req.body; // ISO String from client

        const session = await Session.findById(id);
        if (!session) {
            res.status(404).json({ message: 'Session not found' });
            return;
        }

        if (session.status !== 'active') {
            res.status(400).json({ message: 'Session is not active' });
            return;
        }

        const serverTime = new Date();
        const clientTime = new Date(deviceTime);
        const drift = Math.abs(serverTime.getTime() - clientTime.getTime());

        // Update last sync
        session.lastSyncTime = serverTime;
        await session.save();

        // 15 minute drift check as a warning (device clock issues)
        if (drift > 15 * 60 * 1000) {
            logger.warn(`Clock drift detected for session ${id}: ${drift / 1000}s`);
        }

        // Calculate theoretical end time (assuming 1 hour duration if not specified)
        // Note: We might want to add 'duration' to the Session model later
        const durationMs = 60 * 60 * 1000; 
        const endTime = new Date(session.actualStartTime!.getTime() + durationMs);
        const remainingMs = Math.max(0, endTime.getTime() - serverTime.getTime());

        res.json({
            status: 'active',
            serverTime: serverTime.toISOString(),
            remainingMs,
            isComplete: remainingMs <= 0
        });
    } catch (error: any) {
        logger.error(`Sync Session Error: ${error.message}`);
        res.status(500).json({ message: 'Server error syncing session' });
    }
};

// @desc    Lock a slot temporarily during selection (Phase 1)
// @route   POST /api/sessions/lock
// @access  Private (Tutee)
export const lockSlot = async (req: Request, res: Response): Promise<void> => {
    try {
        const { tutorId, slot } = req.body; // slot as ISO string or unique time ID
        const tuteeId = req.user.id;

        // Check if already booked
        const [datePart, timePart] = slot.split('T');
        const existingSession = await Session.findOne({ 
            tutorId, 
            date: new Date(datePart), 
            time: timePart,
            status: { $in: ['pending', 'active', 'completed'] }
        });

        if (existingSession) {
            res.status(400).json({ message: 'Slot already booked' });
            return;
        }

        // Try to create lock
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minute lock
        try {
            await SlotLock.create({ tutorId, slot, tuteeId, expiresAt });
            res.json({ message: 'Slot locked for 5 minutes', expiresAt });
        } catch (err: any) {
            if (err.code === 11000) {
                res.status(400).json({ message: 'Slot is already locked by another user' });
            } else {
                throw err;
            }
        }
    } catch (error: any) {
        logger.error(`Lock Slot Error: ${error.message}`);
        res.status(500).json({ message: 'Server error locking slot' });
    }
};

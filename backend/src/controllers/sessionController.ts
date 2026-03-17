import { Request, Response } from 'express';
import Session from '../models/Session';
import Wallet from '../models/Wallet';
import User from '../models/User';
import Notification from '../models/Notification';
import Escrow from '../models/Escrow';
import logger from '../utils/logger';
import mongoose from 'mongoose';
import { IUser } from '../models/User';

// @desc    Book a new tutoring session
// @route   POST /api/sessions
// @access  Private (Tutee)
export const createSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const { tutorId, date, time, topic, amount } = req.body;
        const tuteeId = req.user.id;

        // 1. Verify Tutor exists
        const tutor = await User.findById(tutorId);
        if (!tutor || (tutor.role !== 'tutor' && tutor.role !== 'verified_tutor')) {
            res.status(404).json({ message: 'Tutor not found' });
            return;
        }

        // 2. Pricing Enforcement & Validation
        // Newbie Tutor: Fixed at 500
        // Verified Tutor: 300 - 1000
        let finalizedAmount = 500;
        if (tutor.role === 'verified_tutor') {
            const requestedAmount = Number(amount);
            const tutorRate = tutor.hourlyRate || 500;
            // Ensure the amount matches the tutor's set rate and is within system threshold
            if (requestedAmount !== tutorRate || requestedAmount < 300 || requestedAmount > 1000) {
                res.status(400).json({ message: `Invalid amount. Verified tutors rate is ${tutorRate} (Threshold: 300-1000)` });
                return;
            }
            finalizedAmount = requestedAmount;
        } else {
            // Force newbie price
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
            amount: finalizedAmount,
            status: 'pending',
            qrCodeData: `session_start_${Date.now()}_${tuteeId}` // Tutee shows this to start
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

        // 5. Trigger Notification for Tutor
        await Notification.create({
            userId: tutorId,
            title: 'New Session Booked',
            message: `You have a new session booking for "${topic}" on ${new Date(date).toLocaleDateString()}.`,
            type: 'session',
            link: '/tutor-dashboard'
        });

        logger.info(`Session booked: Tutee ${tuteeId} -> Tutor ${tutorId}`);
        res.status(201).json(newSession);
    } catch (error: any) {
        logger.error(`Create Session Error: ${error.message}`, { error });
        res.status(500).json({ message: 'Server error booking session', error: error.message });
    }
};

// @desc    Get all sessions for current user
// @route   GET /api/sessions
// @access  Private
export const getUserSessions = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        const sessions = await Session.find({
            $or: [{ tutorId: userId }, { tuteeId: userId }]
        })
        .populate('tutorId', 'name role department')
        .populate('tuteeId', 'name role department')
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
        const { qrData } = req.body;

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

        // Verify QR Data matches expecting "session_start_..._{tuteeId}"
        if (!qrData.includes(session.tuteeId.toString())) {
            res.status(400).json({ message: 'Invalid QR Code for this tutee' });
            return;
        }

        session.status = 'active';
        session.qrCodeData = `session_complete_${Date.now()}_${session.tutorId}`; // Tutor shows this to complete
        await session.save();

        logger.info(`Session ${id} started`);
        res.json({ message: 'Session started successfully', session });
    } catch (error: any) {
        logger.error(`Start Session Error: ${error.message}`, { error });
        res.status(500).json({ message: 'Server error starting session' });
    }
};

// @desc    Complete a session (Tutee scans Tutor QR)
// @route   POST /api/sessions/:id/complete
// @access  Private (Tutee)
export const completeSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const tuteeId = req.user.id;
        const { qrData } = req.body;

        const session = await Session.findById(id);
        if (!session) {
            res.status(404).json({ message: 'Session not found' });
            return;
        }

        if (session.tuteeId.toString() !== tuteeId) {
            res.status(403).json({ message: 'Unauthorized: Only the tutee can complete this session' });
            return;
        }

        if (session.status !== 'active') {
            res.status(400).json({ message: 'Session must be active to complete' });
            return;
        }

        // Verify QR Data matches expecting "session_complete_..._{tutorId}"
        if (!qrData.includes(session.tutorId.toString())) {
            res.status(400).json({ message: 'Invalid QR Code for this tutor' });
            return;
        }

        // 1. Update Session Status
        session.status = 'completed';
        await session.save();

        // 2. Release Escrow
        const escrow = await Escrow.findOne({ sessionId: new mongoose.Types.ObjectId(id) as any, status: 'held' });
        if (escrow) {
            // Credit Tutor Wallet
            let tutorWallet = await Wallet.findOne({ userId: session.tutorId });
            if (!tutorWallet) {
                tutorWallet = new Wallet({ userId: session.tutorId, balance: 0, transactions: [] });
            }

            tutorWallet.balance += escrow.amount;
            tutorWallet.transactions.push({
                type: 'credit',
                amount: escrow.amount,
                description: `Payment for session: ${session.topic}`,
                date: new Date(),
                reference: session._id.toString()
            });
            await tutorWallet.save();

            escrow.status = 'released';
            await escrow.save();
        }

        // 3. Increment Tutor Stats
        await User.findByIdAndUpdate(session.tutorId, { $inc: { sessionsCompleted: 1 } });

        // 4. Notifications
        await Notification.create({
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

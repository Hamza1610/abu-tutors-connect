import { Request, Response } from 'express';
import Session from '../models/Session';
import Wallet from '../models/Wallet';
import User from '../models/User';
import Notification from '../models/Notification';
import logger from '../utils/logger';
import mongoose from 'mongoose';

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

        // 2. Check Tutee Wallet Balance
        const tuteeWallet = await Wallet.findOne({ userId: tuteeId });
        if (!tuteeWallet || tuteeWallet.balance < amount) {
            res.status(400).json({ message: 'Insufficient wallet balance' });
            return;
        }

        // 3. Create Session with status 'pending'
        const newSession = new Session({
            tutorId,
            tuteeId,
            date: new Date(date),
            time,
            topic,
            amount,
            status: 'pending',
            qrCodeData: `session_${Date.now()}_${tuteeId}_${tutorId}`
        });

        // 4. Save Session and Deduct from Tutee Wallet
        // Note: Sequential saves for standalone Mongo compatibility (non-transactional)
        await newSession.save();

        tuteeWallet.balance -= amount;
        tuteeWallet.transactions.push({
            type: 'debit',
            amount: amount,
            description: `Escrow for session with ${tutor.name}`,
            date: new Date(),
            reference: (newSession._id as any).toString()
        });
        await tuteeWallet.save();

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

// @desc    Complete a session (by Tutor)
// @route   POST /api/sessions/:id/complete
// @access  Private (Tutor)
export const completeSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const sessionId = req.params.id;
        const tutorIdFromToken = req.user.id;

        const sessionObj = await Session.findById(sessionId);
        if (!sessionObj) {
            res.status(404).json({ message: 'Session not found' });
            return;
        }

        if (sessionObj.tutorId.toString() !== tutorIdFromToken) {
            res.status(403).json({ message: 'Only the assigned tutor can complete the session' });
            return;
        }

        if (sessionObj.status !== 'pending' && sessionObj.status !== 'active') {
            res.status(400).json({ message: `Session cannot be completed from ${sessionObj.status} status` });
            return;
        }

        // 1. Update Session Status
        sessionObj.status = 'completed';
        await sessionObj.save();

        // 2. Credit Tutor Wallet
        let tutorWallet = await Wallet.findOne({ userId: tutorIdFromToken });
        if (!tutorWallet) {
            tutorWallet = new Wallet({ userId: tutorIdFromToken, balance: 0, transactions: [] });
        }

        tutorWallet.balance += sessionObj.amount;
        tutorWallet.transactions.push({
            type: 'credit',
            amount: sessionObj.amount,
            description: `Payment for session on ${sessionObj.date.toLocaleDateString()}`,
            date: new Date(),
            reference: (sessionObj._id as any).toString()
        });
        await tutorWallet.save();

        // 3. Increment Tutor Stats
        await User.findByIdAndUpdate(tutorIdFromToken, { $inc: { sessionsCompleted: 1 } });

        // 4. Trigger Notification for Tutee
        await Notification.create({
            userId: sessionObj.tuteeId,
            title: 'Session Completed',
            message: `Your session on "${sessionObj.topic}" has been marked as completed. Payment released to tutor.`,
            type: 'payment',
            link: '/my-sessions'
        });

        logger.info(`Session completed: ${sessionId}`);
        res.json({ message: 'Session completed successfully', session: sessionObj });
    } catch (error: any) {
        logger.error(`Complete Session Error: ${error.message}`, { error });
        res.status(500).json({ message: 'Server error completing session', error: error.message });
    }
};

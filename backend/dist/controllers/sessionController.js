"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeSession = exports.getUserSessions = exports.createSession = void 0;
const Session_1 = __importDefault(require("../models/Session"));
const Wallet_1 = __importDefault(require("../models/Wallet"));
const User_1 = __importDefault(require("../models/User"));
const Notification_1 = __importDefault(require("../models/Notification"));
const logger_1 = __importDefault(require("../utils/logger"));
// @desc    Book a new tutoring session
// @route   POST /api/sessions
// @access  Private (Tutee)
const createSession = async (req, res) => {
    try {
        const { tutorId, date, time, topic, amount } = req.body;
        const tuteeId = req.user.id;
        // 1. Verify Tutor exists
        const tutor = await User_1.default.findById(tutorId);
        if (!tutor || (tutor.role !== 'tutor' && tutor.role !== 'verified_tutor')) {
            res.status(404).json({ message: 'Tutor not found' });
            return;
        }
        // 2. Check Tutee Wallet Balance
        const tuteeWallet = await Wallet_1.default.findOne({ userId: tuteeId });
        if (!tuteeWallet || tuteeWallet.balance < amount) {
            res.status(400).json({ message: 'Insufficient wallet balance' });
            return;
        }
        // 3. Create Session with status 'pending'
        const newSession = new Session_1.default({
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
            reference: newSession._id.toString()
        });
        await tuteeWallet.save();
        // 5. Trigger Notification for Tutor
        await Notification_1.default.create({
            userId: tutorId,
            title: 'New Session Booked',
            message: `You have a new session booking for "${topic}" on ${new Date(date).toLocaleDateString()}.`,
            type: 'session',
            link: '/tutor-dashboard'
        });
        logger_1.default.info(`Session booked: Tutee ${tuteeId} -> Tutor ${tutorId}`);
        res.status(201).json(newSession);
    }
    catch (error) {
        logger_1.default.error(`Create Session Error: ${error.message}`, { error });
        res.status(500).json({ message: 'Server error booking session', error: error.message });
    }
};
exports.createSession = createSession;
// @desc    Get all sessions for current user
// @route   GET /api/sessions
// @access  Private
const getUserSessions = async (req, res) => {
    try {
        const userId = req.user.id;
        const sessions = await Session_1.default.find({
            $or: [{ tutorId: userId }, { tuteeId: userId }]
        })
            .populate('tutorId', 'name role department')
            .populate('tuteeId', 'name role department')
            .sort({ date: 1, time: 1 });
        res.json(sessions);
    }
    catch (error) {
        logger_1.default.error(`Get Sessions Error: ${error.message}`, { error });
        res.status(500).json({ message: 'Server error fetching sessions', error: error.message });
    }
};
exports.getUserSessions = getUserSessions;
// @desc    Complete a session (by Tutor)
// @route   POST /api/sessions/:id/complete
// @access  Private (Tutor)
const completeSession = async (req, res) => {
    try {
        const sessionId = req.params.id;
        const tutorIdFromToken = req.user.id;
        const sessionObj = await Session_1.default.findById(sessionId);
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
        let tutorWallet = await Wallet_1.default.findOne({ userId: tutorIdFromToken });
        if (!tutorWallet) {
            tutorWallet = new Wallet_1.default({ userId: tutorIdFromToken, balance: 0, transactions: [] });
        }
        tutorWallet.balance += sessionObj.amount;
        tutorWallet.transactions.push({
            type: 'credit',
            amount: sessionObj.amount,
            description: `Payment for session on ${sessionObj.date.toLocaleDateString()}`,
            date: new Date(),
            reference: sessionObj._id.toString()
        });
        await tutorWallet.save();
        // 3. Increment Tutor Stats
        await User_1.default.findByIdAndUpdate(tutorIdFromToken, { $inc: { sessionsCompleted: 1 } });
        // 4. Trigger Notification for Tutee
        await Notification_1.default.create({
            userId: sessionObj.tuteeId,
            title: 'Session Completed',
            message: `Your session on "${sessionObj.topic}" has been marked as completed. Payment released to tutor.`,
            type: 'payment',
            link: '/my-sessions'
        });
        logger_1.default.info(`Session completed: ${sessionId}`);
        res.json({ message: 'Session completed successfully', session: sessionObj });
    }
    catch (error) {
        logger_1.default.error(`Complete Session Error: ${error.message}`, { error });
        res.status(500).json({ message: 'Server error completing session', error: error.message });
    }
};
exports.completeSession = completeSession;
//# sourceMappingURL=sessionController.js.map
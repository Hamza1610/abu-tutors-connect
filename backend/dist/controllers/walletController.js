"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdrawFunds = exports.handleWebhook = exports.verifyPayment = exports.initializePayment = exports.getWallet = void 0;
const Wallet_1 = __importDefault(require("../models/Wallet"));
const User_1 = __importDefault(require("../models/User"));
const logger_1 = __importDefault(require("../utils/logger"));
const axios_1 = __importDefault(require("axios"));
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';
// @desc    Get user wallet and transaction history
// @route   GET /api/wallets
// @access  Private
const getWallet = async (req, res) => {
    try {
        let wallet = await Wallet_1.default.findOne({ userId: req.user.id });
        if (!wallet) {
            // Generate empty wallet on first request
            wallet = await Wallet_1.default.create({ userId: req.user.id, balance: 0, transactions: [] });
        }
        res.json(wallet);
    }
    catch (error) {
        logger_1.default.error(`Get Wallet Error: ${error.message}`, { error });
        res.status(500).json({ message: 'Server error fetching wallet', error: error.message });
    }
};
exports.getWallet = getWallet;
// @desc    Initialize Paystack Payment
// @route   POST /api/wallets/initialize
// @access  Private
const initializePayment = async (req, res) => {
    try {
        const { amount } = req.body;
        const user = await User_1.default.findById(req.user.id);
        if (!user || !amount || amount <= 0) {
            res.status(400).json({ message: 'Valid amount and user required' });
            return;
        }
        const response = await axios_1.default.post('https://api.paystack.co/transaction/initialize', {
            email: user.email,
            amount: amount * 100, // Paystack uses kobo/cents
            callback_url: `${process.env.FRONTEND_URL}/wallet/verify`,
            metadata: { userId: user._id }
        }, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET}`,
                'Content-Type': 'application/json'
            }
        });
        res.json(response.data.data);
    }
    catch (error) {
        logger_1.default.error(`Paystack Init Error: ${error.message}`, { error });
        res.status(500).json({ message: 'Failed to initialize payment' });
    }
};
exports.initializePayment = initializePayment;
// @desc    Verify Paystack Payment
// @route   GET /api/wallets/verify
// @access  Private
const verifyPayment = async (req, res) => {
    try {
        const { reference } = req.query;
        if (!reference) {
            res.status(400).json({ message: 'Reference is required' });
            return;
        }
        const response = await axios_1.default.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
        });
        const { status, amount, metadata } = response.data.data;
        if (status === 'success') {
            const actualAmount = amount / 100;
            const userId = metadata.userId;
            let wallet = await Wallet_1.default.findOne({ userId });
            if (!wallet)
                wallet = new Wallet_1.default({ userId, balance: 0, transactions: [] });
            // Avoid duplicate processing by checking reference in transactions
            const alreadyProcessed = wallet.transactions.some(tx => tx.reference === reference);
            if (!alreadyProcessed) {
                wallet.balance += actualAmount;
                wallet.transactions.push({
                    type: 'credit',
                    amount: actualAmount,
                    description: 'Wallet funding (Paystack)',
                    date: new Date(),
                    reference: reference
                });
                await wallet.save();
            }
            res.json({ message: 'Payment verified and wallet credited', balance: wallet.balance });
        }
        else {
            res.status(400).json({ message: 'Payment verification failed', status });
        }
    }
    catch (error) {
        logger_1.default.error(`Paystack Verify Error: ${error.message}`, { error });
        res.status(500).json({ message: 'Server error verifying payment' });
    }
};
exports.verifyPayment = verifyPayment;
// @desc    Paystack Webhook Handler
// @route   POST /api/wallets/webhook
// @access  Public
const handleWebhook = async (req, res) => {
    try {
        const event = req.body;
        if (event && event.event === 'charge.success') {
            const { reference, amount, metadata } = event.data;
            const userId = metadata.userId;
            let wallet = await Wallet_1.default.findOne({ userId });
            if (wallet) {
                const alreadyProcessed = wallet.transactions.some(tx => tx.reference === reference);
                if (!alreadyProcessed) {
                    wallet.balance += (amount / 100);
                    wallet.transactions.push({
                        type: 'credit',
                        amount: (amount / 100),
                        description: 'Wallet funding (Paystack Webhook)',
                        date: new Date(),
                        reference
                    });
                    await wallet.save();
                    logger_1.default.info(`Webhook: Credited ${userId} with ${amount / 100}`);
                }
            }
        }
        res.status(200).send('Webhook Received');
    }
    catch (error) {
        logger_1.default.error(`Webhook Error: ${error.message}`);
        res.status(500).send('Webhook Processing Error');
    }
};
exports.handleWebhook = handleWebhook;
// @desc    Withdraw funds from wallet (Tutors only)
// @route   POST /api/wallets/withdraw
// @access  Private
const withdrawFunds = async (req, res) => {
    try {
        const { amount, bankName, accountNumber } = req.body;
        if (!amount || amount <= 0 || !bankName || !accountNumber) {
            res.status(400).json({ message: 'Amount, Bank Name, and Account Number are required' });
            return;
        }
        const user = await User_1.default.findById(req.user.id);
        if (!user || (user.role !== 'tutor' && user.role !== 'verified_tutor')) {
            res.status(403).json({ message: 'Only tutors can withdraw funds' });
            return;
        }
        const wallet = await Wallet_1.default.findOne({ userId: req.user.id });
        if (!wallet) {
            res.status(404).json({ message: 'Wallet not found' });
            return;
        }
        if (wallet.balance < amount) {
            res.status(400).json({ message: 'Insufficient balance' });
            return;
        }
        // Processing withdrawal (In a real app, this would call a bank transfer API)
        wallet.balance -= amount;
        wallet.transactions.push({
            type: 'debit',
            amount,
            description: `Withdrawal to ${bankName} (${accountNumber})`,
            date: new Date(),
            reference: `WD-${Date.now()}`
        });
        await wallet.save();
        res.json({ message: 'Withdrawal processed successfully', balance: wallet.balance });
    }
    catch (error) {
        logger_1.default.error(`Withdrawal Error: ${error.message}`, { error });
        res.status(500).json({ message: 'Server error processing withdrawal' });
    }
};
exports.withdrawFunds = withdrawFunds;
//# sourceMappingURL=walletController.js.map
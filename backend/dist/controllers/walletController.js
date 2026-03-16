"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fundWallet = exports.getWallet = void 0;
const Wallet_1 = __importDefault(require("../models/Wallet"));
const logger_1 = __importDefault(require("../utils/logger"));
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
// @desc    Fund user wallet (Mocked for MVP)
// @route   POST /api/wallets/fund
// @access  Private
const fundWallet = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            res.status(400).json({ message: 'Valid amount is required' });
            return;
        }
        let wallet = await Wallet_1.default.findOne({ userId: req.user.id });
        if (!wallet) {
            wallet = new Wallet_1.default({ userId: req.user.id, balance: 0, transactions: [] });
        }
        wallet.balance += amount;
        wallet.transactions.push({
            type: 'credit',
            amount: amount,
            description: 'Wallet funding (Paystack Mock)',
            date: new Date()
        });
        await wallet.save();
        logger_1.default.info(`Wallet funded: User ${req.user.id} +${amount}`);
        res.json({ message: 'Wallet funded successfully', balance: wallet.balance, transactions: wallet.transactions });
    }
    catch (error) {
        logger_1.default.error(`Fund Wallet Error: ${error.message}`, { error });
        res.status(500).json({ message: 'Server error funding wallet', error: error.message });
    }
};
exports.fundWallet = fundWallet;
//# sourceMappingURL=walletController.js.map
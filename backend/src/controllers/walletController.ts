import { Request, Response } from 'express';
import Wallet from '../models/Wallet';
import logger from '../utils/logger';

// @desc    Get user wallet and transaction history
// @route   GET /api/wallets
// @access  Private
export const getWallet = async (req: Request, res: Response): Promise<void> => {
    try {
        let wallet = await Wallet.findOne({ userId: req.user.id });
        
        if (!wallet) {
            // Generate empty wallet on first request
            wallet = await Wallet.create({ userId: req.user.id, balance: 0, transactions: [] });
        }

        res.json(wallet);
    } catch (error: any) {
        logger.error(`Get Wallet Error: ${error.message}`, { error });
        res.status(500).json({ message: 'Server error fetching wallet', error: error.message });
    }
};

// @desc    Fund user wallet (Mocked for MVP)
// @route   POST /api/wallets/fund
// @access  Private
export const fundWallet = async (req: Request, res: Response): Promise<void> => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            res.status(400).json({ message: 'Valid amount is required' });
            return;
        }

        let wallet = await Wallet.findOne({ userId: req.user.id });
        if (!wallet) {
            wallet = new Wallet({ userId: req.user.id, balance: 0, transactions: [] });
        }

        wallet.balance += amount;
        wallet.transactions.push({
            type: 'credit',
            amount: amount,
            description: 'Wallet funding (Paystack Mock)',
            date: new Date()
        });

        await wallet.save();

        logger.info(`Wallet funded: User ${req.user.id} +${amount}`);
        res.json({ message: 'Wallet funded successfully', balance: wallet.balance, transactions: wallet.transactions });
    } catch (error: any) {
        logger.error(`Fund Wallet Error: ${error.message}`, { error });
        res.status(500).json({ message: 'Server error funding wallet', error: error.message });
    }
};

import { Request, Response } from 'express';
import Wallet from '../models/Wallet';
import User from '../models/User';
import logger from '../utils/logger';
import axios from 'axios';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';

interface AuthRequest extends Request {
    user?: any;
}

// @desc    Get user wallet and transaction history
// @route   GET /api/wallets
// @access  Private
export const getWallet = async (req: AuthRequest, res: Response): Promise<void> => {
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

// @desc    Initialize Paystack Payment
// @route   POST /api/wallets/initialize
// @access  Private
export const initializePayment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { amount } = req.body;
        const user = await User.findById(req.user.id);
        
        if (!user || !amount || amount <= 0) {
            res.status(400).json({ message: 'Valid amount and user required' });
            return;
        }

        const response = await axios.post('https://api.paystack.co/transaction/initialize', {
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
    } catch (error: any) {
        logger.error(`Paystack Init Error: ${error.message}`, { error });
        res.status(500).json({ message: 'Failed to initialize payment' });
    }
};

// @desc    Verify Paystack Payment
// @route   GET /api/wallets/verify
// @access  Private
export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { reference } = req.query;
        if (!reference) {
            res.status(400).json({ message: 'Reference is required' });
            return;
        }

        const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
        });

        const { status, amount, metadata } = response.data.data;

        if (status === 'success') {
            const actualAmount = amount / 100;
            const userId = metadata.userId;

            let wallet = await Wallet.findOne({ userId });
            if (!wallet) wallet = new Wallet({ userId, balance: 0, transactions: [] });

            // Avoid duplicate processing by checking reference in transactions
            const alreadyProcessed = wallet.transactions.some(tx => tx.reference === reference);
            if (!alreadyProcessed) {
                wallet.balance += actualAmount;
                wallet.transactions.push({
                    type: 'credit',
                    amount: actualAmount,
                    description: 'Wallet funding (Paystack)',
                    date: new Date(),
                    reference: reference as string
                });
                await wallet.save();
            }

            res.json({ message: 'Payment verified and wallet credited', balance: wallet.balance });
        } else {
            res.status(400).json({ message: 'Payment verification failed', status });
        }
    } catch (error: any) {
        logger.error(`Paystack Verify Error: ${error.message}`, { error });
        res.status(500).json({ message: 'Server error verifying payment' });
    }
};

// @desc    Paystack Webhook Handler
// @route   POST /api/wallets/webhook
// @access  Public
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
        const event = req.body;
        if (event && event.event === 'charge.success') {
            const { reference, amount, metadata } = event.data;
            const userId = metadata.userId;

            let wallet = await Wallet.findOne({ userId });
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
                    logger.info(`Webhook: Credited ${userId} with ${amount/100}`);
                }
            }
        }
        res.status(200).send('Webhook Received');
    } catch (error: any) {
        logger.error(`Webhook Error: ${error.message}`);
        res.status(500).send('Webhook Processing Error');
    }
};

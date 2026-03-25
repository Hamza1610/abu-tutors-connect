import { Request, Response } from 'express';
import Wallet from '../models/Wallet';
import User from '../models/User';
import Settings from '../models/Settings';
import logger from '../utils/logger';
import axios from 'axios';
import bcrypt from 'bcryptjs';

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
            wallet = await Wallet.create({ userId: req.user.id, balance: 0, transactions: [] });
        }
        res.json(wallet);
    } catch (error: any) {
        logger.error(`Get Wallet Error: ${error.message}`);
        res.status(500).json({ message: 'Server error fetching wallet' });
    }
};

// @desc    Set or Update Transaction PIN
// @route   POST /api/wallets/set-pin
// @access  Private
export const setTransactionPin = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { pin, currentPassword } = req.body;
        if (!pin || pin.length < 4) {
            res.status(400).json({ message: 'PIN must be at least 4 digits' });
            return;
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Verify password before setting PIN for security
        if (!user.password) {
            res.status(400).json({ message: 'Password required' });
            return;
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            res.status(401).json({ message: 'Incorrect password' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        user.transactionPin = await bcrypt.hash(pin, salt);
        await user.save();

        res.json({ message: 'Transaction PIN set successfully' });
    } catch (error: any) {
        logger.error(`Set PIN Error: ${error.message}`);
        res.status(500).json({ message: 'Server error setting PIN' });
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
            amount: Math.round(amount * 100), // Kobo
            callback_url: `${process.env.FRONTEND_URL}/wallet/verify`,
            metadata: { userId: user._id }
        }, {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
        });

        res.json(response.data.data);
    } catch (error: any) {
        logger.error(`Paystack Init Error: ${error.message}`);
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
        logger.error(`Paystack Verify Error: ${error.message}`);
        res.status(500).json({ message: 'Server error verifying payment' });
    }
};

// @desc    Paystack Webhook Handler
// @route   POST /api/wallets/webhook
// @access  Public
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
        const event = req.body;
        // Verify Paystack signature here in production for security!
        
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
                        description: 'Wallet funding (Paystack)',
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

// @desc    Pay tutor registration fee from wallet
// @route   POST /api/wallets/pay-registration
// @access  Private (Tutor)
export const payRegistrationFromWallet = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'tutor') {
            res.status(400).json({ message: 'Only tutors pay registration fees' });
            return;
        }

        const settings = await Settings.findOne() || await Settings.create({});
        const isFree = settings.isRegistrationFree;
        const fee = isFree ? 0 : (settings.registrationFee || 5000);

        const wallet = await Wallet.findOne({ userId: req.user.id });
        if (!isFree && (!wallet || wallet.balance < fee)) {
            res.status(400).json({ message: 'Insufficient wallet balance' });
            return;
        }

        // 1. Deduct from Tutor if not free
        if (!isFree && fee > 0 && wallet) {
            wallet.balance -= fee;
            wallet.transactions.push({
                type: 'debit',
                amount: fee,
                description: 'Tutor Registration Fee',
                date: new Date()
            });
            await wallet.save();
        }

        // 2. Credit Admin Wallet if not free
        const admin = await User.findOne({ role: 'admin' });
        if (!isFree && fee > 0 && admin) {
            let adminWallet = await Wallet.findOne({ userId: admin._id });
            if (!adminWallet) adminWallet = await Wallet.create({ userId: admin._id, balance: 0, transactions: [] });
            
            adminWallet.balance += fee;
            adminWallet.transactions.push({
                type: 'credit',
                amount: fee,
                description: `Registration Fee from ${user.name}`,
                date: new Date(),
                reference: user._id.toString()
            });
            await adminWallet.save();
        }

        // 3. Update User Status
        user.registrationPaymentStatus = 'completed';
        // Advance to step 4/complete if needed
        if (user.documents?.admissionLetter && user.documents?.transcript) {
            user.isProfileComplete = true;
            user.profileStep = 4;
        }
        await user.save();

        res.json({ message: 'Registration fee paid successfully', balance: wallet.balance });
    } catch (error: any) {
        logger.error(`Registration Payment Error: ${error.message}`);
        res.status(500).json({ message: 'Server error paying registration fee' });
    }
};

// @desc    Withdraw funds from wallet (Tutors & Admins)
// @route   POST /api/wallets/withdraw
// @access  Private
export const withdrawFunds = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { amount, pin } = req.body;
        
        if (!amount || amount <= 0 || !pin) {
            res.status(400).json({ message: 'Amount and Transaction PIN are required' });
            return;
        }

        const user = await User.findById(req.user.id);
        if (!user || !user.transactionPin) {
            res.status(400).json({ message: 'Please set a transaction PIN first' });
            return;
        }

        // 1. Verify Transaction PIN
        const isPinValid = await bcrypt.compare(pin, user.transactionPin);
        if (!isPinValid) {
            res.status(401).json({ message: 'Invalid Transaction PIN' });
            return;
        }

        const wallet = await Wallet.findOne({ userId: req.user.id });
        if (!wallet || wallet.balance < amount) {
            res.status(400).json({ message: 'Insufficient balance' });
            return;
        }

        if (!user.bankDetails?.accountNumber || !user.bankDetails?.bankCode) {
            res.status(400).json({ message: 'Please update your bank details in profile first' });
            return;
        }

        // 2. Paystack Transfer Flow
        // 2a. Create Transfer Recipient if needed
        let recipientCode = user.bankDetails.recipientCode;
        if (!recipientCode) {
            try {
                const recipientRes = await axios.post('https://api.paystack.co/transferrecipient', {
                    type: "nuban",
                    name: user.name,
                    account_number: user.bankDetails.accountNumber,
                    bank_code: user.bankDetails.bankCode,
                    currency: "NGN"
                }, {
                    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
                });
                recipientCode = recipientRes.data.data.recipient_code;
                if (recipientCode) {
                    user.bankDetails.recipientCode = recipientCode;
                    await user.save();
                } else {
                    throw new Error('Failed to get recipient code from Paystack');
                }
            } catch (err: any) {
                logger.error(`Recipient Creation Error: ${err.message}`);
                res.status(400).json({ message: 'Failed to create transfer recipient. Check bank details.' });
                return;
            }
        }

        // 2b. Initiate Transfer
        try {
            const transferRes = await axios.post('https://api.paystack.co/transfer', {
                source: "balance",
                amount: Math.round(amount * 100),
                recipient: recipientCode,
                reason: `Withdrawal from ABUTutorsConnect`
            }, {
                headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
            });

            if (transferRes.data.status) {
                // 3. Update Wallet Balance
                wallet.balance -= amount;
                wallet.transactions.push({
                    type: 'debit',
                    amount,
                    description: `Withdrawal to ${user.bankDetails.bankName}`,
                    date: new Date(),
                    reference: transferRes.data.data.transfer_code
                });
                await wallet.save();

                res.json({ message: 'Withdrawal initiated successfully', balance: wallet.balance });
            } else {
                throw new Error('Paystack transfer failed');
            }
        } catch (err: any) {
            logger.error(`Paystack Transfer Error: ${err.message}`);
            res.status(500).json({ message: 'Failed to initiate transfer via Paystack' });
        }
    } catch (error: any) {
        logger.error(`Withdrawal Error: ${error.message}`);
        res.status(500).json({ message: 'Server error processing withdrawal' });
    }
};

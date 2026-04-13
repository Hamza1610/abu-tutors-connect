import { Request, Response } from 'express';
import axios from 'axios';
import logger from '../utils/logger';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';

// @desc    Get list of Nigerian banks from Paystack
// @route   GET /api/banks
// @access  Private
export const getBanks = async (req: Request, res: Response): Promise<void> => {
    try {
        const response = await axios.get('https://api.paystack.co/bank?currency=NGN', {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
        });

        // Filter out duplicate bank codes from Paystack response
        const uniqueBanks = response.data.data.filter((bank: any, index: number, self: any[]) =>
            index === self.findIndex((b) => b.code.toString() === bank.code.toString())
        );

        res.json(uniqueBanks);
    } catch (error: any) {
        logger.warn(`Paystack Bank Fetch Warning: ${error.message}. Returning empty bank list.`);
        // Return empty array instead of 500 to prevent crashing the whole Admin Dashboard
        res.json([]);
    }
};

// @desc    Verify bank account number (Resolve Account)
// @route   GET /api/banks/verify
// @access  Private
export const verifyAccount = async (req: Request, res: Response): Promise<void> => {
    try {
        const { accountNumber, bankCode } = req.query;
        if (!accountNumber || !bankCode) {
            res.status(400).json({ message: 'Account number and bank code are required' });
            return;
        }

        const response = await axios.get(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
        });

        res.json(response.data.data);
    } catch (error: any) {
        logger.error(`Verify Account Error: ${error.message}`);
        res.status(400).json({ message: 'Could not verify account. Please check the details.' });
    }
};

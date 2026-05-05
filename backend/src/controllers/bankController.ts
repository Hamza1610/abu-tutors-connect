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
        logger.warn(`Paystack Bank Fetch Warning: ${error.message}. Returning fallback bank list.`);
        
        // Provide a fallback list of major Nigerian banks to prevent UI failure
        const fallbackBanks = [
            { name: 'Access Bank', code: '044' },
            { name: 'Fidelity Bank', code: '070' },
            { name: 'First Bank of Nigeria', code: '011' },
            { name: 'First City Monument Bank', code: '214' },
            { name: 'Guaranty Trust Bank', code: '058' },
            { name: 'Heritage Bank', code: '030' },
            { name: 'Keystone Bank', code: '082' },
            { name: 'Stanbic IBTC Bank', code: '039' },
            { name: 'Standard Chartered Bank', code: '068' },
            { name: 'Sterling Bank', code: '232' },
            { name: 'Union Bank of Nigeria', code: '032' },
            { name: 'United Bank for Africa', code: '033' },
            { name: 'Unity Bank', code: '215' },
            { name: 'Wema Bank', code: '035' },
            { name: 'Zenith Bank', code: '057' },
            { name: 'OPay Digital Services', code: '999992' },
            { name: 'PalmPay', code: '999991' },
            { name: 'Kuda Bank', code: '50211' }
        ];
        
        res.json(fallbackBanks);
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

        // 1. Log the attempt
        logger.info(`Attempting bank verification for: ${accountNumber} (Bank: ${bankCode})`);

        try {
            const response = await axios.get(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
                headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
            });

            res.json(response.data.data);
        } catch (paystackError: any) {
            // 2. Handle Paystack failure
            const errorDetail = paystackError.response?.data?.message || paystackError.message;
            logger.warn(`Paystack Resolve Error: ${errorDetail}`);

            // 3. Optional Mock: Only for specific test number '0000000000'
            if (accountNumber === '0000000000') {
                logger.info('Test Number detected: Providing mock success.');
                res.json({
                    account_number: '0000000000',
                    account_name: 'TEST ACCOUNT (SUCCESS)',
                    bank_id: 1
                });
                return;
            }

            // 4. Return the ACTUAL error from Paystack so you can see why it failed
            res.status(400).json({ message: `Paystack Error: ${errorDetail}` });
        }
    } catch (error: any) {
        logger.error(`Verify Account System Error: ${error.message}`);
        res.status(500).json({ message: `System Error: ${error.message}` });
    }
};

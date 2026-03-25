import express from 'express';
import { getWallet, initializePayment, verifyPayment, handleWebhook, withdrawFunds, setTransactionPin, payRegistrationFromWallet } from '../controllers/walletController';
import { getBanks, verifyAccount } from '../controllers/bankController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getWallet);

router.post('/set-pin', protect, setTransactionPin);
router.post('/pay-registration', protect, payRegistrationFromWallet);
router.post('/withdraw', protect, withdrawFunds);
router.post('/initialize', protect, initializePayment);
router.get('/verify', protect, verifyPayment);
router.post('/webhook', handleWebhook); // Publicly accessible for Paystack

// Bank helper routes
router.get('/banks', protect, getBanks);
router.get('/verify-account', protect, verifyAccount);

export default router;

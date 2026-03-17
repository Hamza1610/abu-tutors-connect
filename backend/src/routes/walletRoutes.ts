import express from 'express';
import { getWallet, initializePayment, verifyPayment, handleWebhook } from '../controllers/walletController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getWallet);

router.post('/initialize', protect, initializePayment);
router.get('/verify', protect, verifyPayment);
router.post('/webhook', handleWebhook); // Publicly accessible for Paystack

export default router;

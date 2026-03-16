import express from 'express';
import { getWallet, fundWallet } from '../controllers/walletController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getWallet);

router.post('/fund', protect, fundWallet);

export default router;

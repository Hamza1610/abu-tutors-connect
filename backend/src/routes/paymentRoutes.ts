import express from 'express';
import { payRegistrationFee } from '../controllers/paymentController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register-tutor', protect, payRegistrationFee);

export default router;

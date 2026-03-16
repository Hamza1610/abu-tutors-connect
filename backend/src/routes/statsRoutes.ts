import express from 'express';
import { getTutorStats } from '../controllers/statsController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/tutor', protect, getTutorStats);

export default router;

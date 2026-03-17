import express from 'express';
import { createSession, getUserSessions, startSession, completeSession } from '../controllers/sessionController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .post(protect, createSession)
    .get(protect, getUserSessions);

router.post('/:id/start', protect, startSession);
router.post('/:id/complete', protect, completeSession);

export default router;

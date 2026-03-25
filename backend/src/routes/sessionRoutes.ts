import express from 'express';
import { 
    createSession, 
    getUserSessions, 
    startSession, 
    completeSession, 
    cancelSession, 
    reportTuteeNoShow,
    syncSession,
    lockSlot,
    rescheduleSession
} from '../controllers/sessionController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Note: We use type assertions in the routes if the controller types are slightly off
router.route('/')
    .post(protect, createSession as any)
    .get(protect, getUserSessions as any);

router.post('/lock', protect, lockSlot as any);
router.post('/:id/start', protect, startSession as any);
router.post('/:id/complete', protect, completeSession as any);
router.post('/:id/cancel', protect, cancelSession as any);
router.post('/:id/no-show', protect, reportTuteeNoShow as any);
router.post('/:id/sync', protect, syncSession as any);
router.post('/:id/reschedule', protect, rescheduleSession as any);

export default router;

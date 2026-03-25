import express from 'express';
import { sendMessage, getConversation, getChatList } from '../controllers/messageController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .post(protect, sendMessage as any);

router.get('/conversations', protect, getChatList as any);
router.get('/:otherUserId', protect, getConversation as any);

export default router;

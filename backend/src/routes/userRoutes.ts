import express from 'express';
import { getProfile, updateProfile, getTutorProfile, getTutors } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes for tutor discovery - MOVED TO TOP
router.get('/tutors', getTutors);
router.get('/tutors/:id', getTutorProfile);

router.route('/')
    .get(protect, getProfile)
    .put(protect, updateProfile);

export default router;

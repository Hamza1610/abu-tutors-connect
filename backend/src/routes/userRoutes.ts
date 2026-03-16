import express from 'express';
import { getProfile, updateProfile, getTutorProfile } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
    .get(protect, getProfile)
    .put(protect, updateProfile);

// Public route to view tutor profiles
router.route('/tutors/:id').get(getTutorProfile);

export default router;

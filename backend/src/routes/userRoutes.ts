import express from 'express';
import { getProfile, updateProfile, getTutorProfile, getTutors } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';
import { upload, validateFileSize } from '../middleware/fileUpload';

const router = express.Router();

// Public routes for tutor discovery - MOVED TO TOP
router.get('/tutors', getTutors);
router.get('/tutors/:id', getTutorProfile);

router.route('/')
    .get(protect, getProfile)
    .put(protect, upload.fields([
        { name: 'profilePicture', maxCount: 1 },
        { name: 'admissionLetter', maxCount: 1 },
        { name: 'transcript', maxCount: 1 }
    ]), validateFileSize, updateProfile);

export default router;

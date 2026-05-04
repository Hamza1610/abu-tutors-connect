import express from 'express';
import { 
    getProfile, updateProfile, getTutorProfile, getTutors, 
    getUserPublicProfile, getAdminId, submitCourseApplication 
} from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';
import { upload, validateFileSize } from '../middleware/fileUpload';

const router = express.Router();

// Public routes
router.get('/tutors', getTutors);
router.get('/tutors/:id', getTutorProfile);

// Profile routes
router.get('/me', protect, getProfile);
router.get('/admin-id', protect, getAdminId);
router.get('/profile/:id', protect, getUserPublicProfile);

// Course Application
router.post('/apply-course', protect, upload.single('transcript'), validateFileSize, submitCourseApplication);

// Unified update route
router.route('/')
    .get(protect, getProfile)
    .patch(protect, updateProfile)
    .put(protect, upload.fields([
        { name: 'profilePicture', maxCount: 1 },
        { name: 'admissionLetter', maxCount: 1 },
        { name: 'transcript', maxCount: 1 }
    ]), validateFileSize, updateProfile);

export default router;

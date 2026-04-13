import express from 'express';
import { register, login, forgotPassword, resetPassword } from '../controllers/authController';
import { upload } from '../middleware/fileUpload';

const router = express.Router();

router.post("/register", upload.single('profilePicture'), register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;

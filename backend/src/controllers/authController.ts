import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User, { IUser } from '../models/User';
import Wallet from '../models/Wallet';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger';
import crypto from 'crypto';
import { sendEmail } from '../utils/emailService';

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development";

const validatePassword = (password: string): { isValid: boolean; message?: string } => {
    if (password.length < 8) {
        return { isValid: false, message: "Password must be at least 8 characters long." };
    }
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasLetter || !hasNumber || !hasSpecial) {
        return { isValid: false, message: "Password must contain at least one letter, one number, and one special character." };
    }
    return { isValid: true };
};

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            name, email, password, role, faculty, department, // tutee + tutor
            level, registrationNumber, admissionId, courses, about, gender, phone, // tutor only
            acceptedTerms
        } = req.body || {};

        const finalizedRegNum = (registrationNumber || admissionId)?.toString().trim().toUpperCase();

        // Handle boolean parsing from FormData (sent as strings)
        const isTermsAccepted = acceptedTerms === 'true' || acceptedTerms === true;
        
        if (!isTermsAccepted) {
            res.status(400).json({ message: "You must accept the Terms and Conditions to register." });
            return;
        }

        const passwordCheck = validatePassword(password);
        if (!passwordCheck.isValid) {
            res.status(400).json({ message: passwordCheck.message });
            return;
        }

        // Extract profile picture from multer file if provided
        let profilePicturePath = '';
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'abu_tutors/profiles'
            });
            profilePicturePath = result.secure_url;
        }

        // Optional: Validate ABU registration number regex
        if (role === 'tutor' || role === 'verified_tutor') {
            const regNumRegex = /^U\d{2}[A-Z]{2}\d{4}$/; // e.g., U21CO1015
            if (finalizedRegNum && !regNumRegex.test(finalizedRegNum)) {
                res.status(400).json({ message: "Invalid ABU Registration Number format. Expected format: U21COxxxx" });
                return;
            }
        }

        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            res.status(400).json({ message: "User already exists with that email" });
            return;
        }

        if (finalizedRegNum) {
            const existingRegNum = await User.findOne({ registrationNumber: finalizedRegNum });
            if (existingRegNum) {
                res.status(400).json({ message: "A user with this Registration Number already exists" });
                return;
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Check global settings for registration fee status
        const Settings = mongoose.model('Settings');
        const settings = await Settings.findOne() as any;
        const isFree = settings?.isRegistrationFree || false;

        const user: IUser = new User({
            name, 
            email: email.toLowerCase(), 
            password: hashedPassword, 
            role: role || "tutee",
            registrationNumber: finalizedRegNum,
            faculty, 
            department, 
            level, 
            courses, 
            about, 
            gender,
            phone,
            acceptedTerms: isTermsAccepted,
            profileStep: (role === 'tutee') ? 4 : 0, // Tutees finish immediately, Tutors start at 0
            isProfileComplete: (role === 'tutee'), // Tutees complete after registration
            isApproved: (role === 'tutee'), // Tutees don't need admin approval
            registrationPaymentStatus: (role === 'tutee' || role === 'admin' || isFree) ? 'free' : 'pending',
            documents: {
                profilePicture: profilePicturePath
            }
        });

        await user.save();
        
        // Ensure wallet is created immediately
        await Wallet.create({ userId: user._id, balance: 0, transactions: [] });

        // Auto-login upon registration
        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

        const userRes = user.toObject();
        delete userRes.password;
        
        logger.info(`User registered successfully: ${email}`);
        res.status(201).json({
            message: "User registered successfully",
            token,
            user: userRes
        });
    } catch (error: any) {
        // Handle MongoDB duplicate key error (11000)
        if (error.code === 11000 || error.code === '11000' || error.message.includes('E11000')) {
            let message = 'User already exists';
            if (error.message.includes('registrationNumber') || (error.keyPattern && error.keyPattern.registrationNumber)) {
                message = 'Registration Number already exists';
            } else if (error.message.includes('email') || (error.keyPattern && error.keyPattern.email)) {
                message = 'Email already exists';
            }
            res.status(400).json({ message });
            return;
        }
        logger.error(`Register Error: ${error.message}`, { error });
        res.status(500).json({ message: "Server error during registration", error: error.message });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || user.password === undefined) {
            res.status(400).json({ message: "Invalid credentials" });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ message: "Invalid credentials" });
            return;
        }

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

        const userRes = user.toObject();
        delete userRes.password;

        logger.info(`Login successful: ${email}`);
        res.status(200).json({
            message: "Login successful",
            token,
            user: userRes
        });
    } catch (error: any) {
        logger.error(`Login Error: ${error.message}`, { error });
        res.status(500).json({ message: "Server error during login", error: error.message });
    }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            res.status(404).json({ message: "No user found with that email" });
            return;
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash and set to resetPasswordToken field
        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken as string)
            .digest('hex');

        // Set expire time (e.g., 10 minutes)
        user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

        await user.save();

        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a POST request to: \n\n ${resetUrl}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Token',
                message,
                html: `
                    <h1>You requested a password reset</h1>
                    <p>Please click on the link below to reset your password. This link is valid for 10 minutes.</p>
                    <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
                `
            });

            res.status(200).json({ message: "Email sent" });
        } catch (err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            res.status(500).json({ message: "Email could not be sent" });
        }
    } catch (error: any) {
        logger.error(`Forgot Password Error: ${error.message}`);
        res.status(500).json({ message: "Server error during forgot password" });
    }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.token as string)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            res.status(400).json({ message: "Invalid or expired token" });
            return;
        }

        const { password } = req.body;
        const passwordCheck = validatePassword(password);
        if (!passwordCheck.isValid) {
            res.status(400).json({ message: passwordCheck.message });
            return;
        }

        // Set new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        logger.info(`Password reset successful for user: ${user.email}`);
        res.status(200).json({ message: "Password reset successful" });
    } catch (error: any) {
        logger.error(`Reset Password Error: ${error.message}`);
        res.status(500).json({ message: "Server error during password reset" });
    }
};

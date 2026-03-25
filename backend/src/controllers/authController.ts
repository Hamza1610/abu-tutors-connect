import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import Wallet from '../models/Wallet';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development";

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            name, email, password, role, faculty, department, // tutee + tutor
            level, registrationNumber, admissionId, courses, about, gender, phone, // tutor only
            acceptedTerms
        } = req.body || {};

        const finalizedRegNum = registrationNumber || admissionId;
        
        // Handle boolean parsing from FormData (sent as strings)
        const isTermsAccepted = acceptedTerms === 'true' || acceptedTerms === true;
        
        if (!isTermsAccepted) {
            res.status(400).json({ message: "You must accept the Terms and Conditions to register." });
            return;
        }

        // Extract profile picture from multer file if provided
        const profilePicturePath = req.file ? `/uploads/${req.file.filename}` : '';

        // Optional: Validate ABU registration number regex
        if (role === 'tutor' || role === 'verified_tutor') {
            const regNumRegex = /^U\d{2}[A-Z]{2}\d{4}$/; // e.g., U21CO1015
            if (finalizedRegNum && !regNumRegex.test(finalizedRegNum)) {
                res.status(400).json({ message: "Invalid ABU Registration Number format. Expected format: U21COxxxx" });
                return;
            }
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: "User already exists with that email" });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user: IUser = new User({
            name, 
            email, 
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
            registrationPaymentStatus: (role === 'tutee' || role === 'admin') ? 'free' : 'pending',
            documents: {
                profilePicture: profilePicturePath
            }
        });

        await user.save();
        
        // Ensure wallet is created immediately
        await Wallet.create({ userId: user._id, balance: 0, transactions: [] });

        // Auto-login upon registration
        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

        logger.info(`User registered successfully: ${email}`);
        res.status(201).json({
            message: "User registered successfully",
            token,
            user: { id: user._id, name: user.name, role: user.role, email: user.email }
        });
    } catch (error: any) {
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

        logger.info(`Login successful: ${email}`);
        res.status(200).json({
            message: "Login successful",
            token,
            user: { id: user._id, name: user.name, role: user.role, email: user.email }
        });
    } catch (error: any) {
        logger.error(`Login Error: ${error.message}`, { error });
        res.status(500).json({ message: "Server error during login", error: error.message });
    }
};

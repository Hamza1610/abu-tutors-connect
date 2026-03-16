import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development";

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            name, email, password, role, faculty, department, // tutee + tutor
            level, admissionId, courses, about, gender // tutor only
        } = req.body;

        // Optional: Validate ABU admission ID regex inside here for tutors
        if (role === 'tutor' || role === 'verified_tutor') {
            const admissionIdRegex = /^U\d{2}[A-Z]{2}\d{4}$/; // e.g., U21CO1015
            if (admissionId && !admissionIdRegex.test(admissionId)) {
                res.status(400).json({ message: "Invalid ABU Admission ID format. Expected format: U21COxxxx" });
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
            name, email, password: hashedPassword, role: role || "tutee",
            faculty, department, level, admissionId, courses, about, gender
        });

        await user.save();

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

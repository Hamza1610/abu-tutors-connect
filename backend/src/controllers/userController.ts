import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import { v2 as cloudinary } from 'cloudinary';
import Settings from '../models/Settings';
import logger from '../utils/logger';

// @desc    Get user profile (current user)
// @route   GET /api/users/
// @access  Private
export const getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error: any) {
        logger.error(`Get Profile Error: ${error.message}`, { error });
        res.status(500).json({ message: "Server error getting profile", error: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/
// @access  Private
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        
        // 1. Handle File Uploads (Atomic & Direct)
        if (files) {
            const fileKeys = ['profilePicture', 'admissionLetter', 'transcript'] as const;
            for (const key of fileKeys) {
                if (files[key]?.[0]) {
                    try {
                        const result = await cloudinary.uploader.upload(files[key][0].path, {
                            folder: `abu_tutors/${key === 'profilePicture' ? 'profiles' : 'documents'}`
                        });
                        
                        await mongoose.model('User').collection.updateOne(
                            { _id: new mongoose.Types.ObjectId(userId) },
                            { $set: { [`documents.${key}`]: result.secure_url } }
                        );

                        if (require('fs').existsSync(files[key][0].path)) {
                            require('fs').unlinkSync(files[key][0].path);
                        }
                    } catch (err: any) {
                        console.error(`[${key.toUpperCase()} UPLOAD ERROR]`, err);
                        res.status(400).json({ message: `${key} upload failed: ${err.message}` });
                        return;
                    }
                }
            }
        }

        // 2. Handle Body Updates (Simplified)
        let updateData: any = {};
        if (req.body.name) updateData.name = req.body.name;
        if (req.body.phone) updateData.phone = req.body.phone;
        if (req.body.about) updateData.about = req.body.about;
        if (req.body.level) updateData.level = req.body.level;
        
        if (req.body.email && req.body.email.toLowerCase() !== (req as any).user.email?.toLowerCase()) {
            const newEmail = req.body.email.toLowerCase().trim();
            const emailExists = await User.findOne({ email: newEmail, _id: { $ne: userId } });
            if (emailExists) {
                res.status(400).json({ message: 'Email address is already in use by another account' });
                return;
            }
            updateData.email = newEmail;
        }
        
        // Only allow admin to update static academic fields (Faculty/Department)
        if (req.user.role === 'admin') {
            if (req.body.faculty) updateData.faculty = req.body.faculty;
            if (req.body.department) updateData.department = req.body.department;
        }
        
        if (req.body.matchingBio) updateData.matchingBio = req.body.matchingBio;
        if (req.body.areaOfStrength) updateData.areaOfStrength = req.body.areaOfStrength;
        if (req.body.availability) {
            try {
                // Handle both JSON string and parsed object
                updateData.availability = typeof req.body.availability === 'string' 
                    ? JSON.parse(req.body.availability) 
                    : req.body.availability;
            } catch {
                updateData.availability = req.body.availability;
            }
        }

        // Bank Details Update
        if (req.body.bankName) updateData['bankDetails.bankName'] = req.body.bankName;
        if (req.body.bankCode) updateData['bankDetails.bankCode'] = req.body.bankCode;
        if (req.body.accountNumber) updateData['bankDetails.accountNumber'] = req.body.accountNumber;
        if (req.body.accountName) updateData['bankDetails.accountName'] = req.body.accountName;

        // NEW: Enforce Global Max Hourly Rate for Tutors
        if (req.body.hourlyRate) {
            const hr = Number(req.body.hourlyRate);
            const settings = await Settings.findOne() || await Settings.create({});
            if (hr > settings.maxHourlyRate) {
                res.status(400).json({ message: `Your hourly rate cannot exceed the system limit of ₦${settings.maxHourlyRate}` });
                return;
            }
            updateData.hourlyRate = hr;
        }
        // Handle courses array (sent as JSON string from profile editor or array from mobile)
        if (req.body.courses) {
            if (Array.isArray(req.body.courses)) {
                updateData.courses = req.body.courses;
            } else if (typeof req.body.courses === 'string') {
                try {
                    const parsed = JSON.parse(req.body.courses);
                    if (Array.isArray(parsed)) {
                        updateData.courses = parsed;
                    } else {
                        updateData.courses = req.body.courses.split(',').map((c: string) => c.trim()).filter(Boolean);
                    }
                } catch {
                    updateData.courses = req.body.courses.split(',').map((c: string) => c.trim()).filter(Boolean);
                }
            }
        }
        
        // Tutor Specifics (Simplified)
        if (req.body.step) {
            const step = parseInt(req.body.step);
            updateData.profileStep = step;
            if (step === 4) {
                updateData.isProfileComplete = true;
            }
        }

        // 3. Final Save for metadata
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { returnDocument: 'after', runValidators: false }
        );

        if (!updatedUser) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        console.log(`[PROFILE REBUILT] Success for ${updatedUser.role}. Photo URL: ${updatedUser.documents?.profilePicture}`);
        
        const userRes = updatedUser.toObject();
        delete userRes.password;
        res.json(userRes);

    } catch (error: any) {
        console.error('Unified Profile Update Error:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

// @desc    Get all tutors (for discovery)
// @route   GET /api/users/tutors
// @access  Public
export const getTutors = async (req: Request, res: Response): Promise<void> => {
    try {
        const tutors = await User.find({ 
            role: { $in: ['tutor', 'verified_tutor'] },
            isApproved: true // Only show approved tutors in marketplace
        }).select('-password').sort({ sessionsCompleted: -1, averageRating: -1 });
        
        res.json(tutors);
    } catch (error: any) {
        logger.error(`Get Tutors Error: ${error.message}`, { error });
        res.status(500).json({ message: "Server error getting tutors", error: error.message });
    }
};

// @desc    Get tutor profile by ID
// @route   GET /api/users/tutors/:id
// @access  Public
export const getTutorProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const tutor = await User.findById(req.params.id).select('-password');
        
        if (tutor && (tutor.role === 'tutor' || tutor.role === 'verified_tutor')) {
            res.json(tutor);
        } else {
            res.status(404).json({ message: 'Tutor not found' });
        }
    } catch (error: any) {
        logger.error(`Get Tutor Profile Error: ${error.message}`, { error });
        res.status(500).json({ message: "Server error getting tutor profile", error: error.message });
    }
};

// @desc    Get user public info by ID
// @route   GET /api/users/profile/:id
// @access  Private
export const getUserPublicProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.params.id).select('name role documents.profilePicture');
        
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error: any) {
        logger.error(`Get User Public Profile Error: ${error.message}`, { error });
        res.status(500).json({ message: "Server error getting user profile", error: error.message });
    }
};

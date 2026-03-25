import { Request, Response } from 'express';
import User from '../models/User';
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
        const user = await User.findById(req.user.id);

        if (user) {
            // Handle Step-based updates for Tutors
            if (user.role === 'tutor' || user.role === 'verified_tutor') {
                const step = parseInt(req.body.step);

                if (step === 1) {
                    // Step 1: Personal Details
                    user.faculty = req.body.faculty || user.faculty;
                    user.department = req.body.department || user.department;
                    user.level = req.body.level || user.level;
                    user.phone = req.body.phone || user.phone;
                    
                    if (req.body.bankName && req.body.accountNumber && req.body.bankCode) {
                        user.bankDetails = {
                            bankName: req.body.bankName,
                            bankCode: req.body.bankCode,
                            accountNumber: req.body.accountNumber,
                            accountName: req.body.accountName || '',
                        };
                    }
                    
                    if (user.profileStep < 1) user.profileStep = 1;
                } else if (step === 2) {
                    // Step 2: Educational Background
                    user.teachingLevel = req.body.teachingLevel || user.teachingLevel;
                    if (req.body.courses) {
                        try {
                            user.courses = JSON.parse(req.body.courses);
                        } catch (e) {
                            user.courses = req.body.courses.split(',').map((c: string) => c.trim());
                        }
                    }
                    user.areaOfStrength = req.body.areaOfStrength || user.areaOfStrength;
                    user.about = req.body.about || user.about;
                    if (user.profileStep < 2) user.profileStep = 2;
                } else if (step === 3) {
                    // Step 3: Documents
                    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
                    if (files) {
                        const currentDocs = user.documents || { admissionLetter: '', transcript: '', profilePicture: '' };
                        const newDocs: any = { ...currentDocs };
                        
                        if (files.admissionLetter?.[0]) {
                            newDocs.admissionLetter = `/uploads/${files.admissionLetter[0].filename}`;
                        }
                        if (files.transcript?.[0]) {
                            newDocs.transcript = `/uploads/${files.transcript[0].filename}`;
                        }
                        if (files.profilePicture?.[0]) {
                            newDocs.profilePicture = `/uploads/${files.profilePicture[0].filename}`;
                        }
                        user.documents = newDocs;
                    }
                    if (user.profileStep < 3) user.profileStep = 3;
                } else if (step === 4) {
                    // Step 4: Payment (In a real app, this would be verified via a payment gateway)
                    if (req.body.paymentCaptured) {
                        user.registrationPaymentStatus = 'completed';
                        user.profileStep = 4;
                        user.isProfileComplete = true;
                    }
                } else {
                    // Legacy or generic update
                    user.name = req.body.name || user.name;
                    user.faculty = req.body.faculty || user.faculty;
                    user.department = req.body.department || user.department;
                    user.phone = req.body.phone || user.phone;
                    user.about = req.body.about || user.about;
                    user.availability = req.body.availability || user.availability;
                    user.hourlyRate = req.body.hourlyRate || user.hourlyRate;
                }
            } else {
                // Tutee or Admin generic update
                user.name = req.body.name || user.name;
                user.faculty = req.body.faculty || user.faculty;
                user.department = req.body.department || user.department;
                user.phone = req.body.phone || user.phone;
                
                const files = req.files as { [fieldname: string]: Express.Multer.File[] };
                if (files?.profilePicture?.[0]) {
                    const currentDocs = user.documents || { admissionLetter: '', transcript: '', profilePicture: '' };
                    user.documents = {
                        ...currentDocs,
                        profilePicture: `/uploads/${files.profilePicture[0].filename}`
                    };
                }
            }

            const updatedUser = await user.save();
            const userResponse = updatedUser.toObject();
            delete userResponse.password;
            res.json(userResponse);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error: any) {
        logger.error(`Update Profile Error: ${error.message}`, { error });
        res.status(500).json({ 
            message: error.name === 'ValidationError' ? error.message : "Server error updating profile", 
            error: error.message 
        });
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

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import { v2 as cloudinary } from 'cloudinary';
import Settings from '../models/Settings';
import Session from '../models/Session';
import logger from '../utils/logger';
import { uploadToCloudinary } from '../utils/cloudinaryHelper';

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
        
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        console.log(`[PROFILE_UPDATE] User: ${user.email}, Role: ${user.role}, Body Keys:`, Object.keys(req.body));

        // 1. Handle File Uploads
        if (files) {
            const fileKeys = ['profilePicture', 'admissionLetter', 'transcript'] as const;
            for (const key of fileKeys) {
                if (files[key]?.[0]) {
                    try {
                        const folder = key === 'profilePicture' ? 'profiles' : 'documents';
                        const secureUrl = await uploadToCloudinary(files[key][0].path, folder);
                        
                        if (!user.documents) {
                            user.documents = { admissionLetter: '', transcript: '', profilePicture: '' };
                        }
                        user.documents[key] = secureUrl;
                    } catch (err: any) {
                        console.error(`[${key.toUpperCase()} UPLOAD ERROR]`, err);
                        res.status(400).json({ message: `${key} upload failed: ${err.message}` });
                        return;
                    }
                }
            }
        }

        // 2. Handle Body Updates
        if (req.body.name) user.name = req.body.name;
        if (req.body.phone) user.phone = req.body.phone;
        if (req.body.about) user.about = req.body.about;
        if (req.body.level) user.level = req.body.level;
        
        if (req.body.email && req.body.email.toLowerCase() !== user.email.toLowerCase()) {
            const newEmail = req.body.email.toLowerCase().trim();
            const emailExists = await User.findOne({ email: newEmail, _id: { $ne: userId } });
            if (emailExists) {
                res.status(400).json({ message: 'Email address is already in use by another account' });
                return;
            }
            user.email = newEmail;
        }
        
        if (req.body.faculty) {
            console.log(`[PROFILE_UPDATE] Updating Faculty to: ${req.body.faculty}`);
            user.faculty = req.body.faculty;
        }
        if (req.body.department) {
            console.log(`[PROFILE_UPDATE] Updating Department to: ${req.body.department}`);
            user.department = req.body.department;
        }
        
        if (req.body.matchingBio !== undefined) user.matchingBio = req.body.matchingBio;
        if (req.body.areaOfStrength) user.areaOfStrength = req.body.areaOfStrength;
        
        if (req.body.availability) {
            try {
                user.availability = typeof req.body.availability === 'string' 
                    ? JSON.parse(req.body.availability) 
                    : req.body.availability;
            } catch {
                user.availability = req.body.availability;
            }
        }

        // Bank Details
        if (req.body.bankName || req.body.accountNumber) {
            if (!user.bankDetails) {
                user.bankDetails = { bankName: '', bankCode: '', accountNumber: '', accountName: '' };
            }
            if (req.body.bankName) user.bankDetails.bankName = req.body.bankName;
            if (req.body.bankCode) user.bankDetails.bankCode = req.body.bankCode;
            if (req.body.accountNumber) user.bankDetails.accountNumber = req.body.accountNumber;
            if (req.body.accountName) user.bankDetails.accountName = req.body.accountName;
        }

        if (req.body.hourlyRate) {
            if (user.role !== 'verified_tutor' && user.role !== 'admin') {
                res.status(403).json({ message: 'Only verified tutors can customize their hourly rate' });
                return;
            }
            const hr = Number(req.body.hourlyRate);
            const settings = await Settings.findOne() || await Settings.create({});
            if (hr > settings.maxHourlyRate) {
                res.status(400).json({ message: `Your hourly rate cannot exceed the system limit of ₦${settings.maxHourlyRate}` });
                return;
            }
            user.hourlyRate = hr;
        }

        if (req.body.courses) {
            if (Array.isArray(req.body.courses)) {
                user.courses = req.body.courses;
            } else {
                try {
                    const parsed = JSON.parse(req.body.courses);
                    user.courses = Array.isArray(parsed) ? parsed : req.body.courses.split(',').map((c: string) => c.trim()).filter(Boolean);
                } catch {
                    user.courses = req.body.courses.split(',').map((c: string) => c.trim()).filter(Boolean);
                }
            }
        }
        
        // --- Status Management ---
        // Wizard/Onboarding Step
        if (req.body.step) {
            const step = parseInt(req.body.step);
            user.profileStep = step;
            
            // Only move to pending on the FINAL step IF they aren't already approved AND NOT rejected
            if (step === 4 && !user.isApproved && user.applicationStatus !== 'rejected') {
                // If they were needs_revision, this is a resubmission
                const wasNeedsRevision = user.applicationStatus === 'needs_revision';
                user.isProfileComplete = true;
                user.applicationStatus = 'pending';
                user.adminFeedback = ''; // Clear feedback on resubmission
                console.log(`[PROFILE_UPDATE] Onboarding/Revision completed for ${user.email}. Status set to pending. (Previous: ${wasNeedsRevision ? 'needs_revision' : 'new'})`);
            }
        }

        // 3. Save the document
        console.log(`[PROFILE_UPDATE] Final Document State - Faculty: ${user.faculty}, Dept: ${user.department}, Status: ${user.applicationStatus}`);
        
        try {
            const savedUser = await user.save();
            console.log(`[PROFILE_UPDATE] SAVE SUCCESS - DB Faculty: ${savedUser.faculty}, DB Dept: ${savedUser.department}`);
            
            const userRes = savedUser.toObject();
            delete userRes.password;
            res.json(userRes);
        } catch (saveError: any) {
            console.error(`[PROFILE_UPDATE] SAVE FAILED:`, saveError);
            throw saveError;
        }

    } catch (error: any) {
        console.error('[PROFILE_UPDATE] UNCAUGHT ERROR:', error);
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
            // Fetch reviews from completed sessions
            const reviews = await Session.find({ 
                tutorId: tutor._id, 
                status: 'completed', 
                tuteeRating: { $exists: true } 
            })
            .populate('tuteeId', 'name documents.profilePicture')
            .select('tuteeRating tuteeReview createdAt tuteeId')
            .sort({ createdAt: -1 })
            .limit(20);

            // Fetch upcoming sessions to mask availability matrix
            const upcomingSessions = await Session.find({
                tutorId: tutor._id,
                status: { $in: ['pending', 'active'] }, // 'completed' sessions should not block the UI availability
                date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } // From today onwards
            }).select('date time');

            const occupiedSlots = upcomingSessions.map(s => {
                const dateStr = s.date.toISOString().split('T')[0];
                return `${dateStr}T${s.time}`;
            });

            console.log(`[OCCUPIED_SLOTS] Tutor: ${tutor.name}, Count: ${occupiedSlots.length}, Slots:`, occupiedSlots);

            const tutorData = {
                ...tutor.toObject(),
                reviews,
                occupiedSlots
            };
            res.json(tutorData);
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

// @desc    Get system admin ID for support messaging
// @route   GET /api/users/admin-id
// @access  Private
export const getAdminId = async (req: Request, res: Response): Promise<void> => {
    try {
        const admin = await User.findOne({ role: 'admin' }).select('_id name');
        if (admin) {
            res.json({ _id: admin._id, name: admin.name });
        } else {
            res.status(404).json({ message: 'No admin found in the system' });
        }
    } catch (error: any) {
        logger.error(`Get Admin ID Error: ${error.message}`, { error });
        res.status(500).json({ message: "Server error getting admin ID", error: error.message });
    }
};

// @desc    Submit a new course application (Registered tutors only)
// @route   POST /api/users/apply-course
// @access  Private
export const submitCourseApplication = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        const { courses } = req.body;
        const file = req.file;

        if (!courses || !file) {
            res.status(400).json({ message: "Please provide courses and a supporting transcript." });
            return;
        }

        const user = await User.findById(userId);
        if (!user || !user.role.includes('tutor')) {
            res.status(403).json({ message: "Only registered tutors can apply for new courses." });
            return;
        }

        // Upload transcript to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
            folder: 'abu_tutors/documents'
        });

        const newApplication = {
            courses: Array.isArray(courses) ? courses : JSON.parse(courses),
            transcript: result.secure_url,
            status: 'pending' as const,
            createdAt: new Date()
        };

        if (!user.courseApplications) user.courseApplications = [];
        user.courseApplications.push(newApplication);

        await user.save();

        if (require('fs').existsSync(file.path)) {
            require('fs').unlinkSync(file.path);
        }

        res.status(201).json({ message: "Course application submitted successfully.", user });
    } catch (error: any) {
        logger.error(`Submit Course Application Error: ${error.message}`);
        res.status(500).json({ message: "Server error submitting course application", error: error.message });
    }
};

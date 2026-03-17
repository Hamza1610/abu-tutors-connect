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
            user.name = req.body.name || user.name;
            user.faculty = req.body.faculty || user.faculty;
            user.department = req.body.department || user.department;
            
            // Allow tutors to update specific fields
            if (user.role === 'tutor' || user.role === 'verified_tutor') {
                user.level = req.body.level || user.level;
                // Admission ID shouldn't typically be changed after registration, but allowing for now
                if(req.body.admissionId) {
                    const admissionIdRegex = /^U\d{2}[A-Z]{2}\d{4}$/;
                    if (!admissionIdRegex.test(req.body.admissionId)) {
                        res.status(400).json({ message: "Invalid ABU Admission ID format. Expected format: U21COxxxx" });
                        return;
                    }
                    user.admissionId = req.body.admissionId;
                }
                user.courses = req.body.courses || user.courses;
                user.about = req.body.about || user.about;
                user.availability = req.body.availability || user.availability;
            }

            // Note: Email changes might require re-verification in a real app
            // User shouldn't be able to change role via profile update usually,
            // but for simplicity we'll allow an admin-like backend behavior later
            // if needed. We don't update role here directly.

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                faculty: updatedUser.faculty,
                department: updatedUser.department,
                level: updatedUser.level,
                admissionId: updatedUser.admissionId,
                courses: updatedUser.courses,
                about: updatedUser.about,
                availability: updatedUser.availability,
                rating: updatedUser.rating,
                sessionsCompleted: updatedUser.sessionsCompleted
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error: any) {
        logger.error(`Update Profile Error: ${error.message}`, { error });
        res.status(500).json({ message: "Server error updating profile", error: error.message });
    }
};

// @desc    Get all tutors (for discovery)
// @route   GET /api/users/tutors
// @access  Public
export const getTutors = async (req: Request, res: Response): Promise<void> => {
    try {
        const tutors = await User.find({ 
            role: { $in: ['tutor', 'verified_tutor'] } 
        }).select('-password').sort({ sessionsCompleted: -1, rating: -1 });
        
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

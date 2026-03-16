"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTutorProfile = exports.updateProfile = exports.getProfile = void 0;
const User_1 = __importDefault(require("../models/User"));
const logger_1 = __importDefault(require("../utils/logger"));
// @desc    Get user profile (current user)
// @route   GET /api/users/
// @access  Private
const getProfile = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user.id).select('-password');
        if (user) {
            res.json(user);
        }
        else {
            res.status(404).json({ message: 'User not found' });
        }
    }
    catch (error) {
        logger_1.default.error(`Get Profile Error: ${error.message}`, { error });
        res.status(500).json({ message: "Server error getting profile", error: error.message });
    }
};
exports.getProfile = getProfile;
// @desc    Update user profile
// @route   PUT /api/users/
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user.id);
        if (user) {
            user.name = req.body.name || user.name;
            user.faculty = req.body.faculty || user.faculty;
            user.department = req.body.department || user.department;
            // Allow tutors to update specific fields
            if (user.role === 'tutor' || user.role === 'verified_tutor') {
                user.level = req.body.level || user.level;
                // Admission ID shouldn't typically be changed after registration, but allowing for now
                if (req.body.admissionId) {
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
        }
        else {
            res.status(404).json({ message: 'User not found' });
        }
    }
    catch (error) {
        logger_1.default.error(`Update Profile Error: ${error.message}`, { error });
        res.status(500).json({ message: "Server error updating profile", error: error.message });
    }
};
exports.updateProfile = updateProfile;
// @desc    Get tutor profile by ID
// @route   GET /api/users/tutors/:id
// @access  Public
const getTutorProfile = async (req, res) => {
    try {
        const tutor = await User_1.default.findById(req.params.id).select('-password');
        if (tutor && (tutor.role === 'tutor' || tutor.role === 'verified_tutor')) {
            res.json(tutor);
        }
        else {
            res.status(404).json({ message: 'Tutor not found' });
        }
    }
    catch (error) {
        logger_1.default.error(`Get Tutor Profile Error: ${error.message}`, { error });
        res.status(500).json({ message: "Server error getting tutor profile", error: error.message });
    }
};
exports.getTutorProfile = getTutorProfile;
//# sourceMappingURL=userController.js.map
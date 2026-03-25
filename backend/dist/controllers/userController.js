"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTutorProfile = exports.getTutors = exports.updateProfile = exports.getProfile = void 0;
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
            // Handle Step-based updates for Tutors
            if (user.role === 'tutor' || user.role === 'verified_tutor') {
                const step = parseInt(req.body.step);
                if (step === 1) {
                    // Step 1: Personal Details
                    user.faculty = req.body.faculty || user.faculty;
                    user.department = req.body.department || user.department;
                    user.level = req.body.level || user.level;
                    user.phone = req.body.phone || user.phone;
                    if (user.profileStep < 1)
                        user.profileStep = 1;
                }
                else if (step === 2) {
                    // Step 2: Educational Background
                    user.teachingLevel = req.body.teachingLevel || user.teachingLevel;
                    if (req.body.courses) {
                        try {
                            user.courses = JSON.parse(req.body.courses);
                        }
                        catch (e) {
                            user.courses = req.body.courses.split(',').map((c) => c.trim());
                        }
                    }
                    user.areaOfStrength = req.body.areaOfStrength || user.areaOfStrength;
                    if (user.profileStep < 2)
                        user.profileStep = 2;
                }
                else if (step === 3) {
                    // Step 3: Documents
                    const files = req.files;
                    if (files) {
                        const currentDocs = user.documents || { admissionLetter: '', transcript: '', profilePicture: '' };
                        const newDocs = { ...currentDocs };
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
                    if (user.profileStep < 3)
                        user.profileStep = 3;
                }
                else if (step === 4) {
                    // Step 4: Payment (In a real app, this would be verified via a payment gateway)
                    if (req.body.paymentCaptured) {
                        user.registrationPaymentStatus = 'completed';
                        user.profileStep = 4;
                        user.isProfileComplete = true;
                    }
                }
                else {
                    // Legacy or generic update
                    user.name = req.body.name || user.name;
                    user.faculty = req.body.faculty || user.faculty;
                    user.department = req.body.department || user.department;
                    user.phone = req.body.phone || user.phone;
                    user.about = req.body.about || user.about;
                    user.availability = req.body.availability || user.availability;
                    user.hourlyRate = req.body.hourlyRate || user.hourlyRate;
                }
            }
            else {
                // Tutee or Admin generic update
                user.name = req.body.name || user.name;
                user.faculty = req.body.faculty || user.faculty;
                user.department = req.body.department || user.department;
                user.phone = req.body.phone || user.phone;
                const files = req.files;
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
        }
        else {
            res.status(404).json({ message: 'User not found' });
        }
    }
    catch (error) {
        logger_1.default.error(`Update Profile Error: ${error.message}`, { error });
        res.status(500).json({
            message: error.name === 'ValidationError' ? error.message : "Server error updating profile",
            error: error.message
        });
    }
};
exports.updateProfile = updateProfile;
// @desc    Get all tutors (for discovery)
// @route   GET /api/users/tutors
// @access  Public
const getTutors = async (req, res) => {
    try {
        const tutors = await User_1.default.find({
            role: { $in: ['tutor', 'verified_tutor'] },
            isApproved: true // Only show approved tutors in marketplace
        }).select('-password').sort({ sessionsCompleted: -1, averageRating: -1 });
        res.json(tutors);
    }
    catch (error) {
        logger_1.default.error(`Get Tutors Error: ${error.message}`, { error });
        res.status(500).json({ message: "Server error getting tutors", error: error.message });
    }
};
exports.getTutors = getTutors;
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
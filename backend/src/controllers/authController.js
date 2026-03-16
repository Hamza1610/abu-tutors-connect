"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const User_1 = __importDefault(require("../models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("../utils/logger"));
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development";
const register = async (req, res) => {
    try {
        const { name, email, password, role, faculty, department, // tutee + tutor
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
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: "User already exists with that email" });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        const user = new User_1.default({
            name, email, password: hashedPassword, role: role || "tutee",
            faculty, department, level, admissionId, courses, about, gender
        });
        await user.save();
        // Auto-login upon registration
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        logger_1.default.info(`User registered successfully: ${email}`);
        res.status(201).json({
            message: "User registered successfully",
            token,
            user: { id: user._id, name: user.name, role: user.role, email: user.email }
        });
    }
    catch (error) {
        logger_1.default.error(`Register Error: ${error.message}`, { error });
        res.status(500).json({ message: "Server error during registration", error: error.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.default.findOne({ email });
        if (!user || user.password === undefined) {
            res.status(400).json({ message: "Invalid credentials" });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ message: "Invalid credentials" });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        logger_1.default.info(`Login successful: ${email}`);
        res.status(200).json({
            message: "Login successful",
            token,
            user: { id: user._id, name: user.name, role: user.role, email: user.email }
        });
    }
    catch (error) {
        logger_1.default.error(`Login Error: ${error.message}`, { error });
        res.status(500).json({ message: "Server error during login", error: error.message });
    }
};
exports.login = login;
//# sourceMappingURL=authController.js.map
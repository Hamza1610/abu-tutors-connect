"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.admin = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("../utils/logger"));
const User_1 = __importDefault(require("../models/User"));
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development";
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            if (!token) {
                res.status(401).json({ message: 'Not authorized, token missing' });
                return;
            }
            // Verify token
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            // Fetch the user from the database and attach to request
            req.user = await User_1.default.findById(decoded.id).select('-password');
            if (!req.user) {
                res.status(401).json({ message: 'Not authorized, user not found' });
                return;
            }
            next();
        }
        catch (error) {
            logger_1.default.error('Token verification failed', { error });
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};
exports.protect = protect;
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    }
    else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};
exports.admin = admin;
//# sourceMappingURL=authMiddleware.js.map
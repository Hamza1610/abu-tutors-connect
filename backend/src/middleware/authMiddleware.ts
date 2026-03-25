import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development";

// We need to extend the Express Request interface to include the user
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            if (!token) {
                res.status(401).json({ message: 'Not authorized, token missing' });
                return;
            }

            // Verify token
            const decoded: any = jwt.verify(token, JWT_SECRET);

            // Fetch the user from the database and attach to request
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                res.status(401).json({ message: 'Not authorized, user not found' });
                return;
            }

            next();
        } catch (error) {
            logger.error('Token verification failed', { error });
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export const admin = (req: Request, res: Response, next: NextFunction): void => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

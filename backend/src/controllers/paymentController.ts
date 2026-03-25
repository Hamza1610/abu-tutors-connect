import { Request, Response } from 'express';
import User from '../models/User';
import Settings from '../models/Settings';
import logger from '../utils/logger';

// @desc    Pay tutor registration fee (Mock)
// @route   POST /api/payment/register-tutor
// @access  Private
export const payRegistrationFee = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        const settings = await Settings.findOne();
        if (settings?.isRegistrationFree) {
            user.registrationPaymentStatus = 'free';
        } else {
            // Mocking payment success
            user.registrationPaymentStatus = 'completed';
        }

        // Check if profile is complete now that payment is done
        const isMissingDocs = !user.documents?.admissionLetter || !user.documents?.transcript;
        const isMissingInfo = !user.faculty || !user.department || !user.level;
        
        if (!isMissingDocs && !isMissingInfo) {
            user.isProfileComplete = true;
            user.profileStep = 4;
        }

        await user.save();
        res.json({ message: "Registration payment successful", status: user.registrationPaymentStatus });
    } catch (error: any) {
        logger.error(`Registration Payment Error: ${error.message}`);
        res.status(500).json({ message: "Server error during registration payment" });
    }
};

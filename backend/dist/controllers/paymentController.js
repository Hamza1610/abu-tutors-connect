"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.payRegistrationFee = void 0;
const User_1 = __importDefault(require("../models/User"));
const Settings_1 = __importDefault(require("../models/Settings"));
const logger_1 = __importDefault(require("../utils/logger"));
// @desc    Pay tutor registration fee (Mock)
// @route   POST /api/payment/register-tutor
// @access  Private
const payRegistrationFee = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user.id);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const settings = await Settings_1.default.findOne();
        if (settings?.isRegistrationFree) {
            user.registrationPaymentStatus = 'free';
        }
        else {
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
    }
    catch (error) {
        logger_1.default.error(`Registration Payment Error: ${error.message}`);
        res.status(500).json({ message: "Server error during registration payment" });
    }
};
exports.payRegistrationFee = payRegistrationFee;
//# sourceMappingURL=paymentController.js.map
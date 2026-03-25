"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const fileUpload_1 = require("../middleware/fileUpload");
const router = express_1.default.Router();
// Public routes for tutor discovery - MOVED TO TOP
router.get('/tutors', userController_1.getTutors);
router.get('/tutors/:id', userController_1.getTutorProfile);
router.route('/')
    .get(authMiddleware_1.protect, userController_1.getProfile)
    .put(authMiddleware_1.protect, fileUpload_1.upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'admissionLetter', maxCount: 1 },
    { name: 'transcript', maxCount: 1 }
]), fileUpload_1.validateFileSize, userController_1.updateProfile);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map
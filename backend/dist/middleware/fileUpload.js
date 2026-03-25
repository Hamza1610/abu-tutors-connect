"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFileSize = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure uploads directory exists
const uploadDir = 'uploads';
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir);
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'profilePicture') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Profile picture must be an image'));
        }
    }
    else if (file.fieldname === 'admissionLetter' || file.fieldname === 'transcript') {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        }
        else {
            cb(new Error('Documents must be in PDF format'));
        }
    }
    else {
        cb(null, true);
    }
};
exports.upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 500 * 1024 // Default 500kb, we'll check specific limits in controller/middleware
    }
});
// Specific middleware for different limits if needed, or check in the controller
const validateFileSize = (req, res, next) => {
    if (!req.files)
        return next();
    const files = req.files;
    const profPic = files.profilePicture;
    if (profPic && profPic[0] && profPic[0].size > 100 * 1024) {
        return res.status(400).json({ message: 'Profile picture must be less than 100KB' });
    }
    const admLetter = files.admissionLetter;
    if (admLetter && admLetter[0] && admLetter[0].size > 500 * 1024) {
        return res.status(400).json({ message: 'Admission letter must be less than 500KB' });
    }
    const transcript = files.transcript;
    if (transcript && transcript[0] && transcript[0].size > 500 * 1024) {
        return res.status(400).json({ message: 'Transcript must be less than 500KB' });
    }
    next();
};
exports.validateFileSize = validateFileSize;
//# sourceMappingURL=fileUpload.js.map
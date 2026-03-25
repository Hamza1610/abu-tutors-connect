import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.fieldname === 'profilePicture') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Profile picture must be an image'));
        }
    } else if (file.fieldname === 'admissionLetter' || file.fieldname === 'transcript') {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Documents must be in PDF format'));
        }
    } else {
        cb(null, true);
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 500 * 1024 // Default 500kb, we'll check specific limits in controller/middleware
    }
});

// Specific middleware for different limits if needed, or check in the controller
export const validateFileSize = (req: any, res: any, next: any) => {
    if (!req.files) return next();

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
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

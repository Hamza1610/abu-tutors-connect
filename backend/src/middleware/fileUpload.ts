import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary-v2';

// Ensure uploads directory exists for local fallback
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// ─── Storage Engine Logic ───────────────────────────────────────────────────
let storage;

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.NODE_ENV === 'production') {
    console.log('[UPLOAD] Using Cloudinary Storage for Production');
    storage = new CloudinaryStorage({
        cloudinary: cloudinary as any,
        params: async (req: Request, file: any) => {
            const folder = file.fieldname === 'profilePicture' ? 'profiles' : 'documents';
            return {
                folder: `abututors/${folder}`,
                public_id: `${file.fieldname}-${Date.now()}`,
                resource_type: 'auto'
            };
        },
    });
} else {
    console.log('[UPLOAD] Using Local Disk Storage');
    storage = multer.diskStorage({
        destination: (req: Request, file: any, cb: any) => {
            cb(null, uploadDir);
        },
        filename: (req: Request, file: any, cb: any) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    });
}

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.fieldname === 'profilePicture') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Profile picture must be an image'));
        }
    } else if (file.fieldname === 'admissionLetter' || file.fieldname === 'transcript') {
        const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Documents must be PDF or JPG/PNG image format'));
        }
    } else {
        cb(null, true);
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit to handle modern photos
    }
});

// Specific middleware for different limits if needed, or check in the controller
export const validateFileSize = (req: any, res: any, next: any) => {
    if (!req.files) return next();

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    const profPic = files.profilePicture;
    if (profPic && profPic[0] && profPic[0].size > 1024 * 1024) {
        return res.status(400).json({ message: 'Profile picture must be less than 1MB' });
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

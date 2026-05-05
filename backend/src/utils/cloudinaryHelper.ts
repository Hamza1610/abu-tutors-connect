import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import logger from './logger';

/**
 * Uploads a file to Cloudinary from a local path or a URL.
 * If the path is already a Cloudinary URL, it returns it as is.
 */
export const uploadToCloudinary = async (filePath: string, folder: string): Promise<string> => {
    try {
        // If it's already a URL, no need to upload again
        if (filePath.startsWith('http')) {
            return filePath;
        }

        const result = await cloudinary.uploader.upload(filePath, {
            folder: `abu_tutors/${folder}`,
            resource_type: 'auto'
        });

        // Delete local file after upload
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        return result.secure_url;
    } catch (error: any) {
        logger.error(`[CLOUDINARY_UPLOAD_ERROR] ${error.message}`);
        throw error;
    }
};

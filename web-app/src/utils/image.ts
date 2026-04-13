/**
 * Resolves an image path to a full URL.
 * Handles both absolute URLs (e.g. from Cloudinary) and relative paths (e.g. from local uploads).
 */
export const getImageUrl = (path: string | undefined | null): string => {
    if (!path) return '';
    
    // If it's already a full URL, return it
    if (path.startsWith('http')) {
        return path;
    }
    
    // Otherwise, prefix with the backend API URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    
    // Ensure we don't have double slashes if the path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    return `${baseUrl}${cleanPath}`;
};

import { BASE_URL } from '../services/api';

/**
 * Resolves an image path to a full URL (handles Cloudinary and local uploads).
 */
export function getImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path; // Cloudinary or absolute URL
  
  // Local backend upload
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  // Ensure we use the API base URL but strip '/api' if it's there for static files
  const host = BASE_URL.replace('/api', '');
  return `${host}/${cleanPath}`;
}

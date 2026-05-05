/**
 * ABUTutors Connect - Mobile Configuration
 * 
 * Update BASE_URL to your production backend URL when deploying.
 * For local development:
 * - Web: http://localhost:5001/api
 * - Android/iOS: http://<YOUR_PC_IP>:5001/api
 */

// PRODUCTION URL (Replace with your actual backend URL after deploying to Render/Railway)
const PROD_URL = 'https://abu-tutors-connect.onrender.com/api';

// DEVELOPMENT URL (Local Network)
const DEV_NATIVE_URL = 'http://10.227.172.38:5001/api';
const DEV_WEB_URL = 'http://localhost:5001/api';

// Set this to true when building the APK for production
const IS_PRODUCTION = true;

export const Config = {
  BASE_URL: IS_PRODUCTION
    ? PROD_URL
    : (typeof window !== 'undefined' ? DEV_WEB_URL : DEV_NATIVE_URL),

  // App Info
  VERSION: '1.0.0',
  BUILD_NUMBER: '1',
};

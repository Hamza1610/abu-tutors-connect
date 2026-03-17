import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptors here if needed (e.g., attaching JWTs automatically to requests)
api.interceptors.request.use(
    (config) => {
        // We can conditionally add a token here from localStorage if the user is authenticated.
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const authApi = {
    login: (data: any) => api.post('/auth/login', data),
    register: (data: any) => api.post('/auth/register', data),
};

export const userApi = {
    // Get current logged-in user profile
    getProfile: () => api.get('/users/'),
    
    // Update current user profile
    updateProfile: (data: any) => api.put('/users/', data),
    
    // Get all tutors (public)
    getTutors: () => api.get('/users/tutors'),

    // Get public tutor profile
    getTutorProfile: (id: string) => api.get(`/users/tutors/${id}`),
};

export const sessionApi = {
    // Book a session
    bookSession: (data: any) => api.post('/sessions', data),
    
    // Get all user sessions
    getSessions: () => api.get('/sessions'),
    
    // Start session (tutor scans tutee QR)
    startSession: (id: string, qrData: string) => api.post(`/sessions/${id}/start`, { qrData }),

    // Complete session (tutee scans tutor QR)
    completeSession: (id: string, qrData: string) => api.post(`/sessions/${id}/complete`, { qrData }),
};

export const walletApi = {
    // Get wallet balance and history
    getWallet: () => api.get('/wallets'),
    
    // Initialize Paystack payment
    initializePayment: (amount: number) => api.post('/wallets/initialize', { amount }),

    // Verify Paystack payment
    verifyPayment: (reference: string) => api.get(`/wallets/verify?reference=${reference}`),
};

export const statsApi = {
    // Get tutor dashboard stats
    getTutorStats: () => api.get('/stats/tutor'),
};

export const notificationApi = {
    // Get notifications
    getNotifications: () => api.get('/notifications'),
    
    // Mark as read
    markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
    
    // Delete notification
    deleteNotification: (id: string) => api.delete(`/notifications/${id}`),
};

export default api;

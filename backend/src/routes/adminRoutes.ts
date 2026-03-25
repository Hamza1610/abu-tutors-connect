import express from 'express';
import { 
    getPendingTutors, approveTutor, getSettings, updateSettings,
    addVenue, updateVenue, deleteVenue, getVenues,
    getAllUsers, updateUserStatus, getAdminLogs,
    getAllSessions, overrideSession, getFinancialStats,
    reconcileEscrows
} from '../controllers/adminController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/pending-tutors', protect, admin, getPendingTutors);
router.put('/tutors/:id/approve', protect, admin, approveTutor);

router.route('/settings')
    .get(getSettings)
    .put(protect, admin, updateSettings);

router.route('/venues')
    .get(getVenues)
    .post(protect, admin, addVenue);

router.route('/venues/:id')
    .put(protect, admin, updateVenue as any)
    .delete(protect, admin, deleteVenue as any);

// User Management
router.get('/users', protect, admin, getAllUsers);
router.put('/users/:id/status', protect, admin, updateUserStatus);

// Activity Logs
router.get('/logs', protect, admin, getAdminLogs);

// Session Monitoring
router.get('/sessions', protect, admin, getAllSessions);
router.put('/sessions/:id/override', protect, admin, overrideSession);

// Financial Monitoring
router.get('/finances', protect, admin, getFinancialStats);
router.post('/reconcile-escrow', protect, admin, reconcileEscrows);

export default router;

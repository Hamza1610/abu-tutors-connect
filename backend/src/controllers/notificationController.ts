import { Request, Response } from 'express';
import Notification from '../models/Notification';
import logger from '../utils/logger';

// @desc    Get all notifications for current user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(50);
        
        res.json(notifications);
    } catch (error: any) {
        logger.error(`Get Notifications Error: ${error.message}`, { error });
        res.status(500).json({ message: 'Server error fetching notifications', error: error.message });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const notification = await Notification.findOneAndUpdate(
            { _id: id as any, userId: req.user.id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            res.status(404).json({ message: 'Notification not found' });
            return;
        }

        res.json(notification);
    } catch (error: any) {
        logger.error(`Mark Notification Error: ${error.message}`, { error });
        res.status(500).json({ message: 'Server error updating notification', error: error.message });
    }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await Notification.findOneAndDelete({ _id: id as any, userId: req.user.id });

        if (!result) {
            res.status(404).json({ message: 'Notification not found' });
            return;
        }

        res.json({ message: 'Notification deleted' });
    } catch (error: any) {
        logger.error(`Delete Notification Error: ${error.message}`, { error });
        res.status(500).json({ message: 'Server error deleting notification', error: error.message });
    }
};

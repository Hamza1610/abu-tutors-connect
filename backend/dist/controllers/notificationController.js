"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.markAsRead = exports.getNotifications = void 0;
const Notification_1 = __importDefault(require("../models/Notification"));
const logger_1 = __importDefault(require("../utils/logger"));
// @desc    Get all notifications for current user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await Notification_1.default.find({ userId })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    }
    catch (error) {
        logger_1.default.error(`Get Notifications Error: ${error.message}`, { error });
        res.status(500).json({ message: 'Server error fetching notifications', error: error.message });
    }
};
exports.getNotifications = getNotifications;
// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification_1.default.findOneAndUpdate({ _id: id, userId: req.user.id }, { read: true }, { new: true });
        if (!notification) {
            res.status(404).json({ message: 'Notification not found' });
            return;
        }
        res.json(notification);
    }
    catch (error) {
        logger_1.default.error(`Mark Notification Error: ${error.message}`, { error });
        res.status(500).json({ message: 'Server error updating notification', error: error.message });
    }
};
exports.markAsRead = markAsRead;
// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Notification_1.default.findOneAndDelete({ _id: id, userId: req.user.id });
        if (!result) {
            res.status(404).json({ message: 'Notification not found' });
            return;
        }
        res.json({ message: 'Notification deleted' });
    }
    catch (error) {
        logger_1.default.error(`Delete Notification Error: ${error.message}`, { error });
        res.status(500).json({ message: 'Server error deleting notification', error: error.message });
    }
};
exports.deleteNotification = deleteNotification;
//# sourceMappingURL=notificationController.js.map
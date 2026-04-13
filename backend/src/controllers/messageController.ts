import { Request, Response } from 'express';
import Message from '../models/Message';
import User from '../models/User';
import Notification from '../models/Notification';
import logger from '../utils/logger';
import { emitNewMessage, emitMessageRead } from '../utils/socketManager';

interface AuthRequest extends Request {
    user?: any;
}

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { receiverId, content } = req.body;
        const senderId = req.user.id;

        if (!receiverId || !content) {
            res.status(400).json({ message: 'Receiver ID and content are required' });
            return;
        }

        const message = await Message.create({
            senderId,
            receiverId,
            content
        });

        // Create notification for receiver
        const sender = await User.findById(senderId).select('name');
        await Notification.create({
            userId: receiverId,
            title: `New Message from ${sender?.name || 'User'}`,
            message: content.length > 50 ? content.substring(0, 47) + '...' : content,
            type: 'message',
            link: `/messages?partnerId=${senderId}`
        });

        // Real-time emission to both parties
        emitNewMessage(senderId as string, receiverId as string, message);

        res.status(201).json(message);
    } catch (error: any) {
        logger.error(`Send Message Error: ${error.message}`);
        res.status(500).json({ message: 'Server error sending message' });
    }
};

// @desc    Get messages for a conversation
// @route   GET /api/messages/:otherUserId
// @access  Private
export const getConversation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { otherUserId } = req.params;
        const userId = req.user.id;

        const messages = await Message.find({
            $or: [
                { senderId: userId as any, receiverId: otherUserId as any },
                { senderId: otherUserId as any, receiverId: userId as any }
            ]
        }).sort({ createdAt: 1 });

        // Mark unread messages as read
        await Message.updateMany(
            { senderId: otherUserId as any, receiverId: userId as any, isRead: false },
            { isRead: true }
        );

        // Mark related notifications as read
        await Notification.updateMany(
            { 
                userId: userId as any, 
                type: 'message', 
                link: { $regex: otherUserId as string } 
            },
            { read: true }
        );

        // Real-time emission for "Read Receipt" (Blue Tick)
        emitMessageRead(otherUserId as string, userId as string);

        res.json(messages);
    } catch (error: any) {
        logger.error(`Get Conversation Error: ${error.message}`);
        res.status(500).json({ message: 'Server error getting conversation' });
    }
};

// @desc    Get all conversations for the current user
// @route   GET /api/messages/conversations
// @access  Private
export const getChatList = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user.id as string;

        // Find unique users the current user has chatted with
        const messages = await Message.find({
            $or: [{ senderId: userId as any }, { receiverId: userId as any }]
        }).sort({ createdAt: -1 });

        const chatPartners = new Set<string>();
        const latestMessages: any[] = [];

        for (const msg of messages) {
            const partnerId = msg.senderId.toString() === userId 
                ? msg.receiverId.toString() 
                : msg.senderId.toString();

            if (!chatPartners.has(partnerId)) {
                chatPartners.add(partnerId);
                const partner = await User.findById(partnerId).select('name role documents');
                latestMessages.push({
                    partner,
                    lastMessage: msg
                });
            }
        }

        res.json(latestMessages);
    } catch (error: any) {
        logger.error(`Get Chat List Error: ${error.message}`);
        res.status(500).json({ message: 'Server error getting chat list' });
    }
};

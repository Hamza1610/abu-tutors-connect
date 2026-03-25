import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
    tutorId: mongoose.Types.ObjectId;
    tuteeId: mongoose.Types.ObjectId;
    date: Date;
    time: string;
    topic: string;
    status: 'pending' | 'active' | 'completed' | 'cancelled' | 'dispute';
    escrowStatus: 'none' | 'held' | 'released' | 'refunded';
    amount: number;
    venue?: string;
    // Feedback
    tuteeRating?: number;
    tutorRating?: number;
    tuteeReview?: string;
    tutorReview?: string;
    // QR / Timeline Tracking
    startQRCodeData?: string;
    completionQRCodeData?: string;
    startPIN?: string;
    completionPIN?: string;
    actualStartTime?: Date;
    actualEndTime?: Date;
    lastSyncTime?: Date;
    meetingLink?: string; // Optional for online sessions
}

const SessionSchema: Schema = new Schema({
    tutorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tuteeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    topic: { type: String, required: true },
    venue: { type: String },
    status: { 
        type: String, 
        enum: ['pending', 'active', 'completed', 'cancelled', 'dispute'], 
        default: 'pending' 
    },
    escrowStatus: {
        type: String,
        enum: ['none', 'held', 'released', 'refunded'],
        default: 'none'
    },
    amount: { type: Number, required: true },
    startQRCodeData: { type: String },
    completionQRCodeData: { type: String },
    startPIN: { type: String },
    completionPIN: { type: String },
    actualStartTime: { type: Date },
    actualEndTime: { type: Date },
    lastSyncTime: { type: Date },
    meetingLink: { type: String },
    tuteeRating: { type: Number },
    tutorRating: { type: Number },
    tuteeReview: { type: String },
    tutorReview: { type: String }
}, { timestamps: true });

export default mongoose.model<ISession>('Session', SessionSchema);

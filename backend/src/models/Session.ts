import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
    tutorId: mongoose.Types.ObjectId;
    tuteeId: mongoose.Types.ObjectId;
    date: Date;
    time: string;
    topic: string;
    status: 'pending' | 'active' | 'completed' | 'cancelled';
    amount: number;
    qrCodeData?: string;
    meetingLink?: string; // Optional for online sessions
}

const SessionSchema: Schema = new Schema({
    tutorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tuteeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    topic: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'active', 'completed', 'cancelled'], 
        default: 'pending' 
    },
    amount: { type: Number, required: true },
    qrCodeData: { type: String },
    meetingLink: { type: String }
}, { timestamps: true });

export default mongoose.model<ISession>('Session', SessionSchema);

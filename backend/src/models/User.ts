import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: 'tutee' | 'tutor' | 'verified_tutor';
    faculty?: string;
    department?: string;
    // Tutor fields
    level?: string;
    admissionId?: string;
    courses?: string[];
    availability?: any[];
    about?: string;
    gender?: string;
    // Day 7 Additions
    hourlyRate?: number;
    notificationPreferences?: {
        sessionReminders: boolean;
        newMessages: boolean;
        bookingRequests: boolean;
        paymentNotifications: boolean;
    };
    // Rating and session stats
    sessionsCompleted: number;
    rating: number;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["tutee", "tutor", "verified_tutor"], default: "tutee" },
    faculty: { type: String },
    department: { type: String },
    // Tutor fields
    level: { type: String },
    admissionId: { type: String }, // Validated via regex on API side
    courses: [{ type: String }],
    availability: [{ type: Object }], // e.g. [{ day: "Monday", slots: ["14:00-16:00"] }]
    about: { type: String },
    gender: { type: String },
    // Day 7 Additions
    hourlyRate: { type: Number, default: 500 },
    notificationPreferences: {
        sessionReminders: { type: Boolean, default: true },
        newMessages: { type: Boolean, default: true },
        bookingRequests: { type: Boolean, default: true },
        paymentNotifications: { type: Boolean, default: true }
    },
    // Rating and session stats
    sessionsCompleted: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: 'tutee' | 'tutor' | 'verified_tutor' | 'admin';
    registrationNumber: string; // New: Unique ID for tutor/tutee
    faculty?: string;
    department?: string;
    acceptedTerms: boolean;
    profileStep: number; // 0: Registered, 1: Personal, 2: Educational, 3: Documents, 4: Payment/Complete
    // Tutor specific fields
    level?: string; // 100L, 200L etc.
    teachingLevel?: string; // Level they can teach
    courses?: string[]; // Course Titles/Codes
    areaOfStrength?: string;
    phone?: string;
    // Profile verification
    isProfileComplete: boolean;
    isApproved: boolean;
    registrationPaymentStatus: 'pending' | 'completed' | 'free';
    documents?: {
        admissionLetter: string; // URL/Path
        transcript: string; // URL/Path
        profilePicture: string; // URL/Path
    };
    // Rating and session stats
    sessionsCompleted: number;
    hourlyRate: number;
    averageRating: number;
    availability?: any[];
    about?: string;
    gender?: string;
    notificationPreferences?: {
        sessionReminders: boolean;
        newMessages: boolean;
        bookingRequests: boolean;
        paymentNotifications: boolean;
    };
    bankDetails?: {
        bankName: string;
        bankCode: string;
        accountNumber: string;
        accountName: string;
        recipientCode?: string;
    };
    transactionPin?: string; // Hashed 4-6 digit PIN
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["tutee", "tutor", "verified_tutor", "admin"], default: "tutee" },
    registrationNumber: { type: String, unique: true, sparse: true },
    faculty: { type: String },
    department: { type: String },
    acceptedTerms: { type: Boolean, required: true, default: false },
    profileStep: { type: Number, default: 0 },
    // Tutor specific fields
    level: { type: String },
    teachingLevel: { type: String },
    courses: [{ type: String }],
    areaOfStrength: { type: String },
    phone: { type: String },
    // Profile verification
    isProfileComplete: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    registrationPaymentStatus: { type: String, enum: ['pending', 'completed', 'free'], default: 'pending' },
    documents: {
        admissionLetter: { type: String },
        transcript: { type: String },
        profilePicture: { type: String }
    },
    // Rating and session stats
    sessionsCompleted: { type: Number, default: 0 },
    hourlyRate: { type: Number, default: 500 },
    averageRating: { type: Number, default: 0 },
    availability: [{ type: Object }], // e.g. [{ day: "Monday", slots: ["14:00-16:00"] }]
    about: { type: String },
    gender: { type: String },
    notificationPreferences: {
        sessionReminders: { type: Boolean, default: true },
        newMessages: { type: Boolean, default: true },
        bookingRequests: { type: Boolean, default: true },
        paymentNotifications: { type: Boolean, default: true }
    },
    bankDetails: {
        bankName: { type: String },
        bankCode: { type: String },
        accountNumber: { type: String },
        accountName: { type: String },
        recipientCode: { type: String }
    },
    transactionPin: { type: String }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);

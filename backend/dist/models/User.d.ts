import mongoose, { Document } from 'mongoose';
export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: 'tutee' | 'tutor' | 'verified_tutor' | 'admin';
    registrationNumber: string;
    faculty?: string;
    department?: string;
    acceptedTerms: boolean;
    profileStep: number;
    level?: string;
    teachingLevel?: string;
    courses?: string[];
    areaOfStrength?: string;
    phone?: string;
    isProfileComplete: boolean;
    isApproved: boolean;
    registrationPaymentStatus: 'pending' | 'completed' | 'free';
    documents?: {
        admissionLetter: string;
        transcript: string;
        profilePicture: string;
    };
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
}
declare const _default: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, mongoose.DefaultSchemaOptions> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IUser>;
export default _default;
//# sourceMappingURL=User.d.ts.map
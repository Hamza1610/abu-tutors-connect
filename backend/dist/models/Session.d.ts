import mongoose, { Document } from 'mongoose';
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
    tuteeRating?: number;
    tutorRating?: number;
    tuteeReview?: string;
    tutorReview?: string;
    startQRCodeData?: string;
    completionQRCodeData?: string;
    startPIN?: string;
    completionPIN?: string;
    actualStartTime?: Date;
    actualEndTime?: Date;
    lastSyncTime?: Date;
    meetingLink?: string;
}
declare const _default: mongoose.Model<ISession, {}, {}, {}, mongoose.Document<unknown, {}, ISession, {}, mongoose.DefaultSchemaOptions> & ISession & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ISession>;
export default _default;
//# sourceMappingURL=Session.d.ts.map
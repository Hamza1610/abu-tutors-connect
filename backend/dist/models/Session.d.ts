import mongoose, { Document } from 'mongoose';
export interface ISession extends Document {
    tutorId: mongoose.Types.ObjectId;
    tuteeId: mongoose.Types.ObjectId;
    date: Date;
    time: string;
    topic: string;
    status: 'pending' | 'active' | 'completed' | 'cancelled';
    amount: number;
    qrCodeData?: string;
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
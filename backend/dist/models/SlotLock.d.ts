import mongoose, { Document } from 'mongoose';
export interface ISlotLock extends Document {
    tutorId: mongoose.Types.ObjectId;
    slot: string;
    tuteeId: mongoose.Types.ObjectId;
    expiresAt: Date;
}
declare const _default: mongoose.Model<ISlotLock, {}, {}, {}, mongoose.Document<unknown, {}, ISlotLock, {}, mongoose.DefaultSchemaOptions> & ISlotLock & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ISlotLock>;
export default _default;
//# sourceMappingURL=SlotLock.d.ts.map
import mongoose, { Document } from 'mongoose';
export interface IEscrow extends Document {
    tuteeId: mongoose.Types.ObjectId;
    tutorId: mongoose.Types.ObjectId;
    sessionId: mongoose.Types.ObjectId;
    amount: number;
    status: 'held' | 'released' | 'refunded' | 'disputed';
    reference?: string;
}
declare const _default: mongoose.Model<IEscrow, {}, {}, {}, mongoose.Document<unknown, {}, IEscrow, {}, mongoose.DefaultSchemaOptions> & IEscrow & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IEscrow>;
export default _default;
//# sourceMappingURL=Escrow.d.ts.map
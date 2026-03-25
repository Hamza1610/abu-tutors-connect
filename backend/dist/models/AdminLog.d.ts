import mongoose, { Document } from 'mongoose';
export interface IAdminLog extends Document {
    adminId: mongoose.Types.ObjectId;
    action: string;
    targetId?: string;
    details?: string;
    createdAt: Date;
}
declare const _default: mongoose.Model<IAdminLog, {}, {}, {}, mongoose.Document<unknown, {}, IAdminLog, {}, mongoose.DefaultSchemaOptions> & IAdminLog & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IAdminLog>;
export default _default;
//# sourceMappingURL=AdminLog.d.ts.map
import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminLog extends Document {
    adminId: mongoose.Types.ObjectId;
    action: string;
    targetId?: string;
    details?: string;
    createdAt: Date;
}

const AdminLogSchema: Schema = new Schema({
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    targetId: { type: String },
    details: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } });

export default mongoose.model<IAdminLog>('AdminLog', AdminLogSchema);

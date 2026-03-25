import mongoose, { Document, Schema } from 'mongoose';

export interface ISlotLock extends Document {
    tutorId: mongoose.Types.ObjectId;
    slot: string; // e.g., "2026-03-20T14:00:00Z"
    tuteeId: mongoose.Types.ObjectId;
    expiresAt: Date;
}

const SlotLockSchema: Schema = new Schema({
    tutorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    slot: { type: String, required: true },
    tuteeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true }
});

// TTL Index: Automatically remove document after expiresAt
SlotLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Unique index to prevent multiple locks for same tutor/slot
SlotLockSchema.index({ tutorId: 1, slot: 1 }, { unique: true });

export default mongoose.model<ISlotLock>('SlotLock', SlotLockSchema);

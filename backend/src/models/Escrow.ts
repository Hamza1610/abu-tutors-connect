import mongoose, { Document, Schema } from 'mongoose';

export interface IEscrow extends Document {
    tuteeId: mongoose.Types.ObjectId;
    tutorId: mongoose.Types.ObjectId;
    sessionId: mongoose.Types.ObjectId;
    amount: number;
    status: 'held' | 'released' | 'refunded' | 'disputed';
    reference?: string;
}

const EscrowSchema: Schema = new Schema({
    tuteeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tutorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true, unique: true },
    amount: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['held', 'released', 'refunded', 'disputed'], 
        default: 'held' 
    },
    reference: { type: String }
}, { timestamps: true });

export default mongoose.model<IEscrow>('Escrow', EscrowSchema);

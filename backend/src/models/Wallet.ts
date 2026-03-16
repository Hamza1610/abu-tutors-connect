import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction {
    type: 'credit' | 'debit';
    amount: number;
    description: string;
    date: Date;
    reference?: string; // Paystack ref or session ID
}

export interface IWallet extends Document {
    userId: mongoose.Types.ObjectId;
    balance: number;
    transactions: ITransaction[];
}

const TransactionSchema = new Schema({
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    date: { type: Date, default: Date.now },
    reference: { type: String }
});

const WalletSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: { type: Number, default: 0 },
    transactions: [TransactionSchema]
}, { timestamps: true });

export default mongoose.model<IWallet>('Wallet', WalletSchema);

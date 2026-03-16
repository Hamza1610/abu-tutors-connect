import mongoose, { Document } from 'mongoose';
export interface ITransaction {
    type: 'credit' | 'debit';
    amount: number;
    description: string;
    date: Date;
    reference?: string;
}
export interface IWallet extends Document {
    userId: mongoose.Types.ObjectId;
    balance: number;
    transactions: ITransaction[];
}
declare const _default: mongoose.Model<IWallet, {}, {}, {}, mongoose.Document<unknown, {}, IWallet, {}, mongoose.DefaultSchemaOptions> & IWallet & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IWallet>;
export default _default;
//# sourceMappingURL=Wallet.d.ts.map
import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
    maxHourlyRate: number;
    registrationFee: number;
    isRegistrationFree: boolean;
    minSessionsForVerify: number;
    minRatingForVerify: number;
    noShowPayoutPercent: number;
    platformCommissionPercent: number;
}

const SettingsSchema: Schema = new Schema({
    maxHourlyRate: { type: Number, default: 1500 },
    registrationFee: { type: Number, default: 3000 },
    isRegistrationFree: { type: Boolean, default: false },
    minSessionsForVerify: { type: Number, default: 5 },
    minRatingForVerify: { type: Number, default: 3.5 },
    noShowPayoutPercent: { type: Number, default: 30 },
    platformCommissionPercent: { type: Number, default: 10 }
}, { timestamps: true });

export default mongoose.model<ISettings>('Settings', SettingsSchema);

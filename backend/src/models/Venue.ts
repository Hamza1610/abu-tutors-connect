import mongoose, { Document, Schema } from 'mongoose';

export interface IVenue extends Document {
    name: string;
    location: string;
    isActive: boolean;
}

const VenueSchema: Schema = new Schema({
    name: { type: String, required: true, unique: true },
    location: { type: String, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<IVenue>('Venue', VenueSchema);

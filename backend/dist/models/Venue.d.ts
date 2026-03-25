import mongoose, { Document } from 'mongoose';
export interface IVenue extends Document {
    name: string;
    location: string;
    isActive: boolean;
}
declare const _default: mongoose.Model<IVenue, {}, {}, {}, mongoose.Document<unknown, {}, IVenue, {}, mongoose.DefaultSchemaOptions> & IVenue & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IVenue>;
export default _default;
//# sourceMappingURL=Venue.d.ts.map
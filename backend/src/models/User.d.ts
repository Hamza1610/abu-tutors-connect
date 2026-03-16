import mongoose, { Document } from 'mongoose';
export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: 'tutee' | 'tutor' | 'verified_tutor';
    faculty?: string;
    department?: string;
    level?: string;
    admissionId?: string;
    courses?: string[];
    availability?: any[];
    about?: string;
    gender?: string;
    sessionsCompleted: number;
    rating: number;
}
declare const _default: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, mongoose.DefaultSchemaOptions> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IUser>;
export default _default;
//# sourceMappingURL=User.d.ts.map
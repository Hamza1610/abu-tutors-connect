import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
export declare const requestMatch: (req: AuthRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=matchController.d.ts.map
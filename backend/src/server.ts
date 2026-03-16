import dotenv from 'dotenv';
dotenv.config();
import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import logger from './utils/logger';
import authRoutes from './routes/auth';
import matchRoutes from './routes/match';
import userRoutes from './routes/userRoutes';
import sessionRoutes from './routes/sessionRoutes';
import walletRoutes from './routes/walletRoutes';
import notificationRoutes from './routes/notificationRoutes';
import statsRoutes from './routes/statsRoutes';

const app: Express = express();
const PORT: number = parseInt(process.env.PORT as string, 10) || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request Logging using Morgan and Winston
app.use(morgan('combined', {
    stream: { write: (message) => logger.http(message.trim()) }
}));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/users", userRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/stats", statsRoutes);

app.get('/', (req: Request, res: Response) => {
    res.send('ABUTutors Backend API is running');
});

// Database connection
const MONGODB_URI: string = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/abututors";
mongoose.connect(MONGODB_URI)
    .then(() => {
        logger.info("Connected to MongoDB via Mongoose");
        app.listen(PORT, () => logger.info(`Backend server running on port ${PORT}`));
    })
    .catch((err) => logger.error("Could not connect to MongoDB:", err));

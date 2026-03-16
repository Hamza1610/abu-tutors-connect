"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const logger_1 = __importDefault(require("./utils/logger"));
const auth_1 = __importDefault(require("./routes/auth"));
const match_1 = __importDefault(require("./routes/match"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT, 10) || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Request Logging using Morgan and Winston
app.use((0, morgan_1.default)('combined', {
    stream: { write: (message) => logger_1.default.http(message.trim()) }
}));
// Routes
app.use("/api/auth", auth_1.default);
app.use("/api/match", match_1.default);
app.use("/api/users", userRoutes_1.default);
app.get('/', (req, res) => {
    res.send('ABUTutors Backend API is running');
});
// Database connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/abututors";
mongoose_1.default.connect(MONGODB_URI)
    .then(() => {
    logger_1.default.info("Connected to MongoDB via Mongoose");
    app.listen(PORT, () => logger_1.default.info(`Backend server running on port ${PORT}`));
})
    .catch((err) => logger_1.default.error("Could not connect to MongoDB:", err));
//# sourceMappingURL=server.js.map
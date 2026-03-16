"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sessionController_1 = require("../controllers/sessionController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.route('/')
    .post(authMiddleware_1.protect, sessionController_1.createSession)
    .get(authMiddleware_1.protect, sessionController_1.getUserSessions);
router.post('/:id/complete', authMiddleware_1.protect, sessionController_1.completeSession);
exports.default = router;
//# sourceMappingURL=sessionRoutes.js.map
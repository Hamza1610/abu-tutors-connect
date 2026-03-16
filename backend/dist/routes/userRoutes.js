"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.route('/')
    .get(authMiddleware_1.protect, userController_1.getProfile)
    .put(authMiddleware_1.protect, userController_1.updateProfile);
// Public route to view tutor profiles
router.route('/tutors/:id').get(userController_1.getTutorProfile);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map
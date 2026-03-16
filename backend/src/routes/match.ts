import express from 'express';
import { requestMatch } from '../controllers/matchController';

const router = express.Router();

router.post("/request", requestMatch);

export default router;

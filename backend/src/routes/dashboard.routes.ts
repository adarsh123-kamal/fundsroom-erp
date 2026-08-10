import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getDashboardStats } from '../controllers/challan.controller';

const router = Router();

router.get('/stats', authenticate, getDashboardStats);

export default router;

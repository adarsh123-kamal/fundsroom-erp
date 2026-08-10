import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createChallanValidator, updateChallanValidator } from '../validators/challan.validator';
import {
  listChallans,
  getChallan,
  createChallan,
  updateChallan,
  confirmChallan,
  cancelChallan,
} from '../controllers/challan.controller';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), listChallans);
router.get('/:id', authorize('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), getChallan);
router.post('/', authorize('ADMIN', 'SALES'), createChallanValidator, validate, createChallan);
router.put('/:id', authorize('ADMIN', 'SALES'), updateChallanValidator, validate, updateChallan);
router.post('/:id/confirm', authorize('ADMIN', 'SALES', 'WAREHOUSE'), confirmChallan);
router.post('/:id/cancel', authorize('ADMIN', 'SALES'), cancelChallan);

export default router;

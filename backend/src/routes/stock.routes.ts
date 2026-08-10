import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { stockMovementValidator } from '../validators/product.validator';
import {
  listStockMovements,
  createStockMovement,
  getLowStock,
} from '../controllers/product.controller';

const router = Router();

router.use(authenticate);

router.get('/movements', authorize('ADMIN', 'WAREHOUSE', 'ACCOUNTS'), listStockMovements);
router.post(
  '/movements',
  authorize('ADMIN', 'WAREHOUSE'),
  stockMovementValidator,
  validate,
  createStockMovement
);
router.get('/low-stock', authorize('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), getLowStock);

export default router;

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createProductValidator,
  updateProductValidator,
  stockMovementValidator,
} from '../validators/product.validator';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  listStockMovements,
  createStockMovement,
  getLowStock,
} from '../controllers/product.controller';

const router = Router();

router.use(authenticate);

// Products
router.get('/', authorize('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), listProducts);
router.get('/:id', authorize('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), getProduct);
router.post('/', authorize('ADMIN', 'WAREHOUSE'), createProductValidator, validate, createProduct);
router.put('/:id', authorize('ADMIN', 'WAREHOUSE'), updateProductValidator, validate, updateProduct);
router.delete('/:id', authorize('ADMIN'), deleteProduct);

export default router;

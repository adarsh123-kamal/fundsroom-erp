import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createCustomerValidator,
  updateCustomerValidator,
  followUpValidator,
} from '../validators/customer.validator';
import {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  addFollowUp,
  getFollowUps,
} from '../controllers/customer.controller';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'SALES', 'ACCOUNTS'), listCustomers);
router.get('/:id', authorize('ADMIN', 'SALES', 'ACCOUNTS'), getCustomer);
router.post('/', authorize('ADMIN', 'SALES'), createCustomerValidator, validate, createCustomer);
router.put('/:id', authorize('ADMIN', 'SALES'), updateCustomerValidator, validate, updateCustomer);
router.delete('/:id', authorize('ADMIN'), deleteCustomer);

router.post('/:id/followups', authorize('ADMIN', 'SALES'), followUpValidator, validate, addFollowUp);
router.get('/:id/followups', authorize('ADMIN', 'SALES', 'ACCOUNTS'), getFollowUps);

export default router;

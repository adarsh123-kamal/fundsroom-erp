import { body } from 'express-validator';

export const createProductValidator = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('unitPrice')
    .isFloat({ min: 0.01 })
    .withMessage('Unit price must be a positive number'),
  body('currentStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Current stock must be a non-negative integer'),
  body('minimumStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum stock must be a non-negative integer'),
  body('category').optional().trim(),
  body('location').optional().trim(),
];

export const updateProductValidator = [
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('sku').optional().trim().notEmpty().withMessage('SKU cannot be empty'),
  body('unitPrice')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Unit price must be a positive number'),
  body('currentStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Current stock must be a non-negative integer'),
  body('minimumStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum stock must be a non-negative integer'),
];

export const stockMovementValidator = [
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('movementType')
    .isIn(['IN', 'OUT'])
    .withMessage('Movement type must be IN or OUT'),
  body('reason').optional().trim(),
  body('reference').optional().trim(),
];

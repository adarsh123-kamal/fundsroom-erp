import { body } from 'express-validator';

export const createChallanValidator = [
  body('customerId').notEmpty().withMessage('Customer ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').notEmpty().withMessage('Product ID is required for each item'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer for each item'),
  body('notes').optional().trim(),
];

export const updateChallanValidator = [
  body('customerId').optional().notEmpty().withMessage('Customer ID cannot be empty'),
  body('items')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Items must be a non-empty array'),
  body('items.*.productId')
    .optional()
    .notEmpty()
    .withMessage('Product ID is required for each item'),
  body('items.*.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer for each item'),
  body('notes').optional().trim(),
];

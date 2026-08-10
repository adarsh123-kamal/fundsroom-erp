import { body } from 'express-validator';

export const createCustomerValidator = [
  body('name').trim().notEmpty().withMessage('Customer name is required'),
  body('mobile')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Mobile must be a valid 10-digit Indian mobile number'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('customerType')
    .isIn(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR'])
    .withMessage('Customer type must be RETAIL, WHOLESALE, or DISTRIBUTOR'),
  body('status')
    .optional()
    .isIn(['LEAD', 'ACTIVE', 'INACTIVE'])
    .withMessage('Status must be LEAD, ACTIVE, or INACTIVE'),
  body('gstNumber')
    .optional({ checkFalsy: true })
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Invalid GST number format'),
  body('followUpDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Follow-up date must be a valid date'),
];

export const updateCustomerValidator = [
  body('name').optional().trim().notEmpty().withMessage('Customer name cannot be empty'),
  body('mobile')
    .optional()
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Mobile must be a valid 10-digit Indian mobile number'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('customerType')
    .optional()
    .isIn(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR'])
    .withMessage('Customer type must be RETAIL, WHOLESALE, or DISTRIBUTOR'),
  body('status')
    .optional()
    .isIn(['LEAD', 'ACTIVE', 'INACTIVE'])
    .withMessage('Status must be LEAD, ACTIVE, or INACTIVE'),
  body('gstNumber')
    .optional({ checkFalsy: true })
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Invalid GST number format'),
  body('followUpDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Follow-up date must be a valid date'),
];

export const followUpValidator = [
  body('note').trim().notEmpty().withMessage('Follow-up note is required'),
  body('followUpDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Follow-up date must be a valid date'),
];

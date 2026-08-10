import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/env';
import { errorHandler, notFound } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';
import productRoutes from './routes/product.routes';
import stockRoutes from './routes/stock.routes';
import challanRoutes from './routes/challan.routes';
import dashboardRoutes from './routes/dashboard.routes';

const app = express();

// CORS
const normalizeOrigin = (origin: string): string => origin.trim().replace(/\/+$/, '');

const allowedOrigins = [
  config.frontendUrl,
  'https://fundsroom-erp-frontend.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
]
  .filter(Boolean)
  .map(normalizeOrigin);

const isLocalOrigin = (origin: string): boolean =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

const isVercelFrontendOrigin = (origin: string): boolean => {
  try {
    const url = new URL(origin);
    return (
      url.protocol === 'https:' &&
      /^fundsroom-erp-frontend(?:-[a-z0-9-]+)*\.vercel\.app$/.test(url.hostname)
    );
  } catch {
    return false;
  }
};

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalizedOrigin = normalizeOrigin(origin);

    if (
      allowedOrigins.includes(normalizedOrigin) ||
      isLocalOrigin(normalizedOrigin) ||
      isVercelFrontendOrigin(normalizedOrigin)
    ) {
      console.log('✅ CORS allowed:', normalizedOrigin);
      callback(null, true);
      return;
    }

    console.error('❌ CORS blocked origin:', normalizedOrigin);
    callback(new Error('CORS policy does not allow access from the specified Origin.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/challans', challanRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
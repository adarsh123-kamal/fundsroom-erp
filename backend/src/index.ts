import { config } from './config/env';
import app from './app';
import { prisma } from './config/prisma';

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port} [${config.nodeEnv}]`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();

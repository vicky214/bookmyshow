import express from 'express';
import cors from 'cors';
import { GLOBAL_CONSTANTS } from './config/globalConstants.js';
import { getDb } from './db/pool.js';
import { sweeperWorker } from './concurrency/SweeperWorker.js';

import publicRoutes from './routes/publicRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import b2bGatewayRoutes from './routes/b2bGatewayRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/healthz') {
      console.log(`[${GLOBAL_CONSTANTS.INSTANCE_ID}] ${req.method} ${req.originalUrl} -> ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

app.get('/healthz', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'BookMyShow Enterprise API',
    instanceId: GLOBAL_CONSTANTS.INSTANCE_ID,
    environment: GLOBAL_CONSTANTS.ENV,
    timestamp: new Date().toISOString()
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', publicRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/b2b', b2bGatewayRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`[Unhandled Error] ${err.stack || err.message}`);
  res.status(500).json({
    error: 'InternalServerError',
    message: err.message || 'An unexpected server error occurred.'
  });
});

const PORT = GLOBAL_CONSTANTS.PORT;

async function bootstrap() {
  try {

    await getDb();

    sweeperWorker.start();

    const server = app.listen(PORT, () => {
      console.log(`
=================================================================
🎟️  BOOKMYSHOW PLATFORM BACKEND ACTIVE
=================================================================
 Instance ID : ${GLOBAL_CONSTANTS.INSTANCE_ID}
 Environment : ${GLOBAL_CONSTANTS.ENV}
 Port        : ${PORT}
 Endpoints   :
   - Public APIs  : http://localhost:${PORT}/api/v1
   - Admin Panel  : http://localhost:${PORT}/api/v1/admin
   - B2B Gateway  : http://localhost:${PORT}/api/v1/b2b
   - Healthcheck  : http://localhost:${PORT}/healthz
=================================================================
      `);
    });

    const shutdown = () => {
      console.log(`[${GLOBAL_CONSTANTS.INSTANCE_ID}] Graceful shutdown initiated...`);
      sweeperWorker.stop();
      server.close(() => {
        console.log(`[${GLOBAL_CONSTANTS.INSTANCE_ID}] Server successfully terminated.`);
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err: any) {
    console.error(`[Bootstrap Failure] ${err.message}`);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  bootstrap();
}

export default app;

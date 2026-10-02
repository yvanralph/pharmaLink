import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';
import apiRouter from './routes/index.js';
import { errorHandler, notFound } from './middleware/errors.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: config.corsOrigin === '*' ? '*' : config.corsOrigin.split(',').map((o) => o.trim()),
  }));
  app.use(express.json());
  if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.get('/', (req, res) => {
    res.json({
      name: 'PharmaLink API',
      endpoints: [
        'GET /api/health',
        'GET /api/categories',
        'GET /api/medicines',
        'GET /api/medicines/:id',
        'GET /api/medicines/:id/prices',
        'GET /api/pharmacies',
        'GET /api/pharmacies/:id',
        'GET /api/pharmacies/:id/medicines',
      ],
    });
  });

  app.use('/api', apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

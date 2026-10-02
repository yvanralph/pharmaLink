import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';
import apiRouter from './routes/index.js';
import { errorHandler, notFound } from './middleware/errors.js';

// The website (HTML, CSS, JS) lives next to the backend in ../frontend
const FRONTEND_DIR = fileURLToPath(new URL('../../frontend', import.meta.url));

export function createApp() {
  const app = express();

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        // Allow the map tiles from OpenStreetMap on top of helmet's defaults.
        'img-src': ["'self'", 'data:', 'https://tile.openstreetmap.org', 'https://*.tile.openstreetmap.org'],
        // Only relevant when the site is served over HTTPS in production.
        'upgrade-insecure-requests': null,
      },
    },
    // helmet's default is "no-referrer", which hides which website a request comes
    // from. OpenStreetMap refuses map tiles (403 "Access blocked") without that
    // information, so send the site's address - but never the full page URL.
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));
  app.use(cors({
    origin: config.corsOrigin === '*' ? '*' : config.corsOrigin.split(',').map((o) => o.trim()),
  }));
  app.use(express.json({ limit: '20kb' }));
  if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.use('/api', apiRouter);

  // Everything else is the website. http://localhost:3000/ serves frontend/index.html
  app.use(express.static(FRONTEND_DIR));

  // Unknown website addresses get the "page not found" page (API ones get JSON, below).
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    return res.status(404).sendFile('404.html', { root: FRONTEND_DIR }, (err) => {
      if (err) next();
    });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

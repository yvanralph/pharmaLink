import { HttpError } from '../utils/http-error.js';

export function notFound(req, res) {
  res.status(404).json({
    error: { code: 'not_found', message: `No route for ${req.method} ${req.originalUrl}` },
  });
}

// eslint-disable-next-line no-unused-vars -- Express needs all four arguments
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  }

  // Malformed JSON body etc. raised by Express itself
  if (err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: { code: 'bad_request', message: err.message } });
  }

  console.error(err);
  const unavailable = ['ECONNREFUSED', '3D000', '28P01', '28000'].includes(err.code);
  return res.status(unavailable ? 503 : 500).json({
    error: unavailable
      ? { code: 'database_unavailable', message: 'The database is not reachable right now' }
      : { code: 'internal_error', message: 'Something went wrong on our side' },
  });
}

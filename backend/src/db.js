import pg from 'pg';
import { config } from './config.js';

export const pool = new pg.Pool({ connectionString: config.databaseUrl });

pool.on('error', (err) => {
  console.error('Unexpected database error:', err.message);
});

export function query(text, params) {
  return pool.query(text, params);
}

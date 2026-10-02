import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/pharmalink',
  // Comma-separated list of allowed origins, or * for any (fine for local development).
  corsOrigin: process.env.CORS_ORIGIN || '*',
  currency: 'RWF',
  // At or below this quantity a medicine is reported as "low_stock".
  lowStockThreshold: 10,
};

import { Router } from 'express';
import { query } from '../db.js';
import { listCategories } from '../queries/medicines.js';
import contactRouter from './contact.js';
import medicinesRouter from './medicines.js';
import pharmaciesRouter from './pharmacies.js';

const router = Router();

// GET /api - list of endpoints
router.get('/', (req, res) => {
  res.json({
    name: 'PharmaLink API',
    endpoints: [
      'GET /api/health',
      'GET /api/stats',
      'GET /api/categories',
      'GET /api/medicines',
      'GET /api/medicines/:id',
      'GET /api/medicines/:id/prices',
      'GET /api/pharmacies',
      'GET /api/pharmacies/:id',
      'GET /api/pharmacies/:id/medicines',
      'POST /api/contact',
    ],
  });
});

// GET /api/health - is the API up and can it reach the database?
router.get('/health', async (req, res) => {
  await query('SELECT 1');
  res.json({ status: 'ok', database: 'connected', time: new Date().toISOString() });
});

// GET /api/stats - headline numbers about the network
router.get('/stats', async (req, res) => {
  const { rows } = await query(`
    SELECT
      (SELECT COUNT(*)::int FROM pharmacies) AS pharmacies,
      (SELECT COUNT(*)::int FROM pharmacies p
        WHERE pharmacy_is_open(p.is_24h, p.opens_at, p.closes_at)) AS pharmacies_open_now,
      (SELECT COUNT(*)::int FROM medicines) AS medicines,
      (SELECT MAX(last_synced_at) FROM inventory) AS last_synced_at`);
  res.json({ data: rows[0] });
});

// GET /api/categories - medicine categories with how many medicines each has
router.get('/categories', async (req, res) => {
  res.json({ data: await listCategories() });
});

router.use('/medicines', medicinesRouter);
router.use('/pharmacies', pharmaciesRouter);
router.use('/contact', contactRouter);

export default router;

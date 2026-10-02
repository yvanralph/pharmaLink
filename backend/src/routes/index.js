import { Router } from 'express';
import { query } from '../db.js';
import { listCategories } from '../queries/medicines.js';
import medicinesRouter from './medicines.js';
import pharmaciesRouter from './pharmacies.js';

const router = Router();

// GET /api/health - is the API up and can it reach the database?
router.get('/health', async (req, res) => {
  await query('SELECT 1');
  res.json({ status: 'ok', database: 'connected', time: new Date().toISOString() });
});

// GET /api/categories - medicine categories with how many medicines each has
router.get('/categories', async (req, res) => {
  res.json({ data: await listCategories() });
});

router.use('/medicines', medicinesRouter);
router.use('/pharmacies', pharmaciesRouter);

export default router;

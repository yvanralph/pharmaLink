import { Router } from 'express';
import { config } from '../config.js';
import * as medicines from '../queries/medicines.js';
import { HttpError } from '../utils/http-error.js';
import { availability, toMedicineWithPrices, toPharmacy } from '../utils/format.js';
import {
  paginationMeta, parseBoolean, parseChoice, parseId, parseLocation,
  parseNumber, parsePagination, parseText,
} from '../utils/validate.js';

const router = Router();

// GET /api/medicines
// Browse and search the medicine catalogue.
//   q             search in name, generic name and brand name
//   category      only this category (see GET /api/categories)
//   prescription  true = prescription-only, false = over the counter
//   in_stock      true = only medicines at least one pharmacy has in stock
//   sort          name (default) | price      order  asc (default) | desc
//   page, limit   pagination (limit max 100)
router.get('/', async (req, res) => {
  const pagination = parsePagination(req.query);
  const { rows, total } = await medicines.listMedicines({
    q: parseText(req.query.q, 'q'),
    category: parseText(req.query.category, 'category'),
    prescription: parseBoolean(req.query.prescription, 'prescription'),
    inStock: parseBoolean(req.query.in_stock, 'in_stock', false),
    sort: parseChoice(req.query.sort, 'sort', ['name', 'price'], 'name'),
    order: parseChoice(req.query.order, 'order', ['asc', 'desc'], 'asc'),
    limit: pagination.limit,
    offset: pagination.offset,
  });

  res.json({
    data: rows.map(toMedicineWithPrices),
    pagination: paginationMeta(pagination, total),
  });
});

// GET /api/medicines/:id
router.get('/:id', async (req, res) => {
  const medicine = await medicines.getMedicine(parseId(req.params.id));
  if (!medicine) throw new HttpError(404, 'medicine_not_found', 'Medicine not found');
  res.json({ data: toMedicineWithPrices(medicine) });
});

// GET /api/medicines/:id/prices
// Compare the price of one medicine across pharmacies.
//   lat, lng    the user's location - adds distance_km to every offer
//   radius_km   only pharmacies within this distance (needs lat/lng)
//   in_stock    true (default) = hide pharmacies that are out of stock
//   sort        price (default) | distance (needs lat/lng)
router.get('/:id/prices', async (req, res) => {
  const id = parseId(req.params.id);
  const location = parseLocation(req.query);
  const radiusKm = parseNumber(req.query.radius_km, 'radius_km', { min: 0.1, max: 500 });
  const sort = parseChoice(req.query.sort, 'sort', ['price', 'distance'], 'price');
  const inStock = parseBoolean(req.query.in_stock, 'in_stock', true);

  if (!location && (radiusKm !== null || sort === 'distance')) {
    throw new HttpError(400, 'location_required', 'lat and lng are required to use radius_km or sort=distance');
  }

  const medicine = await medicines.getMedicine(id);
  if (!medicine) throw new HttpError(404, 'medicine_not_found', 'Medicine not found');

  const rows = await medicines.getMedicinePrices(id, { location, radiusKm, inStock, sort });

  const prices = rows.filter((row) => row.quantity > 0).map((row) => row.price);
  const lowest = prices.length ? Math.min(...prices) : null;
  const highest = prices.length ? Math.max(...prices) : null;

  res.json({
    medicine: toMedicineWithPrices(medicine),
    // Summary of the in-stock offers in this response (after the radius filter).
    summary: {
      pharmacy_count: prices.length,
      lowest_price: lowest,
      highest_price: highest,
      average_price: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null,
      max_saving: prices.length ? highest - lowest : null,
      currency: config.currency,
    },
    data: rows.map((row) => ({
      price: row.price,
      currency: config.currency,
      availability: availability(row.quantity),
      is_lowest_price: row.quantity > 0 && row.price === lowest,
      last_synced_at: row.last_synced_at,
      pharmacy: toPharmacy(row),
    })),
  });
});

export default router;

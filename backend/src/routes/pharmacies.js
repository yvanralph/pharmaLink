import { Router } from 'express';
import { config } from '../config.js';
import * as pharmacies from '../queries/pharmacies.js';
import { HttpError } from '../utils/http-error.js';
import { availability, toMedicine, toPharmacy } from '../utils/format.js';
import {
  paginationMeta, parseBoolean, parseId, parseLocation,
  parseNumber, parsePagination, parseText,
} from '../utils/validate.js';

const router = Router();

const toPharmacyWithStock = (row) => ({
  ...toPharmacy(row),
  medicines_in_stock: row.medicines_in_stock,
});

// GET /api/pharmacies
// List pharmacies. With lat/lng they are sorted nearest first.
//   lat, lng     the user's location - adds distance_km and sorts by it
//   radius_km    only pharmacies within this distance (needs lat/lng)
//   open_now     true = only pharmacies open right now (Kigali time)
//   medicine_id  only pharmacies that have this medicine in stock
//   q            search in name, address, sector and district
//   page, limit  pagination (limit max 100)
router.get('/', async (req, res) => {
  const pagination = parsePagination(req.query);
  const location = parseLocation(req.query);
  const radiusKm = parseNumber(req.query.radius_km, 'radius_km', { min: 0.1, max: 500 });
  if (radiusKm !== null && !location) {
    throw new HttpError(400, 'location_required', 'lat and lng are required to use radius_km');
  }
  const medicineId = req.query.medicine_id === undefined || req.query.medicine_id === ''
    ? null
    : parseId(req.query.medicine_id, 'medicine_id');

  const { rows, total } = await pharmacies.listPharmacies({
    q: parseText(req.query.q, 'q'),
    location,
    radiusKm,
    openNow: parseBoolean(req.query.open_now, 'open_now', false),
    medicineId,
    limit: pagination.limit,
    offset: pagination.offset,
  });

  res.json({
    data: rows.map(toPharmacyWithStock),
    pagination: paginationMeta(pagination, total),
  });
});

// GET /api/pharmacies/:id          (optional lat, lng for distance_km)
router.get('/:id', async (req, res) => {
  const pharmacy = await pharmacies.getPharmacy(parseId(req.params.id), parseLocation(req.query));
  if (!pharmacy) throw new HttpError(404, 'pharmacy_not_found', 'Pharmacy not found');
  res.json({ data: toPharmacyWithStock(pharmacy) });
});

// GET /api/pharmacies/:id/medicines
// The medicines one pharmacy lists, with its prices.
//   q, category   filter the list
//   in_stock      true = hide medicines that are out of stock (default false)
//   page, limit   pagination
router.get('/:id/medicines', async (req, res) => {
  const id = parseId(req.params.id);
  const pagination = parsePagination(req.query);

  const pharmacy = await pharmacies.getPharmacy(id, null);
  if (!pharmacy) throw new HttpError(404, 'pharmacy_not_found', 'Pharmacy not found');

  const { rows, total } = await pharmacies.listPharmacyMedicines(id, {
    q: parseText(req.query.q, 'q'),
    category: parseText(req.query.category, 'category'),
    inStock: parseBoolean(req.query.in_stock, 'in_stock', false),
    limit: pagination.limit,
    offset: pagination.offset,
  });

  res.json({
    pharmacy: toPharmacyWithStock(pharmacy),
    data: rows.map((row) => ({
      ...toMedicine(row),
      price: row.price,
      currency: config.currency,
      availability: availability(row.quantity),
      last_synced_at: row.last_synced_at,
    })),
    pagination: paginationMeta(pagination, total),
  });
});

export default router;

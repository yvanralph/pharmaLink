import { query } from '../db.js';
import { escapeLike } from '../utils/validate.js';

// Columns returned for a pharmacy (table alias must be "p").
export const PHARMACY_FIELDS = `
  p.id, p.name, p.address, p.sector, p.district, p.phone, p.latitude, p.longitude,
  to_char(p.opens_at, 'HH24:MI') AS opens_at, to_char(p.closes_at, 'HH24:MI') AS closes_at,
  p.is_24h, pharmacy_is_open(p.is_24h, p.opens_at, p.closes_at) AS is_open_now`;

// SQL for "distance from the user to pharmacy p", rounded to 10 metres.
// `add` registers a query parameter and returns its placeholder ($1, $2 ...).
export function distanceExpression(location, add) {
  if (!location) return 'NULL::float8';
  return `round(distance_km(${add(location.lat)}::float8, ${add(location.lng)}::float8, p.latitude, p.longitude)::numeric, 2)::float8`;
}

export async function listPharmacies({ q, location, radiusKm, openNow, medicineId, limit, offset }) {
  const params = [];
  const add = (value) => `$${params.push(value)}`;

  const distance = distanceExpression(location, add);
  const innerWhere = [];
  if (q) {
    const pattern = add(`%${escapeLike(q)}%`);
    innerWhere.push(`(p.name ILIKE ${pattern} OR p.address ILIKE ${pattern} OR p.sector ILIKE ${pattern} OR p.district ILIKE ${pattern})`);
  }
  if (medicineId !== null) {
    innerWhere.push(`EXISTS (
      SELECT 1 FROM inventory i
      WHERE i.pharmacy_id = p.id AND i.medicine_id = ${add(medicineId)} AND i.quantity > 0)`);
  }

  const outerWhere = [];
  if (radiusKm !== null) outerWhere.push(`distance_km <= ${add(radiusKm)}::float8`);
  if (openNow) outerWhere.push('is_open_now IS TRUE');

  const from = `
    FROM (
      SELECT ${PHARMACY_FIELDS}, ${distance} AS distance_km,
             (SELECT COUNT(*)::int FROM inventory i
               WHERE i.pharmacy_id = p.id AND i.quantity > 0) AS medicines_in_stock
      FROM pharmacies p
      ${innerWhere.length ? `WHERE ${innerWhere.join(' AND ')}` : ''}
    ) nearby
    ${outerWhere.length ? `WHERE ${outerWhere.join(' AND ')}` : ''}`;

  const count = await query(`SELECT COUNT(*)::int AS total ${from}`, params);

  const listParams = [...params, limit, offset];
  const list = await query(
    `SELECT * ${from}
     ORDER BY distance_km ASC NULLS LAST, name ASC
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams,
  );

  return { rows: list.rows, total: count.rows[0].total };
}

export async function getPharmacy(id, location) {
  const params = [];
  const add = (value) => `$${params.push(value)}`;
  const distance = distanceExpression(location, add);

  const { rows } = await query(
    `SELECT ${PHARMACY_FIELDS}, ${distance} AS distance_km,
            (SELECT COUNT(*)::int FROM inventory i
              WHERE i.pharmacy_id = p.id AND i.quantity > 0) AS medicines_in_stock
     FROM pharmacies p
     WHERE p.id = ${add(id)}`,
    params,
  );
  return rows[0] ?? null;
}

// The medicines one pharmacy lists, with that pharmacy's price.
export async function listPharmacyMedicines(pharmacyId, { q, category, inStock, limit, offset }) {
  const params = [pharmacyId];
  const add = (value) => `$${params.push(value)}`;
  const where = ['i.pharmacy_id = $1'];

  if (q) {
    const pattern = add(`%${escapeLike(q)}%`);
    where.push(`(m.name ILIKE ${pattern} OR m.generic_name ILIKE ${pattern} OR m.brand_name ILIKE ${pattern})`);
  }
  if (category) where.push(`lower(m.category) = lower(${add(category)})`);
  if (inStock) where.push('i.quantity > 0');

  const from = `
    FROM inventory i
    JOIN medicines m ON m.id = i.medicine_id
    WHERE ${where.join(' AND ')}`;

  const count = await query(`SELECT COUNT(*)::int AS total ${from}`, params);

  const listParams = [...params, limit, offset];
  const list = await query(
    `SELECT m.id, m.name, m.generic_name, m.brand_name, m.category, m.dosage_form,
            m.strength, m.pack_size, m.requires_prescription, m.description,
            i.price, i.quantity, i.last_synced_at
     ${from}
     ORDER BY m.name ASC
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams,
  );

  return { rows: list.rows, total: count.rows[0].total };
}

import { query } from '../db.js';
import { escapeLike } from '../utils/validate.js';
import { PHARMACY_FIELDS, distanceExpression } from './pharmacies.js';

const MEDICINE_FIELDS = `
  m.id, m.name, m.generic_name, m.brand_name, m.category, m.dosage_form,
  m.strength, m.pack_size, m.requires_prescription, m.description`;

// Lowest/highest price and number of pharmacies that currently have the medicine in stock.
const PRICE_SUMMARY_JOIN = `
  LEFT JOIN LATERAL (
    SELECT MIN(i.price) AS min_price, MAX(i.price) AS max_price, COUNT(*)::int AS pharmacy_count
    FROM inventory i
    WHERE i.medicine_id = m.id AND i.quantity > 0
  ) s ON TRUE`;

export async function listMedicines({ q, category, prescription, inStock, sort, order, limit, offset }) {
  const params = [];
  const add = (value) => `$${params.push(value)}`;
  const where = [];

  if (q) {
    const pattern = add(`%${escapeLike(q)}%`);
    where.push(`(m.name ILIKE ${pattern} OR m.generic_name ILIKE ${pattern} OR m.brand_name ILIKE ${pattern})`);
  }
  if (category) where.push(`lower(m.category) = lower(${add(category)})`);
  if (prescription !== null) where.push(`m.requires_prescription = ${add(prescription)}`);
  if (inStock) where.push('s.pharmacy_count > 0');

  const from = `
    FROM medicines m
    ${PRICE_SUMMARY_JOIN}
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`;

  const count = await query(`SELECT COUNT(*)::int AS total ${from}`, params);

  // Sorting. `sort` and `order` are validated against a fixed list in the route,
  // so it is safe to place them in the SQL text.
  const direction = order === 'desc' ? 'DESC' : 'ASC';
  const listParams = [...params];
  const addList = (value) => `$${listParams.push(value)}`;
  let orderBy;
  if (sort === 'price') {
    orderBy = `s.min_price ${direction} NULLS LAST, m.name ASC`;
  } else if (q) {
    // When searching, names that start with the search text come first.
    orderBy = `(m.name ILIKE ${addList(`${escapeLike(q)}%`)}) DESC, m.name ${direction}`;
  } else {
    orderBy = `m.name ${direction}`;
  }

  const list = await query(
    `SELECT ${MEDICINE_FIELDS}, s.min_price, s.max_price, s.pharmacy_count
     ${from}
     ORDER BY ${orderBy}
     LIMIT ${addList(limit)} OFFSET ${addList(offset)}`,
    listParams,
  );

  return { rows: list.rows, total: count.rows[0].total };
}

export async function getMedicine(id) {
  const { rows } = await query(
    `SELECT ${MEDICINE_FIELDS}, s.min_price, s.max_price, s.pharmacy_count
     FROM medicines m
     ${PRICE_SUMMARY_JOIN}
     WHERE m.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

// Every pharmacy that lists the medicine, with its price - the price comparison.
export async function getMedicinePrices(medicineId, { location, radiusKm, inStock, sort }) {
  const params = [medicineId];
  const add = (value) => `$${params.push(value)}`;

  const distance = distanceExpression(location, add);
  const where = [];
  if (inStock) where.push('quantity > 0');
  if (radiusKm !== null) where.push(`distance_km <= ${add(radiusKm)}::float8`);

  // In-stock offers always come before out-of-stock ones.
  const orderBy = sort === 'distance'
    ? '(quantity > 0) DESC, distance_km ASC NULLS LAST, price ASC, name ASC'
    : '(quantity > 0) DESC, price ASC, distance_km ASC NULLS LAST, name ASC';

  const { rows } = await query(
    `SELECT * FROM (
       SELECT ${PHARMACY_FIELDS}, ${distance} AS distance_km,
              i.price, i.quantity, i.last_synced_at
       FROM inventory i
       JOIN pharmacies p ON p.id = i.pharmacy_id
       WHERE i.medicine_id = $1
     ) offers
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY ${orderBy}`,
    params,
  );
  return rows;
}

export async function listCategories() {
  const { rows } = await query(
    `SELECT category AS name, COUNT(*)::int AS medicine_count
     FROM medicines
     GROUP BY category
     ORDER BY category`,
  );
  return rows;
}

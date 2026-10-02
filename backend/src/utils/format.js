// Turn database rows into the JSON shapes the API returns.

import { config } from '../config.js';

export function availability(quantity) {
  if (quantity <= 0) return 'out_of_stock';
  if (quantity <= config.lowStockThreshold) return 'low_stock';
  return 'in_stock';
}

export function toPharmacy(row) {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    sector: row.sector,
    district: row.district,
    phone: row.phone,
    latitude: row.latitude,
    longitude: row.longitude,
    opens_at: row.opens_at,
    closes_at: row.closes_at,
    is_24h: row.is_24h,
    is_open_now: row.is_open_now,
    // null unless the request included the user's lat/lng
    distance_km: row.distance_km ?? null,
  };
}

export function toMedicine(row) {
  return {
    id: row.id,
    name: row.name,
    generic_name: row.generic_name,
    brand_name: row.brand_name,
    category: row.category,
    dosage_form: row.dosage_form,
    strength: row.strength,
    pack_size: row.pack_size,
    requires_prescription: row.requires_prescription,
    description: row.description,
  };
}

// A medicine plus a summary of what it costs across pharmacies that have it in stock.
export function toMedicineWithPrices(row) {
  return {
    ...toMedicine(row),
    lowest_price: row.min_price,
    highest_price: row.max_price,
    pharmacy_count: row.pharmacy_count,
    currency: config.currency,
  };
}

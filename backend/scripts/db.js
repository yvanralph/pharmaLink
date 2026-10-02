// Database management script.
//
//   node scripts/db.js setup   -> create the database if missing, then schema + seed
//   node scripts/db.js schema  -> (re)create the tables  (DROPS existing data)
//   node scripts/db.js seed    -> wipe the tables and load the test data

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { config } from '../src/config.js';
import { pharmacies, medicines } from '../db/seed-data.js';

const SCHEMA_FILE = fileURLToPath(new URL('../db/schema.sql', import.meta.url));

// Create the database named in DATABASE_URL if it does not exist yet.
async function ensureDatabase() {
  const url = new URL(config.databaseUrl);
  const dbName = decodeURIComponent(url.pathname.slice(1));

  const probe = new pg.Client({ connectionString: config.databaseUrl });
  try {
    await probe.connect();
    await probe.end();
    return;
  } catch (err) {
    await probe.end().catch(() => {});
    if (err.code !== '3D000') throw err; // 3D000 = database does not exist
  }

  url.pathname = '/postgres';
  const admin = new pg.Client({ connectionString: url.toString() });
  await admin.connect();
  await admin.query(`CREATE DATABASE "${dbName.replaceAll('"', '""')}"`);
  await admin.end();
  console.log(`Created database "${dbName}"`);
}

async function applySchema(client) {
  await client.query(await readFile(SCHEMA_FILE, 'utf8'));
  console.log('Schema applied');
}

// Small seeded random generator so the test data is identical on every run.
function createRandom(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function seed(client) {
  const random = createRandom(2026);
  const between = (min, max) => min + random() * (max - min);

  await client.query('BEGIN');
  try {
    await client.query('TRUNCATE inventory, medicines, pharmacies RESTART IDENTITY CASCADE');

    const pharmacyIds = [];
    for (const p of pharmacies) {
      const { rows } = await client.query(
        `INSERT INTO pharmacies
           (name, address, sector, district, phone, latitude, longitude, opens_at, closes_at, is_24h, source_system)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [p.name, p.address, p.sector, p.district, p.phone, p.latitude, p.longitude,
          p.opens_at, p.closes_at, p.is_24h, p.source_system],
      );
      pharmacyIds.push(rows[0].id);
    }

    const medicineRows = [];
    for (const m of medicines) {
      const { rows } = await client.query(
        `INSERT INTO medicines
           (name, generic_name, brand_name, category, dosage_form, strength, pack_size, requires_prescription, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [m.name, m.generic_name, m.brand_name, m.category, m.dosage_form, m.strength,
          m.pack_size, m.rx, m.description],
      );
      medicineRows.push({ id: rows[0].id, basePrice: m.base_price });
    }

    // Each pharmacy stocks roughly three quarters of the catalogue, with its
    // own price level, so there is something to compare.
    let inventoryCount = 0;
    for (const pharmacyId of pharmacyIds) {
      const priceLevel = between(0.9, 1.2);
      for (const medicine of medicineRows) {
        if (random() > 0.75) continue;
        const price = Math.max(100, Math.round((medicine.basePrice * priceLevel * between(0.9, 1.1)) / 50) * 50);
        const quantity = random() < 0.12 ? 0 : Math.round(between(3, 120));
        const hoursAgo = Math.round(between(0, 48));
        await client.query(
          `INSERT INTO inventory (pharmacy_id, medicine_id, price, quantity, external_sku, last_synced_at)
           VALUES ($1, $2, $3, $4, $5, now() - make_interval(hours => $6))`,
          [pharmacyId, medicine.id, price, quantity,
            `PH${pharmacyId}-${String(medicine.id).padStart(4, '0')}`, hoursAgo],
        );
        inventoryCount += 1;
      }
    }

    await client.query('COMMIT');
    console.log(`Seeded ${pharmacyIds.length} pharmacies, ${medicineRows.length} medicines, ${inventoryCount} inventory rows`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

async function main() {
  const command = process.argv[2];
  if (!['setup', 'schema', 'seed'].includes(command)) {
    console.error('Usage: node scripts/db.js <setup|schema|seed>');
    process.exit(1);
  }

  if (command === 'setup') await ensureDatabase();

  const client = new pg.Client({ connectionString: config.databaseUrl });
  await client.connect();
  try {
    if (command === 'setup' || command === 'schema') await applySchema(client);
    if (command === 'setup' || command === 'seed') await seed(client);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Database script failed:', err.message || err.code || err);
  if (err.code === 'ECONNREFUSED') {
    console.error('Is PostgreSQL running, and is DATABASE_URL in .env correct?');
  }
  process.exit(1);
});

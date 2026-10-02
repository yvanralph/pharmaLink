// End-to-end tests for the API.
// They need a database loaded with the seed data: run `npm run db:setup` first.

process.env.NODE_ENV = 'test';

import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';

const { createApp } = await import('../src/app.js');
const { pool } = await import('../src/db.js');

// Kigali Convention Centre - used as "the user's location"
const HERE = 'lat=-1.9536&lng=30.0927';

let server;
let baseUrl;

async function get(path) {
  const response = await fetch(baseUrl + path);
  return { status: response.status, body: await response.json() };
}

before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://localhost:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

describe('general', () => {
  test('health check reports the database is connected', async () => {
    const { status, body } = await get('/api/health');
    assert.equal(status, 200);
    assert.equal(body.database, 'connected');
  });

  test('unknown routes return a JSON 404', async () => {
    const { status, body } = await get('/api/nope');
    assert.equal(status, 404);
    assert.equal(body.error.code, 'not_found');
  });

  test('categories are listed with counts', async () => {
    const { body } = await get('/api/categories');
    const antibiotics = body.data.find((c) => c.name === 'Antibiotics');
    assert.equal(antibiotics.medicine_count, 7);
  });
});

describe('website', () => {
  test('the homepage is served at /', async () => {
    const response = await fetch(`${baseUrl}/`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.match(await response.text(), /PharmaLink/);
  });

  test('pages allow the Referer header that OpenStreetMap map tiles need', async () => {
    const response = await fetch(`${baseUrl}/pharmacies.html`);
    assert.equal(response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    assert.match(response.headers.get('content-security-policy'), /img-src[^;]*https:\/\/tile\.openstreetmap\.org/);
  });

  test('unknown pages get the HTML not-found page', async () => {
    const response = await fetch(`${baseUrl}/no-such-page`);
    assert.equal(response.status, 404);
    assert.match(response.headers.get('content-type'), /text\/html/);
  });

  test('stats report the size of the network', async () => {
    const { status, body } = await get('/api/stats');
    assert.equal(status, 200);
    assert.equal(body.data.pharmacies, 12);
    assert.equal(body.data.medicines, 38);
    assert.ok(body.data.pharmacies_open_now >= 2);
    assert.ok(!Number.isNaN(Date.parse(body.data.last_synced_at)));
  });
});

describe('contact form', () => {
  const message = { name: 'Test Person', contact: '+250 788 000 000', topic: 'other', message: 'Automated test message' };

  async function send(body) {
    const response = await fetch(`${baseUrl}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  }

  after(async () => {
    await pool.query("DELETE FROM contact_messages WHERE message = 'Automated test message'");
  });

  test('a valid message is saved', async () => {
    const { status, body } = await send(message);
    assert.equal(status, 201);
    assert.ok(body.data.id > 0);
    const saved = await pool.query('SELECT name, topic FROM contact_messages WHERE id = $1', [body.data.id]);
    assert.deepEqual(saved.rows[0], { name: 'Test Person', topic: 'other' });
  });

  test('missing or invalid fields are rejected', async () => {
    for (const bad of [{ ...message, name: '' }, { ...message, contact: 'x' }, { ...message, topic: 'spam' }, { ...message, message: 'hi' }, {}]) {
      const { status, body } = await send(bad);
      assert.equal(status, 400);
      assert.equal(body.error.code, 'invalid_field');
    }
  });

  test('too many messages in a short time are refused', async () => {
    let last;
    for (let i = 0; i < 6; i += 1) last = await send(message);
    assert.equal(last.status, 429);
  });
});

describe('medicines', () => {
  test('browse returns a paginated list sorted by name', async () => {
    const { status, body } = await get('/api/medicines?limit=5');
    assert.equal(status, 200);
    assert.equal(body.data.length, 5);
    assert.equal(body.pagination.total, 38);
    assert.equal(body.pagination.total_pages, 8);
    const names = body.data.map((m) => m.name);
    assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b)));
  });

  test('page 2 continues where page 1 stopped', async () => {
    const all = await get('/api/medicines?limit=10');
    const second = await get('/api/medicines?limit=5&page=2');
    assert.deepEqual(second.body.data.map((m) => m.id), all.body.data.slice(5).map((m) => m.id));
  });

  test('search matches name, generic name and brand name, ignoring case', async () => {
    const byName = await get('/api/medicines?q=paracet');
    assert.equal(byName.body.data[0].name, 'Paracetamol 500mg Tablets');

    const byBrand = await get('/api/medicines?q=PANADOL');
    assert.equal(byBrand.body.data[0].name, 'Paracetamol 500mg Tablets');

    const byGeneric = await get('/api/medicines?q=ascorbic');
    assert.equal(byGeneric.body.data[0].name, 'Vitamin C 500mg Tablets');
  });

  test('search puts names starting with the search text first', async () => {
    const { body } = await get('/api/medicines?q=amox');
    assert.equal(body.data.length, 2);
    assert.ok(body.data.every((m) => m.name.startsWith('Amoxicillin')));
  });

  test('search treats % and _ as plain text', async () => {
    const { body } = await get('/api/medicines?q=%25');
    assert.ok(body.data.every((m) => m.name.includes('%')));
    assert.ok(body.data.length < 38);
  });

  test('filters by category and prescription', async () => {
    const { body } = await get('/api/medicines?category=antibiotics');
    assert.equal(body.data.length, 7);
    assert.ok(body.data.every((m) => m.category === 'Antibiotics' && m.requires_prescription));

    const otc = await get('/api/medicines?prescription=false&limit=100');
    assert.ok(otc.body.data.length > 0);
    assert.ok(otc.body.data.every((m) => m.requires_prescription === false));
  });

  test('sort by price orders by lowest price', async () => {
    const { body } = await get('/api/medicines?sort=price&order=desc&limit=100');
    const prices = body.data.map((m) => m.lowest_price).filter((p) => p !== null);
    assert.deepEqual(prices, [...prices].sort((a, b) => b - a));
  });

  test('a medicine includes its price range', async () => {
    const { body } = await get('/api/medicines/1');
    assert.equal(body.data.id, 1);
    assert.ok(body.data.lowest_price <= body.data.highest_price);
    assert.ok(body.data.pharmacy_count > 0);
    assert.equal(body.data.currency, 'RWF');
  });

  test('missing and invalid ids', async () => {
    assert.equal((await get('/api/medicines/99999')).status, 404);
    assert.equal((await get('/api/medicines/abc')).status, 400);
  });

  test('invalid query values are rejected with 400', async () => {
    for (const path of ['/api/medicines?limit=1000', '/api/medicines?page=0', '/api/medicines?sort=colour', '/api/medicines?prescription=maybe']) {
      const { status, body } = await get(path);
      assert.equal(status, 400, path);
      assert.equal(body.error.code, 'invalid_parameter');
    }
  });
});

describe('price comparison', () => {
  test('offers are sorted cheapest first and summarised', async () => {
    const { status, body } = await get('/api/medicines/1/prices');
    assert.equal(status, 200);
    const prices = body.data.map((offer) => offer.price);
    assert.ok(prices.length > 1);
    assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
    assert.equal(body.summary.lowest_price, prices[0]);
    assert.equal(body.summary.highest_price, prices.at(-1));
    assert.equal(body.summary.max_saving, prices.at(-1) - prices[0]);
    assert.equal(body.summary.pharmacy_count, prices.length);
    assert.equal(body.data[0].is_lowest_price, true);
    assert.ok(body.data.every((offer) => offer.availability !== 'out_of_stock'));
    assert.equal(body.data[0].pharmacy.distance_km, null);
  });

  test('in_stock=false also shows out-of-stock pharmacies, listed last', async () => {
    const inStock = await get('/api/medicines/1/prices');
    const all = await get('/api/medicines/1/prices?in_stock=false');
    assert.ok(all.body.data.length >= inStock.body.data.length);
    const firstOut = all.body.data.findIndex((o) => o.availability === 'out_of_stock');
    if (firstOut !== -1) {
      assert.ok(all.body.data.slice(firstOut).every((o) => o.availability === 'out_of_stock'));
    }
    // The summary only counts pharmacies that actually have it
    assert.equal(all.body.summary.pharmacy_count, inStock.body.summary.pharmacy_count);
  });

  test('with a location, offers carry a distance and can be sorted by it', async () => {
    const { body } = await get(`/api/medicines/1/prices?${HERE}&sort=distance`);
    const distances = body.data.map((offer) => offer.pharmacy.distance_km);
    assert.ok(distances.every((d) => typeof d === 'number'));
    assert.deepEqual(distances, [...distances].sort((a, b) => a - b));
  });

  test('radius_km limits the offers', async () => {
    const { body } = await get(`/api/medicines/1/prices?${HERE}&radius_km=3`);
    assert.ok(body.data.every((offer) => offer.pharmacy.distance_km <= 3));
  });

  test('sort=distance without a location is rejected', async () => {
    const { status, body } = await get('/api/medicines/1/prices?sort=distance');
    assert.equal(status, 400);
    assert.equal(body.error.code, 'location_required');
  });
});

describe('pharmacies', () => {
  test('without a location, pharmacies are listed by name', async () => {
    const { status, body } = await get('/api/pharmacies');
    assert.equal(status, 200);
    assert.equal(body.pagination.total, 12);
    const names = body.data.map((p) => p.name);
    assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b)));
    assert.equal(body.data[0].distance_km, null);
  });

  test('with a location, the nearest pharmacy comes first', async () => {
    const { body } = await get(`/api/pharmacies?${HERE}`);
    const distances = body.data.map((p) => p.distance_km);
    assert.deepEqual(distances, [...distances].sort((a, b) => a - b));
    // Agaciro Pharmacy (Kimihurura) is the closest to the Convention Centre: ~0.86 km
    assert.equal(body.data[0].name, 'Agaciro Pharmacy');
    assert.ok(Math.abs(body.data[0].distance_km - 0.86) < 0.05);
  });

  test('radius_km only returns pharmacies inside the radius', async () => {
    const { body } = await get(`/api/pharmacies?${HERE}&radius_km=3`);
    assert.ok(body.data.length > 0 && body.data.length < 12);
    assert.ok(body.data.every((p) => p.distance_km <= 3));
    assert.equal(body.pagination.total, body.data.length);
  });

  test('radius_km and lat/lng are validated', async () => {
    assert.equal((await get('/api/pharmacies?radius_km=3')).body.error.code, 'location_required');
    assert.equal((await get('/api/pharmacies?lat=-1.95')).status, 400);
    assert.equal((await get('/api/pharmacies?lat=95&lng=30')).status, 400);
    assert.equal((await get('/api/pharmacies?lat=abc&lng=30')).status, 400);
  });

  test('open_now only returns pharmacies that are open', async () => {
    const { body } = await get('/api/pharmacies?open_now=true');
    assert.ok(body.data.length >= 2); // the two 24-hour pharmacies are always open
    assert.ok(body.data.every((p) => p.is_open_now === true));
  });

  test('medicine_id only returns pharmacies that have it in stock', async () => {
    const prices = await get('/api/medicines/1/prices');
    const { body } = await get(`/api/pharmacies?medicine_id=1&${HERE}`);
    assert.deepEqual(
      body.data.map((p) => p.id).sort((a, b) => a - b),
      prices.body.data.map((o) => o.pharmacy.id).sort((a, b) => a - b),
    );
  });

  test('search by area', async () => {
    const { body } = await get('/api/pharmacies?q=kicukiro');
    assert.equal(body.data.length, 3);
  });

  test('a single pharmacy, with distance when a location is sent', async () => {
    const plain = await get('/api/pharmacies/1');
    assert.equal(plain.body.data.name, 'Umurava Pharmacy');
    assert.equal(plain.body.data.is_24h, true);
    assert.equal(plain.body.data.is_open_now, true);

    const located = await get(`/api/pharmacies/2?${HERE}`);
    assert.equal(located.body.data.opens_at, '07:30');
    assert.ok(located.body.data.distance_km > 0);

    assert.equal((await get('/api/pharmacies/99999')).status, 404);
  });

  test("a pharmacy's medicines come with its prices", async () => {
    const { status, body } = await get('/api/pharmacies/1/medicines?limit=100');
    assert.equal(status, 200);
    assert.equal(body.pharmacy.id, 1);
    assert.equal(body.data.length, body.pagination.total);
    assert.ok(body.data.every((m) => m.price > 0 && m.currency === 'RWF'));

    const filtered = await get('/api/pharmacies/1/medicines?in_stock=true&category=Antibiotics');
    assert.ok(filtered.body.data.every((m) => m.category === 'Antibiotics' && m.availability !== 'out_of_stock'));

    assert.equal((await get('/api/pharmacies/99999/medicines')).status, 404);
  });
});

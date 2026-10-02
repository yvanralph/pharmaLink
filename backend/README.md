# PharmaLink backend

REST API for PharmaLink, built with Node.js, Express and PostgreSQL. It also serves the website in `../frontend`, so one command runs the whole app. It covers the three MVP features:

1. **Work with existing pharmacy systems** – stock and prices live in an `inventory` table that records which system each pharmacy's data came from (`source_system`), the item's ID in that system (`external_sku`) and when it was last received (`last_synced_at`). For now it is filled with seeded test data.
2. **Browse, search and compare prices** – `/api/medicines` and `/api/medicines/:id/prices`.
3. **Find nearby pharmacies** – `/api/pharmacies?lat=..&lng=..`, sorted by distance from the user.

## Getting started

You need Node.js 18.11 or newer and a running PostgreSQL server.

```bash
cd backend
npm install
cp .env.example .env      # then put your own PostgreSQL user/password in DATABASE_URL
npm run db:setup          # creates the database, the tables and the test data
npm run dev               # starts the API on http://localhost:3000 and restarts on file changes
```

Open <http://localhost:3000> for the website, or <http://localhost:3000/api/medicines?q=para> to check the API on its own.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the API and restart when a file changes |
| `npm start` | Start the API (production) |
| `npm run db:setup` | Create the database if missing, then the tables and test data |
| `npm run db:schema` | Recreate the tables (**deletes existing data**) |
| `npm run db:seed` | Empty the tables and reload the test data |
| `npm test` | Run the API tests (needs the seeded database) |

## Project layout

```
backend/
├── db/
│   ├── schema.sql        tables, indexes and two SQL helper functions
│   └── seed-data.js      test pharmacies (Kigali) and medicines
├── scripts/db.js         setup / schema / seed commands
├── src/
│   ├── server.js         starts the HTTP server
│   ├── app.js            Express app: middleware and routes
│   ├── config.js         settings read from .env
│   ├── db.js             PostgreSQL connection pool
│   ├── routes/           URL handlers: read the request, send the response
│   │                     (index, medicines, pharmacies, contact)
│   ├── queries/          the SQL
│   ├── middleware/       404 and error handling
│   └── utils/            input validation, response formatting
└── test/api.test.js      end-to-end tests
```

## Database

| Table | Holds |
| --- | --- |
| `pharmacies` | name, address, phone, latitude/longitude, opening hours, `source_system` |
| `medicines` | the shared catalogue: name, generic and brand name, category, form, strength, pack size, prescription flag |
| `inventory` | one row per pharmacy per medicine: `price` (RWF), `quantity`, `external_sku`, `last_synced_at` |
| `contact_messages` | messages sent through the contact form on the website |

Two SQL functions do the location and opening-hours work:

- `distance_km(lat1, lng1, lat2, lng2)` – straight-line distance using the haversine formula (no PostGIS needed).
- `pharmacy_is_open(is_24h, opens_at, closes_at)` – whether a pharmacy is open now, in Kigali time.

## API

Everything under `/api` returns JSON. Prices are whole numbers in RWF. Any other address serves the website from `../frontend`.

### Medicines

| Endpoint | Description |
| --- | --- |
| `/api/medicines` | Browse and search the catalogue |
| `/api/medicines/:id` | One medicine with its price range |
| `/api/medicines/:id/prices` | Compare this medicine's price across pharmacies |
| `/api/categories` | Categories with the number of medicines in each |

`/api/medicines` query parameters:

| Parameter | Meaning |
| --- | --- |
| `q` | Search text – matches name, generic name and brand name |
| `category` | Only this category |
| `prescription` | `true` = prescription-only, `false` = over the counter |
| `in_stock` | `true` = only medicines at least one pharmacy has in stock |
| `sort`, `order` | `name` (default) or `price`; `asc` (default) or `desc` |
| `page`, `limit` | Pagination; `limit` defaults to 20, max 100 |

`/api/medicines/:id/prices` query parameters:

| Parameter | Meaning |
| --- | --- |
| `lat`, `lng` | The user's location – adds `distance_km` to every pharmacy |
| `radius_km` | Only pharmacies within this distance (needs `lat`/`lng`) |
| `in_stock` | `true` (default) hides pharmacies that are out of stock |
| `sort` | `price` (default) or `distance` (needs `lat`/`lng`) |

```jsonc
// GET /api/medicines/1/prices?lat=-1.9536&lng=30.0927&radius_km=4
{
  "medicine": { "id": 1, "name": "Paracetamol 500mg Tablets", "lowest_price": 450, "...": "..." },
  "summary": {
    "pharmacy_count": 4, "lowest_price": 450, "highest_price": 550,
    "average_price": 513, "max_saving": 100, "currency": "RWF"
  },
  "data": [
    {
      "price": 450,
      "currency": "RWF",
      "availability": "in_stock",          // in_stock | low_stock | out_of_stock
      "is_lowest_price": true,
      "last_synced_at": "2026-09-30T12:43:01.310Z",
      "pharmacy": {
        "id": 7, "name": "Urumuri Pharmacy", "address": "KK 31 Ave, Gikondo",
        "sector": "Gikondo", "district": "Kicukiro", "phone": "+250 788 000 007",
        "latitude": -1.975, "longitude": 30.075,
        "opens_at": "08:00", "closes_at": "20:00", "is_24h": false,
        "is_open_now": true, "distance_km": 3.09
      }
    }
  ]
}
```

### Pharmacies

| Endpoint | Description |
| --- | --- |
| `/api/pharmacies` | List pharmacies – nearest first when `lat`/`lng` are sent |
| `/api/pharmacies/:id` | One pharmacy (send `lat`/`lng` to get `distance_km`) |
| `/api/pharmacies/:id/medicines` | What this pharmacy lists, with its prices (`q`, `category`, `in_stock`, `page`, `limit`) |

`/api/pharmacies` query parameters:

| Parameter | Meaning |
| --- | --- |
| `lat`, `lng` | The user's location – adds `distance_km` and sorts by it |
| `radius_km` | Only pharmacies within this distance (needs `lat`/`lng`) |
| `open_now` | `true` = only pharmacies open right now |
| `medicine_id` | Only pharmacies that have this medicine in stock |
| `q` | Search in name, address, sector and district |
| `page`, `limit` | Pagination; `limit` defaults to 20, max 100 |

### Other endpoints

| Endpoint | Description |
| --- | --- |
| `GET /api/stats` | Headline numbers: `pharmacies`, `pharmacies_open_now`, `medicines`, `last_synced_at` |
| `GET /api/health` | Whether the API can reach the database |
| `POST /api/contact` | Save a message from the contact form |

`POST /api/contact` takes a JSON body and answers `201` with the new message's `id`:

```json
{ "name": "Aline", "contact": "+250 788 000 000", "topic": "missing_medicine", "message": "I could not find ..." }
```

`topic` is one of `missing_medicine`, `wrong_information`, `pharmacy_joining`, `other`. One address can send at most 5 messages in 10 minutes (after that the answer is `429`). To read the messages:

```sql
SELECT * FROM contact_messages ORDER BY created_at DESC;
```

### Errors

Errors always have the same shape, with a matching HTTP status (400, 404, 429, 500, 503):

```json
{ "error": { "code": "invalid_parameter", "message": "limit must be a whole number between 1 and 100" } }
```

## Test data

`db/seed-data.js` has 12 pharmacies around Kigali and 38 common medicines. Pharmacy names, addresses and phone numbers are made up and prices are illustrative. The seeder gives each pharmacy about three quarters of the catalogue at its own price level, and marks some items out of stock, so there is something to compare. It produces the same data on every run.

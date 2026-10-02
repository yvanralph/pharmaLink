# PharmaLink

PharmaLink is a digital network that connects patients with local pharmacies, without asking pharmacies to replace the systems they already use. Patients can check which pharmacies have a medicine, compare prices, and find the nearest pharmacy before they travel.

Over time the same network can let pharmacies communicate with each other and produce aggregated information about medicine demand. This repository is the MVP.

## What the MVP does

1. **Works with existing pharmacy systems.** Each pharmacy's stock and prices are stored together with the system they came from and the time they were last updated. For now this is filled with seeded test data.
2. **Browse, search and compare prices.** Patients search medicines by brand or generic name, filter by category, and compare one medicine's price across pharmacies.
3. **Find nearby pharmacies.** Pharmacies are listed nearest first from the patient's location, with a map, opening hours and directions.

PharmaLink shows what pharmacies have in stock. It does not sell or deliver medicines.

## Tech stack

| Part | Built with |
| --- | --- |
| Frontend | HTML, CSS and JavaScript (no framework, no build step) |
| Backend | Node.js and Express |
| Database | PostgreSQL |
| Map | Leaflet with OpenStreetMap tiles |

## Run it on your computer

You need [Node.js](https://nodejs.org) 18.11 or newer and a running [PostgreSQL](https://www.postgresql.org/download/) server.

```bash
# 1. Get the code
git clone https://github.com/yvanralph/pharmaLink.git
cd pharmaLink/backend

# 2. Install the backend's packages
npm install

# 3. Create your settings file, then open .env and put your own
#    PostgreSQL user and password in DATABASE_URL
cp .env.example .env

# 4. Create the database, the tables and the test data
npm run db:setup

# 5. Start the app
npm run dev
```

Then open <http://localhost:3000>. The backend serves both the API and the website, so this one command runs everything.

The settings in `backend/.env`:

| Setting | Meaning | Default |
| --- | --- | --- |
| `PORT` | Port the app listens on | `3000` |
| `DATABASE_URL` | PostgreSQL connection, as `postgres://USER:PASSWORD@HOST:PORT/DATABASE` | `postgres://postgres:postgres@localhost:5432/pharmalink` |
| `CORS_ORIGIN` | Which websites may call the API (`*` = any) | `*` |

### Useful commands

Run these from the `backend/` folder.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app and restart it when a file changes |
| `npm start` | Start the app (production) |
| `npm run db:setup` | Create the database if missing, then the tables and test data |
| `npm run db:schema` | Recreate the tables (**deletes existing data**) |
| `npm run db:seed` | Empty the tables and reload the test data |
| `npm test` | Run the automated tests (needs the seeded database) |

### If something goes wrong

- **"Database script failed" or the site shows "The database is not reachable":** check that PostgreSQL is running and that the user and password in `DATABASE_URL` are correct.
- **"Port 3000 is already in use":** change `PORT` in `.env`, or stop the other program.
- **Pages load but show no medicines:** run `npm run db:setup` again to load the test data.

## Project structure

```
pharmaLink/
├── backend/          Express API and PostgreSQL scripts
│   ├── db/           schema.sql and the test data
│   ├── scripts/      database setup commands
│   ├── src/          the server: routes, SQL queries, validation
│   └── test/         automated API tests
└── frontend/         the website, served by the backend
    ├── *.html        one file per page
    ├── css/          styles
    ├── js/           one script per page, plus shared helpers
    ├── assets/       fonts, favicon, images
    └── vendor/       the Leaflet map library
```

More detail is in [`backend/README.md`](backend/README.md) (database tables and the full API reference) and [`frontend/README.md`](frontend/README.md) (pages, file layout and how to change things).

## Pages

| Address | Page |
| --- | --- |
| `/` | Homepage: search, categories, nearest pharmacies, about, contact form |
| `/medicines.html` | Browse and search medicines |
| `/medicine.html?id=1` | Compare one medicine's price across pharmacies |
| `/pharmacies.html` | Nearest pharmacies as a list and on a map |
| `/pharmacy.html?id=1` | One pharmacy and the medicines it has |

## API at a glance

Everything under `/api` returns JSON.

| Endpoint | Description |
| --- | --- |
| `GET /api/medicines` | Browse and search medicines |
| `GET /api/medicines/:id` | One medicine with its price range |
| `GET /api/medicines/:id/prices` | Compare a medicine's price across pharmacies |
| `GET /api/categories` | Medicine categories |
| `GET /api/pharmacies` | Pharmacies, nearest first when `lat` and `lng` are sent |
| `GET /api/pharmacies/:id` | One pharmacy |
| `GET /api/pharmacies/:id/medicines` | What one pharmacy has, with its prices |
| `GET /api/stats` | Headline numbers about the network |
| `POST /api/contact` | Save a message from the contact form |
| `GET /api/health` | Whether the API can reach the database |

## Good to know

- **The data is test data.** The 12 pharmacies and 38 medicines are seeded for development. Pharmacy names, addresses, phone numbers and prices are made up. Edit them in `backend/db/seed-data.js`.
- **Contact details on the homepage are placeholders.** Replace the phone number, email and hours in `frontend/index.html`.
- **The map needs an internet connection**, because its tiles come from OpenStreetMap. Their free tile server is meant for light use, so a busy live site should move to a paid tile provider.
- **Location.** Distances are measured from Kigali city centre until a visitor shares their location or picks an area.

## Author

Built by [Yvan Ralph](https://github.com/yvanralph) in Kigali, Rwanda.

## Licence

PharmaLink is released under the [MIT Licence](LICENSE): you may use, change and share the code, as long as the copyright notice stays with it.

The bundled third-party files keep their own licences: Leaflet (BSD-2-Clause), the Lucide icons (ISC), and the Bricolage Grotesque and Atkinson Hyperlegible Next fonts (SIL Open Font License).

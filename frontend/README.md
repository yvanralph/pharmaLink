# PharmaLink frontend

The PharmaLink website, written in plain HTML, CSS and JavaScript (no build step). The backend serves this folder, so to see it:

```bash
cd backend
npm run dev      # then open http://localhost:3000
```

## Pages

| Page | What it does |
| --- | --- |
| `index.html` | Homepage: search, categories, nearest pharmacies, about, contact form |
| `medicines.html` | Browse and search medicines, with filters and sorting |
| `medicine.html?id=1` | Compare one medicine's price across pharmacies, by price or by distance |
| `pharmacies.html` | Nearest pharmacies as a list and on a map |
| `pharmacy.html?id=1` | One pharmacy: details, directions, and the medicines it has |
| `404.html` | Shown for addresses that do not exist |

## Layout

```
frontend/
├── css/
│   ├── styles.css     colours, fonts and every shared component
│   ├── home.css       homepage sections
│   └── pages.css      the other pages and the map
├── js/
│   ├── config.js      API address, default location, list of areas
│   ├── api.js         get() and post() for calling the API
│   ├── ui.js          safe HTML templates, icons, formatting (prices, distances, times)
│   ├── location.js    the visitor's location and the "Distances from ..." bar
│   ├── layout.js      header and footer, shared by every page
│   ├── search.js      search box with live suggestions
│   ├── components.js  route rows and medicine cards
│   ├── map.js         the pharmacy map
│   └── home.js, medicines.js, medicine.js, pharmacies.js, pharmacy.js   one per page
├── assets/            fonts, favicon and images (the homepage illustration)
└── vendor/leaflet/    the Leaflet map library
```

## Things to know

- **Colours** are defined once, at the top of `css/styles.css` (`--navy` primary, `--blue` secondary, `--sky` tertiary, `--ink` neutral).
- **Location.** Distances start from Kigali city centre. A visitor can press "Use my location" or pick an area; the choice is remembered in the browser. Change the default and the list of areas in `js/config.js`.
- **Text from the API is always escaped.** Build markup with the `html` tag from `js/ui.js` (``html`<p>${name}</p>` ``) rather than joining strings, so data can never inject HTML.
- **Contact details** on the homepage (phone, email, hours) are placeholders. Replace them in `index.html`, in the section marked "Placeholder contact details".
- **Homepage picture.** `assets/images/hero-pharmacy.svg` is an original drawing. To use another image, put it in `assets/images/` and change the `src` of the `hero__art` image in `index.html`.
- **Map tiles** come from OpenStreetMap and need an internet connection. OpenStreetMap only serves tiles to pages that send a `Referer` header, which is why the backend sets `Referrer-Policy: strict-origin-when-cross-origin`; if the map ever shows "Access blocked" tiles, check that header first. Their free tile server is for light use, so a busy production site should move to a paid tile provider or its own tiles. Everything else, including the fonts, is served from this folder.

## Credits

Fonts: Bricolage Grotesque and Atkinson Hyperlegible Next (SIL Open Font License). Icons: Lucide (ISC). Map: Leaflet (BSD-2-Clause) with © OpenStreetMap contributors.

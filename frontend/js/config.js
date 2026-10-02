// Settings for the website.

// Where the API lives. '/api' works when the backend serves this website
// (npm run dev in backend/, then open http://localhost:3000).
// If you ever host the frontend somewhere else, put the full address here,
// for example 'https://api.pharmalink.rw/api'.
export const API_BASE = '/api';

// Used for distances until the visitor shares their location or picks an area.
export const DEFAULT_LOCATION = {
  lat: -1.9441,
  lng: 30.0619,
  label: 'Kigali city centre',
  source: 'default',
};

// Areas a visitor can pick instead of sharing their exact location.
export const AREAS = [
  { label: 'Kigali city centre', lat: -1.9441, lng: 30.0619 },
  { label: 'Gikondo', lat: -1.975, lng: 30.075 },
  { label: 'Gisozi', lat: -1.921, lng: 30.06 },
  { label: 'Kacyiru', lat: -1.9365, lng: 30.09 },
  { label: 'Kanombe', lat: -1.968, lng: 30.15 },
  { label: 'Kibagabaga', lat: -1.93, lng: 30.12 },
  { label: 'Kicukiro', lat: -1.9907, lng: 30.103 },
  { label: 'Kimihurura', lat: -1.953, lng: 30.085 },
  { label: 'Kimironko', lat: -1.9495, lng: 30.1263 },
  { label: 'Nyamirambo', lat: -1.979, lng: 30.044 },
  { label: 'Nyarutarama', lat: -1.935, lng: 30.106 },
  { label: 'Remera', lat: -1.9578, lng: 30.1127 },
];

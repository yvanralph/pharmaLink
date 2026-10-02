// Shared helpers: safe HTML templates, icons and text formatting.

// --- Safe HTML ---------------------------------------------------------------
// Use the html`...` tag to build markup. Every ${value} is escaped, so text
// from the API can never inject HTML. Values built with html`...` or icon()
// are inserted as they are, and arrays are joined.

class SafeHtml {
  constructor(value) {
    this.value = value;
  }

  toString() {
    return this.value;
  }
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]
  ));
}

function render(value) {
  if (value instanceof SafeHtml) return value.value;
  if (Array.isArray(value)) return value.map(render).join('');
  if (value === null || value === undefined || value === false) return '';
  return escapeHtml(value);
}

export function html(strings, ...values) {
  return new SafeHtml(strings.reduce((out, part, i) => out + render(values[i - 1]) + part));
}

// --- Icons (from the Lucide icon set, ISC licence) -------------------------------
const ICONS = {
  'arrow-left': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  bandage: '<path d="M10 10.01h.01"/><path d="M10 14.01h.01"/><path d="M14 10.01h.01"/><path d="M14 14.01h.01"/><path d="M18 6v12"/><path d="M6 6v12"/><rect x="2" y="6" width="20" height="12" rx="2"/>',
  bug: '<path d="M12 20v-9"/><path d="M14 7a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4z"/><path d="M14.12 3.88 16 2"/><path d="M21 21a4 4 0 0 0-3.81-4"/><path d="M21 5a4 4 0 0 1-3.55 3.97"/><path d="M22 13h-4"/><path d="M3 21a4 4 0 0 1 3.81-4"/><path d="M3 5a4 4 0 0 0 3.55 3.97"/><path d="M6 13H2"/><path d="m8 2 1.88 1.88"/><path d="M9 7.13V6a3 3 0 1 1 6 0v1.13"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  citrus: '<path d="M21.66 17.67a1.08 1.08 0 0 1-.04 1.6A12 12 0 0 1 4.73 2.38a1.1 1.1 0 0 1 1.61-.04z"/><path d="M19.65 15.66A8 8 0 0 1 8.35 4.34"/><path d="m14 10-5.5 5.5"/><path d="M14 17.85V10H6.15"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  droplet: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  'file-text': '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  'glass-water': '<path d="M5.116 4.104A1 1 0 0 1 6.11 3h11.78a1 1 0 0 1 .994 1.105L17.19 20.21A2 2 0 0 1 15.2 22H8.8a2 2 0 0 1-2-1.79z"/><path d="M6 12a5 5 0 0 1 6 0 5 5 0 0 0 6 0"/>',
  hand: '<path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
  'heart-pulse': '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/><path d="M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
  'locate-fixed': '<line x1="2" x2="5" y1="12" y2="12"/><line x1="19" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="5"/><line x1="12" x2="12" y1="19" y2="22"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/>',
  mail: '<path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/>',
  'map-pin': '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  menu: '<path d="M4 5h16"/><path d="M4 12h16"/><path d="M4 19h16"/>',
  'message-circle': '<path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/>',
  navigation: '<polygon points="3 11 22 2 13 21 11 13 3 11"/>',
  phone: '<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>',
  pill: '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>',
  'refresh-cw': '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  search: '<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>',
  store: '<path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"/><path d="M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"/><path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"/>',
  thermometer: '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  wind: '<path d="M12.8 19.6A2 2 0 1 0 14 16H2"/><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/><path d="M9.8 4.4A2 2 0 1 1 11 8H2"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
};

export function icon(name, extraClass = '') {
  return new SafeHtml(
    `<svg class="icon ${extraClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.pill}</svg>`,
  );
}

const CATEGORY_ICONS = {
  'Pain & Fever': 'thermometer',
  Antibiotics: 'pill',
  Malaria: 'bug',
  Diabetes: 'droplet',
  'Heart & Blood Pressure': 'heart-pulse',
  'Digestive Health': 'glass-water',
  'Respiratory & Allergy': 'wind',
  'Vitamins & Supplements': 'citrus',
  'Skin Care': 'hand',
};

export function categoryIcon(category) {
  return icon(CATEGORY_ICONS[category] || 'pill');
}

// --- Formatting --------------------------------------------------------------
export function formatNumber(value) {
  return Number(value).toLocaleString('en-US');
}

// 1250 -> <span class="price">1,250 <span class="price__cur">RWF</span></span>
export function price(value, currency = 'RWF') {
  if (value === null || value === undefined) return html`<span class="muted">No price yet</span>`;
  return html`<span class="price">${formatNumber(value)}<span class="price__cur"> ${currency}</span></span>`;
}

export function plural(count, one, many = `${one}s`) {
  return `${formatNumber(count)} ${count === 1 ? one : many}`;
}

export function formatDistance(km) {
  if (km === null || km === undefined) return '';
  if (km < 1) return `${Math.max(10, Math.round(km * 100) * 10)} m`;
  return `${km.toFixed(1)} km`;
}

export function timeAgo(isoDate) {
  const minutes = Math.round((Date.now() - new Date(isoDate).getTime()) / 60000);
  if (minutes < 2) return 'just now';
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

// "Tablet, 500 mg, strip of 10"
export function packDescription(medicine) {
  return [medicine.dosage_form, medicine.strength, medicine.pack_size]
    .filter(Boolean)
    .map((part, index) => (index === 0 ? part : part.charAt(0).toLowerCase() + part.slice(1)))
    .join(', ');
}

// "Paracetamol, sold as Panadol"
export function genericLine(medicine) {
  return medicine.brand_name
    ? `${medicine.generic_name}, sold as ${medicine.brand_name}`
    : medicine.generic_name;
}

export function openStatus(pharmacy) {
  if (pharmacy.is_24h) return { open: true, text: 'Open 24 hours' };
  if (pharmacy.is_open_now === null || !pharmacy.opens_at) return { open: null, text: 'Opening hours not listed' };
  return pharmacy.is_open_now
    ? { open: true, text: `Open now, closes ${pharmacy.closes_at}` }
    : { open: false, text: `Closed, opens ${pharmacy.opens_at}` };
}

export function openStatusBadge(pharmacy) {
  const status = openStatus(pharmacy);
  const modifier = status.open === true ? 'status--open' : status.open === false ? 'status--closed' : '';
  return html`<span class="status ${modifier}">${status.text}</span>`;
}

const AVAILABILITY = {
  in_stock: { label: 'In stock', modifier: 'tag--ok' },
  low_stock: { label: 'Few left', modifier: 'tag--low' },
  out_of_stock: { label: 'Out of stock', modifier: 'tag--out' },
};

export function availabilityTag(availability) {
  const item = AVAILABILITY[availability] || AVAILABILITY.out_of_stock;
  return html`<span class="tag ${item.modifier}">${item.label}</span>`;
}

export function directionsUrl(pharmacy, from) {
  const params = new URLSearchParams({ api: '1', destination: `${pharmacy.latitude},${pharmacy.longitude}` });
  if (from && from.source !== 'default') params.set('origin', `${from.lat},${from.lng}`);
  return `https://www.google.com/maps/dir/?${params}`;
}

export function telUrl(phone) {
  return `tel:${String(phone).replace(/[^+\d]/g, '')}`;
}

// --- Page helpers ------------------------------------------------------------
export function queryParams() {
  return new URLSearchParams(window.location.search);
}

// Replace the query string in the address bar without reloading the page.
export function updateUrl(params) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '' && value !== false) query.set(key, value);
  }
  const queryString = query.toString();
  window.history.replaceState(null, '', queryString ? `?${queryString}` : window.location.pathname);
}

export function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function errorState(error, retryLabel = 'Try again') {
  return html`
    <div class="state state--error" role="alert">
      <h3>This did not load</h3>
      <p>${error.message}</p>
      <button class="btn btn--small" type="button" data-retry>${retryLabel}</button>
    </div>`;
}

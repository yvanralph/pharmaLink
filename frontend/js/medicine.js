// Medicine page: compare one medicine's price across pharmacies.

import { get } from './api.js';
import { offerRoutes } from './components.js';
import { currentLocation, mountLocationBar, onLocationChange } from './location.js';
import {
  errorState, formatNumber, genericLine, html, icon, plural, queryParams, updateUrl,
} from './ui.js';

const headContent = document.getElementById('head-content');
const controls = document.getElementById('controls');
const summaryBox = document.getElementById('summary');
const offersBox = document.getElementById('offers');

const params = queryParams();
const medicineId = params.get('id');
const state = {
  sort: params.get('sort') === 'distance' ? 'distance' : 'price',
  radius: ['2', '5', '10'].includes(params.get('radius')) ? params.get('radius') : '',
  showOut: params.get('show_out') === 'true',
};

function showStateInControls() {
  controls.elements.sort.value = state.sort;
  controls.elements.radius.value = state.radius;
  controls.elements.show_out.checked = state.showOut;
}

function drawHead(medicine) {
  document.title = `${medicine.name}: compare prices | PharmaLink`;
  headContent.innerHTML = html`
    <h1>${medicine.name}</h1>
    <p class="page-head__sub">${genericLine(medicine)}. ${medicine.description || ''}</p>
    <p class="page-head__chips">
      <span class="tag">${medicine.dosage_form}</span>
      ${medicine.strength ? html`<span class="tag">${medicine.strength}</span>` : ''}
      ${medicine.pack_size ? html`<span class="tag">${medicine.pack_size}</span>` : ''}
      <a class="tag" href="medicines.html?category=${encodeURIComponent(medicine.category)}">${medicine.category}</a>
      ${medicine.requires_prescription
        ? html`<span class="tag tag--rx">${icon('file-text')}Prescription needed: take it with you</span>`
        : html`<span class="tag">No prescription needed</span>`}
    </p>`;
}

function drawSummary(summary, medicine) {
  const where = state.radius ? ` within ${state.radius} km` : '';
  if (!summary.pharmacy_count) {
    summaryBox.textContent = '';
    return;
  }
  const pharmacies = plural(summary.pharmacy_count, 'pharmacy', 'pharmacies');
  if (summary.pharmacy_count === 1) {
    summaryBox.innerHTML = html`In stock at <strong>1 pharmacy</strong>${where}, for <strong>${formatNumber(summary.lowest_price)} ${summary.currency}</strong> per ${packNoun(medicine)}.`;
  } else if (summary.max_saving === 0) {
    summaryBox.innerHTML = html`In stock at <strong>${pharmacies}</strong>${where}. They all charge <strong>${formatNumber(summary.lowest_price)} ${summary.currency}</strong>.`;
  } else {
    summaryBox.innerHTML = html`
      In stock at <strong>${pharmacies}</strong>${where}, from <strong>${formatNumber(summary.lowest_price)}</strong>
      to <strong>${formatNumber(summary.highest_price)} ${summary.currency}</strong> per ${packNoun(medicine)}.
      Choosing the cheapest saves you up to <strong>${formatNumber(summary.max_saving)} ${summary.currency}</strong>.`;
  }
}

// "Strip of 10" -> "strip of 10", "1 sachet" -> "sachet"; falls back to "pack"
function packNoun(medicine) {
  const pack = (medicine.pack_size || 'pack').replace(/^1 /, '');
  return /^\d/.test(pack) ? pack : pack.charAt(0).toLowerCase() + pack.slice(1);
}

function drawOffers(result, location) {
  if (result.data.length) {
    offersBox.innerHTML = offerRoutes(result.data, location);
    return;
  }

  const widen = state.radius !== '';
  offersBox.innerHTML = html`
    <div class="state">
      <h3>${widen
        ? `No pharmacy within ${state.radius} km of ${location.label} has this in stock`
        : 'No pharmacy has this in stock right now'}</h3>
      <p>${widen
        ? 'Pharmacies further away may have it.'
        : 'Stock changes often. Check again later, or ask a pharmacist about an alternative.'}</p>
      ${widen
        ? html`<button class="btn btn--small" type="button" data-widen>Search any distance</button>`
        : !state.showOut ? html`<button class="btn btn--small" type="button" data-show-out>Show pharmacies that normally stock it</button>` : ''}
    </div>`;
  offersBox.querySelector('[data-widen]')?.addEventListener('click', () => {
    state.radius = '';
    showStateInControls();
    load();
  });
  offersBox.querySelector('[data-show-out]')?.addEventListener('click', () => {
    state.showOut = true;
    showStateInControls();
    load();
  });
}

let requestId = 0;

async function load() {
  const thisRequest = requestId += 1;
  const location = currentLocation();
  updateUrl({
    id: medicineId,
    sort: state.sort === 'price' ? '' : state.sort,
    radius: state.radius,
    show_out: state.showOut ? 'true' : '',
  });
  offersBox.setAttribute('aria-busy', 'true');

  try {
    const result = await get(`/medicines/${encodeURIComponent(medicineId)}/prices`, {
      lat: location.lat,
      lng: location.lng,
      sort: state.sort,
      radius_km: state.radius,
      in_stock: state.showOut ? 'false' : 'true',
    });
    if (thisRequest !== requestId) return;
    drawHead(result.medicine);
    drawSummary(result.summary, result.medicine);
    drawOffers(result, location);
  } catch (error) {
    if (thisRequest !== requestId) return;
    summaryBox.textContent = '';
    if (error.status === 404 || error.status === 400) {
      headContent.innerHTML = html`<h1>Medicine not found</h1>
        <p class="page-head__sub">This medicine is not in the catalogue. It may have been removed, or the link is incomplete.</p>`;
      document.getElementById('toolbar').hidden = true;
      offersBox.innerHTML = html`<a class="btn" href="medicines.html">Browse all medicines</a>`;
      document.querySelector('.compare__note').hidden = true;
    } else {
      offersBox.innerHTML = errorState(error);
      offersBox.querySelector('[data-retry]').addEventListener('click', load);
    }
  } finally {
    if (thisRequest === requestId) offersBox.removeAttribute('aria-busy');
  }
}

controls.addEventListener('change', () => {
  state.sort = controls.elements.sort.value;
  state.radius = controls.elements.radius.value;
  state.showOut = controls.elements.show_out.checked;
  load();
});
controls.addEventListener('submit', (event) => event.preventDefault());

showStateInControls();
mountLocationBar(document.getElementById('location'));
onLocationChange(load);
load();

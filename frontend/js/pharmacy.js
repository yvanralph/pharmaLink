// Pharmacy page: one pharmacy's details and the medicines it lists.

import { get } from './api.js';
import { currentLocation, mountLocationBar, onLocationChange } from './location.js';
import { createPharmacyMap } from './map.js';
import {
  availabilityTag, debounce, directionsUrl, errorState, formatDistance, html, icon,
  openStatusBadge, packDescription, plural, price, queryParams, telUrl, timeAgo,
} from './ui.js';

const headContent = document.getElementById('head-content');
const controls = document.getElementById('controls');
const stock = document.getElementById('stock');
const count = document.getElementById('count');

const pharmacyId = queryParams().get('id');
const state = { q: '', inStock: true };

const map = createPharmacyMap(document.getElementById('map'));

function showNotFound() {
  headContent.innerHTML = html`<h1>Pharmacy not found</h1>
    <p class="page-head__sub">This pharmacy is not on PharmaLink. It may have left the network, or the link is incomplete.</p>`;
  document.getElementById('shop').innerHTML = html`<a class="btn" href="pharmacies.html">See all pharmacies</a>`;
}

async function loadPharmacy() {
  const location = currentLocation();
  try {
    const { data: pharmacy } = await get(`/pharmacies/${encodeURIComponent(pharmacyId)}`, {
      lat: location.lat, lng: location.lng,
    });
    document.title = `${pharmacy.name} | PharmaLink`;
    headContent.innerHTML = html`
      <h1>${pharmacy.name}</h1>
      <p class="page-head__sub">${pharmacy.address}${pharmacy.district ? `, ${pharmacy.district}` : ''}</p>
      <p class="page-head__chips">
        <span class="tag">${openStatusBadge(pharmacy)}</span>
        ${!pharmacy.is_24h && pharmacy.opens_at ? html`<span class="tag">${icon('clock')}${pharmacy.opens_at} to ${pharmacy.closes_at}, every day</span>` : ''}
        <span class="tag">${formatDistance(pharmacy.distance_km)} from ${location.label}</span>
      </p>
      <p class="shop__actions">
        <a class="btn btn--sky" href="${directionsUrl(pharmacy, location)}" target="_blank" rel="noopener">${icon('navigation')}Get directions</a>
        ${pharmacy.phone ? html`<a class="btn btn--ghost" href="${telUrl(pharmacy.phone)}">${icon('phone')}Call ${pharmacy.phone}</a>` : ''}
      </p>`;
    map.setLocation(location);
    map.setPharmacies([pharmacy], location);
    return true;
  } catch (error) {
    if (error.status === 404 || error.status === 400) {
      showNotFound();
    } else {
      headContent.innerHTML = html`<h1>Pharmacy</h1>`;
      stock.innerHTML = errorState(error);
      stock.querySelector('[data-retry]').addEventListener('click', () => window.location.reload());
    }
    return false;
  }
}

let requestId = 0;

async function loadStock() {
  const thisRequest = requestId += 1;
  stock.setAttribute('aria-busy', 'true');
  try {
    const { data, pagination } = await get(`/pharmacies/${encodeURIComponent(pharmacyId)}/medicines`, {
      q: state.q,
      in_stock: state.inStock ? 'true' : '',
      limit: 100,
    });
    if (thisRequest !== requestId) return;

    if (!data.length) {
      count.textContent = '';
      stock.innerHTML = html`
        <div class="state">
          <h3>${state.q ? `Nothing here matches “${state.q}”` : 'No medicines listed for this pharmacy yet'}</h3>
          ${state.q ? html`
            <p>Another pharmacy may have it.</p>
            <a class="btn btn--small" href="medicines.html?q=${encodeURIComponent(state.q)}">Search all pharmacies</a>` : ''}
        </div>`;
      return;
    }

    count.innerHTML = html`<strong>${plural(pagination.total, 'medicine')}</strong>${state.inStock ? ' in stock' : ' listed'}${state.q ? ` matching “${state.q}”` : ''}`;
    stock.innerHTML = html`
      <ul class="stock">
        ${data.map((medicine) => html`
          <li class="stock__row ${medicine.availability === 'out_of_stock' ? 'stock__row--out' : ''}">
            <div class="stock__name">
              <a href="medicine.html?id=${medicine.id}">${medicine.name}</a>
              <span class="muted">${packDescription(medicine)}${medicine.requires_prescription ? ', prescription needed' : ''}</span>
            </div>
            <div class="stock__status">
              ${availabilityTag(medicine.availability)}
              <small class="muted">Updated ${timeAgo(medicine.last_synced_at)}</small>
            </div>
            <div class="stock__price">${price(medicine.price, medicine.currency)}</div>
          </li>`)}
      </ul>
      <p class="muted stock__note">Select a medicine to compare this price with other pharmacies.</p>`;
  } catch (error) {
    if (thisRequest !== requestId) return;
    count.textContent = '';
    stock.innerHTML = errorState(error);
    stock.querySelector('[data-retry]').addEventListener('click', loadStock);
  } finally {
    if (thisRequest === requestId) stock.removeAttribute('aria-busy');
  }
}

controls.elements.q.addEventListener('input', debounce(() => {
  state.q = controls.elements.q.value.trim();
  loadStock();
}, 300));
controls.addEventListener('change', () => {
  state.inStock = controls.elements.in_stock.checked;
  loadStock();
});
controls.addEventListener('submit', (event) => event.preventDefault());

if (await loadPharmacy()) {
  mountLocationBar(document.getElementById('location'));
  onLocationChange(loadPharmacy);
  loadStock();
}

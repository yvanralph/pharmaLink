// Pharmacies page: nearest pharmacies as a list and on a map.

import { get } from './api.js';
import { pharmacyRoutes } from './components.js';
import { currentLocation, mountLocationBar, onLocationChange } from './location.js';
import { createPharmacyMap } from './map.js';
import {
  debounce, errorState, html, plural, queryParams, updateUrl,
} from './ui.js';

const controls = document.getElementById('controls');
const list = document.getElementById('list');
const count = document.getElementById('count');

const params = queryParams();
const state = {
  q: params.get('q') || '',
  radius: ['2', '5', '10'].includes(params.get('radius')) ? params.get('radius') : '',
  openNow: params.get('open_now') === 'true',
};

function showStateInControls() {
  controls.elements.q.value = state.q;
  controls.elements.radius.value = state.radius;
  controls.elements.open_now.checked = state.openNow;
}

// Clicking a marker highlights the matching row in the list.
const map = createPharmacyMap(document.getElementById('map'), {
  onSelect(id) {
    highlight(id);
    list.querySelector(`[data-pharmacy="${id}"]`)?.scrollIntoView({ block: 'nearest' });
  },
});

function highlight(id) {
  list.querySelectorAll('.route.is-active').forEach((row) => row.classList.remove('is-active'));
  list.querySelector(`[data-pharmacy="${id}"]`)?.classList.add('is-active');
}

let requestId = 0;

async function load() {
  const thisRequest = requestId += 1;
  const location = currentLocation();
  updateUrl({ q: state.q, radius: state.radius, open_now: state.openNow ? 'true' : '' });
  list.setAttribute('aria-busy', 'true');

  try {
    const { data, pagination } = await get('/pharmacies', {
      lat: location.lat,
      lng: location.lng,
      q: state.q,
      radius_km: state.radius,
      open_now: state.openNow ? 'true' : '',
      limit: 100,
    });
    if (thisRequest !== requestId) return;

    map.setLocation(location);
    map.setPharmacies(data, location);

    if (!data.length) {
      count.textContent = '';
      const filtered = state.q || state.radius || state.openNow;
      list.innerHTML = html`
        <div class="state">
          <h3>${filtered ? 'No pharmacy matches these filters' : 'No pharmacies connected yet'}</h3>
          <p>${filtered
            ? `Nothing ${state.openNow ? 'open ' : ''}${state.radius ? `within ${state.radius} km of ${location.label}` : 'found'}${state.q ? ` for “${state.q}”` : ''}.`
            : 'Pharmacies will appear here as they join the network.'}</p>
          ${filtered ? html`<button class="btn btn--small" type="button" data-clear>Show all pharmacies</button>` : ''}
        </div>`;
      list.querySelector('[data-clear]')?.addEventListener('click', () => {
        Object.assign(state, { q: '', radius: '', openNow: false });
        showStateInControls();
        load();
      });
      return;
    }

    count.innerHTML = html`<strong>${plural(pagination.total, 'pharmacy', 'pharmacies')}</strong>${state.radius ? ` within ${state.radius} km` : ''}${state.openNow ? ', open now' : ''}`;
    list.innerHTML = pharmacyRoutes(data, location);
  } catch (error) {
    if (thisRequest !== requestId) return;
    count.textContent = '';
    list.innerHTML = errorState(error);
    list.querySelector('[data-retry]').addEventListener('click', load);
  } finally {
    if (thisRequest === requestId) list.removeAttribute('aria-busy');
  }
}

// Pointing at or focusing a row shows that pharmacy on the map.
function showOnMap(event) {
  const row = event.target.closest('[data-pharmacy]');
  if (!row || row.classList.contains('is-active')) return;
  highlight(row.dataset.pharmacy);
  map.highlight(Number(row.dataset.pharmacy));
}
list.addEventListener('mouseover', showOnMap);
list.addEventListener('focusin', showOnMap);

controls.addEventListener('change', () => {
  state.radius = controls.elements.radius.value;
  state.openNow = controls.elements.open_now.checked;
  load();
});
controls.elements.q.addEventListener('input', debounce(() => {
  state.q = controls.elements.q.value.trim();
  load();
}, 300));
controls.addEventListener('submit', (event) => event.preventDefault());

showStateInControls();
mountLocationBar(document.getElementById('location'));
onLocationChange(load);
load();

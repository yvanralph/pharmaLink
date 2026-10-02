// The visitor's location: where distances are measured from.
// It is remembered in the browser (localStorage) so it carries across pages.

import { AREAS, DEFAULT_LOCATION } from './config.js';
import { html, icon } from './ui.js';

const STORAGE_KEY = 'pharmalink.location';
const CHANGE_EVENT = 'pharmalink:location';

export function getLocation() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    if (saved && Number.isFinite(saved.lat) && Number.isFinite(saved.lng)) return saved;
  } catch {
    // storage blocked or empty - use the default
  }
  return DEFAULT_LOCATION;
}

export function setLocation(location) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  } catch {
    // storage blocked - the location still applies to this page
  }
  current = location;
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: location }));
}

let current = null;

// The location in use on this page (kept in memory in case storage is blocked).
export function currentLocation() {
  if (!current) current = getLocation();
  return current;
}

export function onLocationChange(callback) {
  window.addEventListener(CHANGE_EVENT, (event) => callback(event.detail));
}

// Ask the browser for the visitor's position.
function locate() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('This browser cannot share its location. Choose your area from the list instead.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        label: 'your location',
        source: 'gps',
      }),
      (error) => reject(new Error(
        error.code === error.PERMISSION_DENIED
          ? 'Location access is switched off for this site. Choose your area from the list instead.'
          : 'Your location could not be found. Choose your area from the list instead.',
      )),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}

// Draws "Distances from X  [Use my location] [Choose an area]" inside `element`.
export function mountLocationBar(element) {
  function draw(message = '') {
    const location = currentLocation();
    element.classList.add('locbar');
    element.innerHTML = html`
      <p class="locbar__label">${icon('map-pin')}<span>Distances from <strong>${location.label}</strong></span></p>
      <div class="locbar__actions">
        <button class="btn btn--ghost btn--small" type="button" data-locate>${icon('locate-fixed')} Use my location</button>
        <label class="visually-hidden" for="${element.id}-area">Choose an area</label>
        <select class="select" id="${element.id}-area" data-area>
          <option value="">Choose an area</option>
          ${AREAS.map((area, index) => html`<option value="${index}" ${area.label === location.label ? 'selected' : ''}>${area.label}</option>`)}
        </select>
      </div>
      <p class="locbar__msg" role="status">${message}</p>`;
  }

  element.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-locate]');
    if (!button) return;
    button.disabled = true;
    button.lastChild.textContent = ' Finding you';
    try {
      setLocation(await locate());
    } catch (error) {
      draw(error.message);
    }
  });

  element.addEventListener('change', (event) => {
    if (!event.target.matches('[data-area]') || event.target.value === '') return;
    setLocation({ ...AREAS[Number(event.target.value)], source: 'area' });
  });

  // Redraw when the location changes anywhere on the page - until this bar is removed.
  function onChange() {
    if (element.isConnected) draw();
    else window.removeEventListener(CHANGE_EVENT, onChange);
  }
  window.addEventListener(CHANGE_EVENT, onChange);
  draw();
}

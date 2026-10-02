// Homepage: live numbers, categories, nearby pharmacies and the contact form.

import { get, post } from './api.js';
import { pharmacyRoutes } from './components.js';
import { currentLocation, mountLocationBar, onLocationChange } from './location.js';
import { initSearch } from './search.js';
import {
  categoryIcon, errorState, formatNumber, html, icon, plural, timeAgo,
} from './ui.js';

initSearch(document.getElementById('hero-search'));

// --- Live numbers --------------------------------------------------------------
async function loadStats() {
  const list = document.getElementById('stats');
  try {
    const { data } = await get('/stats');
    list.innerHTML = html`
      <li><strong>${formatNumber(data.pharmacies)}</strong> pharmacies connected</li>
      <li><strong>${formatNumber(data.pharmacies_open_now)}</strong> open right now</li>
      <li><strong>${formatNumber(data.medicines)}</strong> medicines listed</li>
      ${data.last_synced_at ? html`<li>Prices last updated <strong>${timeAgo(data.last_synced_at)}</strong></li>` : ''}`;
  } catch {
    list.closest('.strip').hidden = true;
  }
}

// --- Categories --------------------------------------------------------------------
async function loadCategories() {
  const list = document.getElementById('category-list');
  try {
    const { data } = await get('/categories');
    list.innerHTML = html`${data.map((category) => html`
      <li>
        <a class="directory__item" href="medicines.html?category=${encodeURIComponent(category.name)}">
          <span class="directory__icon">${categoryIcon(category.name)}</span>
          <span class="directory__name">${category.name}</span>
          <span class="directory__count">${plural(category.medicine_count, 'medicine')}</span>
        </a>
      </li>`)}`;
  } catch (error) {
    list.outerHTML = errorState(error).toString();
  }
}

// --- Nearby pharmacies ---------------------------------------------------------------
const nearbyList = document.getElementById('nearby-list');

async function loadNearby() {
  const location = currentLocation();
  try {
    const { data, pagination } = await get('/pharmacies', { lat: location.lat, lng: location.lng, limit: 4 });
    if (!data.length) {
      nearbyList.innerHTML = html`
        <div class="state">
          <h3>No pharmacies connected yet</h3>
          <p>They will show up here as they join the network.</p>
        </div>`;
      return;
    }
    nearbyList.innerHTML = html`
      ${pharmacyRoutes(data, location, { compact: true })}
      <p class="muted nearby__note">Showing the ${data.length} nearest of ${plural(pagination.total, 'pharmacy', 'pharmacies')}.</p>`;
  } catch (error) {
    nearbyList.innerHTML = errorState(error);
    nearbyList.querySelector('[data-retry]').addEventListener('click', loadNearby);
  }
}

// --- Contact form ---------------------------------------------------------------------
function initContactForm() {
  const form = document.getElementById('contact-form');
  const errorBox = document.getElementById('contact-error');
  const formMarkup = form.innerHTML;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const data = Object.fromEntries(new FormData(form));
    const error = form.querySelector('#contact-error') || errorBox;

    // Point at the first field that is not filled in properly.
    const invalid = [...form.elements].find((field) => field.willValidate && !field.checkValidity());
    if (invalid) {
      const label = form.querySelector(`label[for="${invalid.id}"]`).textContent;
      error.textContent = invalid.value.trim()
        ? `“${label}” is too short.`
        : `Fill in “${label}” so we can help.`;
      invalid.focus();
      return;
    }

    error.textContent = '';
    button.disabled = true;
    button.textContent = 'Sending';
    try {
      await post('/contact', data);
      form.innerHTML = html`
        <div class="contact__sent" role="status">
          ${icon('check')}
          <h3>Message sent</h3>
          <p>Thank you, ${data.name}. We will reply to ${data.contact}.</p>
          <button class="btn btn--ghost btn--small" type="button" data-again>Send another message</button>
        </div>`;
      form.querySelector('[data-again]').addEventListener('click', () => {
        form.innerHTML = formMarkup;
      });
    } catch (err) {
      error.textContent = `${err.message} Your message was not sent.`;
      button.disabled = false;
      button.textContent = 'Send message';
    }
  });
}

// --- Start ---------------------------------------------------------------------------
mountLocationBar(document.getElementById('nearby-location'));
onLocationChange(loadNearby);

loadStats();
loadCategories();
loadNearby();
initContactForm();

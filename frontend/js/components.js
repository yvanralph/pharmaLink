// Building blocks used on more than one page.

import {
  availabilityTag, directionsUrl, formatDistance, html, icon, openStatusBadge,
  packDescription, genericLine, plural, price, telUrl, timeAgo,
} from './ui.js';

// How long each route line is, compared with the furthest pharmacy in the list.
function lineLengths(distances) {
  const max = Math.max(...distances.filter((d) => d !== null && d !== undefined), 0.1);
  return distances.map((d) => (d === null || d === undefined ? 0.5 : Math.max(0.06, d / max)));
}

function routeList(location, rows) {
  return html`
    <ol class="routes">
      <li class="routes__origin">${location.label.charAt(0).toUpperCase() + location.label.slice(1)}</li>
      ${rows}
    </ol>`;
}

// Price comparison: one row per pharmacy that lists the medicine.
export function offerRoutes(offers, location) {
  const lengths = lineLengths(offers.map((offer) => offer.pharmacy.distance_km));
  const inStock = offers.filter((offer) => offer.availability !== 'out_of_stock');
  const nearest = inStock.length > 1
    ? inStock.reduce((a, b) => (b.pharmacy.distance_km < a.pharmacy.distance_km ? b : a))
    : null;

  const rows = offers.map((offer, index) => {
    const { pharmacy } = offer;
    const out = offer.availability === 'out_of_stock';
    return html`
      <li class="route ${offer.is_lowest_price ? 'route--best' : ''} ${out ? 'route--out' : ''}" style="--len: ${lengths[index].toFixed(3)}">
        <span class="route__line" aria-hidden="true"></span>
        <div class="route__body">
          <a class="route__name" href="pharmacy.html?id=${pharmacy.id}">${pharmacy.name}</a>
          <p class="route__meta">
            <span>${formatDistance(pharmacy.distance_km)} away</span>
            <span>${pharmacy.address}</span>
            ${openStatusBadge(pharmacy)}
          </p>
          <p class="route__actions">
            <a href="${directionsUrl(pharmacy, location)}" target="_blank" rel="noopener">${icon('navigation')}Directions</a>
            ${pharmacy.phone ? html`<a href="${telUrl(pharmacy.phone)}">${icon('phone')}Call ${pharmacy.phone}</a>` : ''}
          </p>
        </div>
        <div class="route__side">
          ${price(offer.price, offer.currency)}
          <div class="route__tags">
            ${offer.is_lowest_price ? html`<span class="tag tag--best">Cheapest</span>` : ''}
            ${nearest === offer ? html`<span class="tag tag--near">Nearest</span>` : ''}
            ${availabilityTag(offer.availability)}
          </div>
          <small>Updated ${timeAgo(offer.last_synced_at)}</small>
        </div>
      </li>`;
  });

  return routeList(location, rows);
}

// Nearby pharmacies: one row per pharmacy.
export function pharmacyRoutes(pharmacies, location, { compact = false } = {}) {
  const lengths = lineLengths(pharmacies.map((pharmacy) => pharmacy.distance_km));

  const rows = pharmacies.map((pharmacy, index) => html`
    <li class="route" data-pharmacy="${pharmacy.id}" style="--len: ${lengths[index].toFixed(3)}">
      <span class="route__line" aria-hidden="true"></span>
      <div class="route__body">
        <a class="route__name" href="pharmacy.html?id=${pharmacy.id}">${pharmacy.name}</a>
        <p class="route__meta">
          <span>${pharmacy.address}</span>
          ${openStatusBadge(pharmacy)}
        </p>
        ${compact ? '' : html`
          <p class="route__actions">
            <a href="${directionsUrl(pharmacy, location)}" target="_blank" rel="noopener">${icon('navigation')}Directions</a>
            ${pharmacy.phone ? html`<a href="${telUrl(pharmacy.phone)}">${icon('phone')}Call</a>` : ''}
            <a href="pharmacy.html?id=${pharmacy.id}">${icon('pill')}${plural(pharmacy.medicines_in_stock, 'medicine')} in stock</a>
          </p>`}
      </div>
      <div class="route__side">
        <span class="price">${formatDistance(pharmacy.distance_km)}</span>
        ${compact ? html`<small>${plural(pharmacy.medicines_in_stock, 'medicine')}</small>` : ''}
      </div>
    </li>`);

  return routeList(location, rows);
}

// A medicine in the catalogue.
export function medicineCard(medicine) {
  const inStock = medicine.pharmacy_count > 0;
  return html`
    <li>
      <a class="med ${medicine.requires_prescription ? 'med--rx' : ''}" href="medicine.html?id=${medicine.id}">
        <h3 class="med__name">${medicine.name}</h3>
        <p class="med__sub">${genericLine(medicine)}</p>
        <p class="med__pack">
          ${packDescription(medicine)}
        </p>
        <div class="med__foot">
          <p class="med__from">${inStock ? html`from ${price(medicine.lowest_price, medicine.currency)}` : html`<span class="tag tag--out">Out of stock everywhere</span>`}</p>
          <p class="med__where">
            ${medicine.requires_prescription ? html`<span class="tag tag--rx">Prescription needed</span><br>` : ''}
            ${inStock ? `at ${plural(medicine.pharmacy_count, 'pharmacy', 'pharmacies')}` : ''}
          </p>
        </div>
      </a>
    </li>`;
}

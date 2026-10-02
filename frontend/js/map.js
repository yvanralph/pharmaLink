// Map of pharmacies, built on Leaflet with OpenStreetMap tiles.

import * as L from '../vendor/leaflet/leaflet-src.esm.js';
import { escapeHtml, openStatus } from './ui.js';

const pharmacyIcon = L.divIcon({
  className: 'pin',
  html: '<span class="pin__shape"></span>',
  iconSize: [30, 40],
  iconAnchor: [15, 38],
  popupAnchor: [0, -36],
});

const activeIcon = L.divIcon({
  className: 'pin pin--active',
  html: '<span class="pin__shape"></span>',
  iconSize: [30, 40],
  iconAnchor: [15, 38],
  popupAnchor: [0, -36],
});

const youIcon = L.divIcon({
  className: 'pin-you',
  html: '<span></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

export function createPharmacyMap(element, { onSelect } = {}) {
  const map = L.map(element, { scrollWheelZoom: false }).setView([-1.9536, 30.0927], 13);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // Scrolling the page should not zoom the map by accident: zoom with the
  // mouse wheel only after the map has been clicked.
  map.on('click', () => map.scrollWheelZoom.enable());
  map.on('mouseout', () => map.scrollWheelZoom.disable());

  const markers = new Map();
  let youMarker = null;
  let activeId = null;
  let fitView = null; // re-applies the last "show all pharmacies" view

  // If the map was drawn while its box had no size (for example in a browser tab
  // that was still in the background), fit the view again once it gets a size.
  new ResizeObserver(() => {
    const size = map.getSize();
    const hadNoSize = size.x === 0 || size.y === 0;
    map.invalidateSize();
    if (hadNoSize && fitView) fitView();
  }).observe(element);

  function setActive(id) {
    if (activeId !== null && markers.has(activeId)) markers.get(activeId).setIcon(pharmacyIcon).setZIndexOffset(0);
    activeId = id;
    if (id !== null && markers.has(id)) markers.get(id).setIcon(activeIcon).setZIndexOffset(1000);
  }

  return {
    // Show where the visitor is.
    setLocation(location) {
      if (youMarker) youMarker.remove();
      youMarker = L.marker([location.lat, location.lng], { icon: youIcon, keyboard: false, zIndexOffset: 500 })
        .addTo(map)
        .bindTooltip(location.label.charAt(0).toUpperCase() + location.label.slice(1));
    },

    // Replace the pharmacy markers and zoom so they all fit.
    setPharmacies(pharmacies, location) {
      markers.forEach((marker) => marker.remove());
      markers.clear();
      activeId = null;

      for (const pharmacy of pharmacies) {
        const marker = L.marker([pharmacy.latitude, pharmacy.longitude], {
          icon: pharmacyIcon,
          title: pharmacy.name,
          alt: pharmacy.name,
        }).addTo(map);
        marker.bindPopup(`
          <strong>${escapeHtml(pharmacy.name)}</strong><br>
          ${escapeHtml(pharmacy.address)}<br>
          ${escapeHtml(openStatus(pharmacy).text)}<br>
          <a href="pharmacy.html?id=${encodeURIComponent(pharmacy.id)}">See its medicines</a>`);
        marker.on('click', () => {
          setActive(pharmacy.id);
          if (onSelect) onSelect(pharmacy.id);
        });
        markers.set(pharmacy.id, marker);
      }

      const points = pharmacies.map((pharmacy) => [pharmacy.latitude, pharmacy.longitude]);
      if (location) points.push([location.lat, location.lng]);
      fitView = () => {
        if (points.length === 1) map.setView(points[0], 15);
        else if (points.length > 1) map.fitBounds(points, { padding: [36, 36], maxZoom: 15 });
      };
      fitView();
    },

    // Highlight one pharmacy's marker without moving the map.
    highlight(id) {
      setActive(id);
    },

    // Highlight one pharmacy and open its popup.
    focus(id) {
      const marker = markers.get(id);
      if (!marker) return;
      setActive(id);
      map.panTo(marker.getLatLng());
      marker.openPopup();
    },
  };
}

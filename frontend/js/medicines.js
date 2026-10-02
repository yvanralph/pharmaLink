// Medicines page: browse, search and filter the catalogue.
// The filters live in the address bar (?q=...&category=...), so a search can
// be bookmarked or shared.

import { get } from './api.js';
import { medicineCard } from './components.js';
import {
  debounce, errorState, formatNumber, html, plural, queryParams, updateUrl,
} from './ui.js';

const PAGE_SIZE = 20;

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('q');
const filters = document.getElementById('filters');
const list = document.getElementById('list');
const count = document.getElementById('count');
const pager = document.getElementById('pager');

// --- State ---------------------------------------------------------------------
const params = queryParams();
const state = {
  q: params.get('q') || '',
  category: params.get('category') || '',
  prescription: ['true', 'false'].includes(params.get('prescription')) ? params.get('prescription') : '',
  in_stock: params.get('in_stock') === 'true',
  sort: ['name', 'price_asc', 'price_desc'].includes(params.get('sort')) ? params.get('sort') : 'name',
  page: Math.max(1, parseInt(params.get('page'), 10) || 1),
};

function showStateInControls() {
  searchInput.value = state.q;
  filters.elements.category.value = state.category;
  filters.elements.prescription.value = state.prescription;
  filters.elements.sort.value = state.sort;
  filters.elements.in_stock.checked = state.in_stock;
}

function hasFilters() {
  return Boolean(state.q || state.category || state.prescription || state.in_stock);
}

// --- Loading and drawing -----------------------------------------------------------
let requestId = 0;

async function load() {
  const thisRequest = requestId += 1;
  updateUrl({
    q: state.q,
    category: state.category,
    prescription: state.prescription,
    in_stock: state.in_stock ? 'true' : '',
    sort: state.sort === 'name' ? '' : state.sort,
    page: state.page > 1 ? state.page : '',
  });

  list.setAttribute('aria-busy', 'true');
  if (!list.children.length) {
    list.innerHTML = html`${Array.from({ length: 6 }, () => html`<li class="skeleton"></li>`)}`;
  }

  try {
    const result = await get('/medicines', {
      q: state.q,
      category: state.category,
      prescription: state.prescription,
      in_stock: state.in_stock ? 'true' : '',
      sort: state.sort === 'name' ? 'name' : 'price',
      order: state.sort === 'price_desc' ? 'desc' : 'asc',
      page: state.page,
      limit: PAGE_SIZE,
    });
    if (thisRequest !== requestId) return; // a newer search has started

    const { data, pagination } = result;

    // Asked for a page past the end (for example after narrowing a filter)
    if (!data.length && pagination.total > 0 && state.page > 1) {
      state.page = pagination.total_pages;
      load();
      return;
    }

    drawResults(data, pagination);
  } catch (error) {
    if (thisRequest !== requestId) return;
    count.textContent = '';
    pager.innerHTML = '';
    list.innerHTML = html`<li class="med-grid__full">${errorState(error)}</li>`;
    list.querySelector('[data-retry]').addEventListener('click', load);
  } finally {
    if (thisRequest === requestId) list.removeAttribute('aria-busy');
  }
}

function drawResults(medicines, pagination) {
  if (!medicines.length) {
    count.textContent = '';
    pager.innerHTML = '';
    list.innerHTML = html`
      <li class="med-grid__full">
        <div class="state">
          <h3>${state.q ? `No medicine matches “${state.q}”` : 'No medicine matches these filters'}</h3>
          <p>${state.q
            ? 'Check the spelling, or try the generic name: paracetamol instead of Panadol, for example.'
            : 'Try removing a filter to see more medicines.'}</p>
          ${hasFilters() ? html`<button class="btn btn--small" type="button" data-clear>Show all medicines</button>` : ''}
        </div>
      </li>`;
    list.querySelector('[data-clear]')?.addEventListener('click', clearFilters);
    return;
  }

  const first = (pagination.page - 1) * pagination.limit + 1;
  const last = first + medicines.length - 1;
  count.innerHTML = html`
    Showing <strong>${first} to ${last}</strong> of <strong>${plural(pagination.total, 'medicine')}</strong>
    ${state.q ? html` matching <strong>“${state.q}”</strong>` : ''}
    ${state.category ? html` in <strong>${state.category}</strong>` : ''}`;

  list.innerHTML = html`${medicines.map(medicineCard)}`;

  pager.innerHTML = pagination.total_pages > 1 ? html`
    <button class="btn btn--ghost btn--small" type="button" data-page="${pagination.page - 1}" ${pagination.page <= 1 ? 'disabled' : ''}>Previous</button>
    <span>Page ${formatNumber(pagination.page)} of ${formatNumber(pagination.total_pages)}</span>
    <button class="btn btn--ghost btn--small" type="button" data-page="${pagination.page + 1}" ${pagination.page >= pagination.total_pages ? 'disabled' : ''}>Next</button>` : '';
}

function clearFilters() {
  Object.assign(state, { q: '', category: '', prescription: '', in_stock: false, page: 1 });
  showStateInControls();
  load();
}

// --- Events ----------------------------------------------------------------------
searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  state.q = searchInput.value.trim();
  state.page = 1;
  load();
});

// Results update while typing, after a short pause.
searchInput.addEventListener('input', debounce(() => {
  state.q = searchInput.value.trim();
  state.page = 1;
  load();
}, 300));

filters.addEventListener('change', () => {
  state.category = filters.elements.category.value;
  state.prescription = filters.elements.prescription.value;
  state.sort = filters.elements.sort.value;
  state.in_stock = filters.elements.in_stock.checked;
  state.page = 1;
  load();
});

filters.addEventListener('submit', (event) => event.preventDefault());

pager.addEventListener('click', (event) => {
  const button = event.target.closest('[data-page]');
  if (!button) return;
  state.page = Number(button.dataset.page);
  load();
  document.querySelector('.toolbar').scrollIntoView();
});

// --- Start -----------------------------------------------------------------------
async function loadCategories() {
  try {
    const { data } = await get('/categories');
    const select = filters.elements.category;
    for (const category of data) {
      select.add(new Option(`${category.name} (${category.medicine_count})`, category.name));
    }
    // A category from the address bar that the list does not have (different capitals, say)
    if (state.category && select.value !== state.category) {
      const match = data.find((c) => c.name.toLowerCase() === state.category.toLowerCase());
      if (match) state.category = match.name;
    }
    select.value = state.category;
  } catch {
    // The page still works without the category list.
  }
}

showStateInControls();
loadCategories();
load();

// Medicine search box with live suggestions.
// Works on any <form class="search"> that contains an <input name="q">.

import { get } from './api.js';
import { debounce, html, packDescription } from './ui.js';

let counter = 0;

export function initSearch(form) {
  const input = form.querySelector('input[name="q"]');
  if (!input) return;

  const listId = `search-list-${counter += 1}`;
  const list = document.createElement('ul');
  list.className = 'search__list';
  list.id = listId;
  list.setAttribute('role', 'listbox');
  list.hidden = true;
  form.append(list);

  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', listId);
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('autocomplete', 'off');

  let options = [];
  let active = -1;
  let requestId = 0;

  function close() {
    list.hidden = true;
    active = -1;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  }

  function setActive(index) {
    options.forEach((option, i) => option.setAttribute('aria-selected', String(i === index)));
    active = index;
    if (index >= 0) input.setAttribute('aria-activedescendant', options[index].id);
    else input.removeAttribute('aria-activedescendant');
  }

  const suggest = debounce(async () => {
    const text = input.value.trim();
    if (text.length < 2) {
      close();
      return;
    }
    const thisRequest = requestId += 1;
    let result;
    try {
      result = await get('/medicines', { q: text, limit: 6 });
    } catch {
      close();
      return;
    }
    // Ignore answers that arrive after the visitor has typed something newer.
    if (thisRequest !== requestId || document.activeElement !== input) return;

    const allUrl = `medicines.html?q=${encodeURIComponent(text)}`;
    list.innerHTML = html`
      ${result.data.map((medicine, i) => html`
        <li role="none">
          <a class="search__option" role="option" id="${listId}-${i}" href="medicine.html?id=${medicine.id}">
            <span>${medicine.name}</span>
            <small>${packDescription(medicine)}</small>
          </a>
        </li>`)}
      <li role="none">
        <a class="search__option search__option--all" role="option" id="${listId}-all" href="${allUrl}">
          ${result.data.length ? `See all results for “${text}”` : `No medicine matches “${text}”. Browse all medicines`}
        </a>
      </li>`;
    if (!result.data.length) list.querySelector('a').href = 'medicines.html';
    options = [...list.querySelectorAll('[role="option"]')];
    active = -1;
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }, 200);

  input.addEventListener('input', suggest);

  input.addEventListener('keydown', (event) => {
    if (list.hidden) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((active + 1) % options.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(active <= 0 ? options.length - 1 : active - 1);
    } else if (event.key === 'Enter' && active >= 0) {
      event.preventDefault();
      window.location.href = options[active].href;
    } else if (event.key === 'Escape') {
      close();
    }
  });

  // Close when focus or a click moves outside the search box.
  document.addEventListener('click', (event) => {
    if (!form.contains(event.target)) close();
  });
  form.addEventListener('focusout', (event) => {
    if (!form.contains(event.relatedTarget)) close();
  });
}

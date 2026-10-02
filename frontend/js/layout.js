// Header and footer shared by every page.
// Each page has <header id="site-header"> and <footer id="site-footer">, and
// <body data-page="home|medicines|pharmacies"> to highlight the current page.

import { initSearch } from './search.js';
import { html, icon } from './ui.js';

const NAV = [
  { key: 'home', label: 'Home', href: 'index.html' },
  { key: 'medicines', label: 'Medicines', href: 'medicines.html' },
  { key: 'pharmacies', label: 'Pharmacies', href: 'pharmacies.html' },
  { key: 'about', label: 'About', href: 'index.html#about' },
  { key: 'contact', label: 'Contact', href: 'index.html#contact' },
];

const LOGO = html`
  <svg class="logo__mark" viewBox="0 0 40 24" aria-hidden="true">
    <path d="M6 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="6" cy="12" r="5" fill="#38bdf8"/>
    <rect x="18" y="1" width="22" height="22" rx="6" fill="currentColor"/>
    <path d="M29 7v10M24 12h10" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
  </svg>`;

function renderHeader(header, page) {
  // Pages with their own large search box set <body data-header-search="off">.
  const showSearch = document.body.dataset.headerSearch !== 'off';

  header.className = 'site-header';
  header.innerHTML = html`
    <div class="container site-header__inner">
      <a class="logo" href="index.html" aria-label="PharmaLink home">${LOGO}PharmaLink</a>
      ${showSearch ? html`
        <form class="search header-search" action="medicines.html" role="search">
          ${icon('search', 'search__icon')}
          <label class="visually-hidden" for="header-q">Search medicines</label>
          <input class="search__input" id="header-q" type="search" name="q" placeholder="Search medicines">
        </form>` : ''}
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Menu">
        ${icon('menu')}
      </button>
      <nav class="nav" id="site-nav" aria-label="Main">
        ${NAV.map((item) => html`
          <a class="nav__link" href="${item.href}" ${item.key === page ? html`aria-current="page"` : ''}>${item.label}</a>`)}
      </nav>
    </div>`;

  const toggle = header.querySelector('.nav-toggle');
  toggle.addEventListener('click', () => {
    const open = header.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  // Close the mobile menu after choosing a link (matters for #about / #contact).
  header.querySelector('.nav').addEventListener('click', () => {
    header.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  });

  const searchForm = header.querySelector('.search');
  if (searchForm) initSearch(searchForm);
}

function renderFooter(footer) {
  footer.className = 'site-footer';
  footer.innerHTML = html`
    <div class="container">
      <div class="site-footer__top">
        <a class="logo" href="index.html">${LOGO}PharmaLink</a>
        <nav class="site-footer__nav" aria-label="Footer">
          ${NAV.map((item) => html`<a href="${item.href}">${item.label}</a>`)}
        </nav>
      </div>
      <div class="site-footer__bottom">
        <p>PharmaLink shows what pharmacies have in stock. It does not sell or deliver medicines.</p>
        <p>© ${new Date().getFullYear()} PharmaLink, Kigali</p>
      </div>
    </div>`;
}

const page = document.body.dataset.page || '';
const header = document.getElementById('site-header');
const footer = document.getElementById('site-footer');
if (header) renderHeader(header, page);
if (footer) renderFooter(footer);

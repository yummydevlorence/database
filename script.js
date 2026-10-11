/* =====================================================
   Quazar — app.js
   Front-end prototype. Everything is saved in localStorage.
   Later, replace the "DATA LAYER" parts with real API calls
   to your backend (Flask / Django / Laravel + database).
   ===================================================== */
'use strict';

/* ---------- Helpers ---------- */
const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const money = n => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const esc  = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DAY = 864e5;
const dkey = d => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const fmtDate = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const PRICE_REDUCTION_KEY = 'nx_price_reduction_20_applied';
const savedProducts = load('nx_products', null);
const savedOrders = load('nx_orders', []);
const savedReviews = load('nx_reviews', []);
const pricesAlreadyReduced = localStorage.getItem(PRICE_REDUCTION_KEY) === 'true';
const reducedPrice = price => Math.round(Number(price) * 80) / 100;
const AUTH_ROLES = ['customer', 'seller', 'rider'];
const normalizeRole = value => AUTH_ROLES.includes(value) ? value : 'customer';
const roleLabel = value => ({ customer: 'Customer', seller: 'Seller', rider: 'Rider', admin: 'Admin' }[value] || 'Customer');

/* ---------- Config ---------- */
const FREE_SHIP = 2000, SHIP_FEE = 99, EXPRESS_FEE = 150;
const PROMOS = {
  SAVE10:   { pct: .10, label: '10% off your order' },
  WELCOME5: { pct: .05, label: '5% off your order' },
  FREESHIP: { ship: true, label: 'Free shipping' }
};
const CAT_COLORS = {
  'Electronics': ['#718a78', '#b7c2a4'], 'Fashion': ['#b77962', '#d6b69b'], 'Home & Living': ['#718574', '#b4bf9e'],
  'Beauty': ['#b87976', '#d7aaa0'], 'Sports': ['#71899a', '#b6c5c0'], 'Toys & Hobbies': ['#b6925f', '#d5c18a']
};
const catColor = c => CAT_COLORS[c] || ['#718a78', '#b7c2a4'];
const ORDER_STATUSES = ['Packaging', 'Delivered'];
const ICON_HEART = '<svg class="ic" viewBox="0 0 24 24"><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z"/></svg>';

/* ---------- Default catalog (demo) ---------- */
const DEFAULT_PRODUCTS = [
  { id: 1,  name: 'Wireless Noise-Cancelling Headphones', cat: 'Electronics', price: 3499, old: 4999, stock: 24, rating: 4.7, reviews: 312, sold: 540, emoji: '🎧', isNew: false, desc: 'Immersive sound with active noise cancelling, 30-hour battery life and ultra-soft ear cushions for all-day comfort.' },
  { id: 2,  name: 'Smart Watch Series X', cat: 'Electronics', price: 2899, old: 3499, stock: 8, rating: 4.5, reviews: 188, sold: 420, emoji: '⌚', isNew: true, desc: 'Track heart rate, sleep and workouts. Bright AMOLED display, water resistant, 7-day battery.' },
  { id: 3,  name: 'RGB Mechanical Keyboard', cat: 'Electronics', price: 2199, old: 0, stock: 35, rating: 4.6, reviews: 256, sold: 310, emoji: '⌨️', isNew: false, desc: 'Hot-swappable tactile switches, per-key RGB lighting and a sturdy aluminium frame.' },
  { id: 4,  name: 'Portable Bluetooth Speaker', cat: 'Electronics', price: 1299, old: 1799, stock: 52, rating: 4.4, reviews: 145, sold: 380, emoji: '🔊', isNew: false, desc: 'Powerful 360° sound, IPX7 waterproof and 12 hours of playtime. Perfect for trips.' },
  { id: 5,  name: 'Classic Denim Jacket', cat: 'Fashion', price: 1599, old: 2200, stock: 18, rating: 4.3, reviews: 97, sold: 150, emoji: '🧥', isNew: false, desc: 'Timeless wash, durable stitching and a relaxed fit that goes with everything.' },
  { id: 6,  name: 'Cloud Running Sneakers', cat: 'Sports', price: 2499, old: 0, stock: 40, rating: 4.8, reviews: 410, sold: 620, emoji: '👟', isNew: true, desc: 'Lightweight breathable mesh with responsive cushioning for long-distance comfort.' },
  { id: 7,  name: 'Minimalist Backpack', cat: 'Fashion', price: 999, old: 1299, stock: 60, rating: 4.5, reviews: 203, sold: 290, emoji: '🎒', isNew: false, desc: 'Water-resistant fabric, padded 15" laptop sleeve and hidden anti-theft pocket.' },
  { id: 8,  name: 'Aviator Sunglasses', cat: 'Fashion', price: 699, old: 0, stock: 5, rating: 4.2, reviews: 76, sold: 210, emoji: '🕶️', isNew: false, desc: 'Polarized UV400 lenses in a lightweight metal frame. Includes hard case.' },
  { id: 9,  name: 'Ceramic Coffee Set', cat: 'Home & Living', price: 899, old: 1199, stock: 30, rating: 4.6, reviews: 132, sold: 175, emoji: '☕', isNew: false, desc: 'Handcrafted matte ceramic set: 2 mugs, 2 saucers and a serving tray.' },
  { id: 10, name: 'LED Desk Lamp', cat: 'Home & Living', price: 749, old: 0, stock: 44, rating: 4.4, reviews: 88, sold: 140, emoji: '💡', isNew: false, desc: 'Touch dimming, 3 colour temperatures and a USB charging port. Easy on the eyes.' },
  { id: 11, name: 'Aroma Diffuser', cat: 'Home & Living', price: 1099, old: 1499, stock: 3, rating: 4.7, reviews: 164, sold: 205, emoji: '🌿', isNew: true, desc: 'Ultrasonic mist with soft ambient light and auto shut-off. Calm your space.' },
  { id: 12, name: 'Vitamin C Glow Serum', cat: 'Beauty', price: 599, old: 799, stock: 70, rating: 4.6, reviews: 520, sold: 880, emoji: '🧴', isNew: false, desc: 'Brightening serum with 15% vitamin C and hyaluronic acid for radiant skin.' },
  { id: 13, name: 'Matte Lipstick Set', cat: 'Beauty', price: 849, old: 0, stock: 33, rating: 4.5, reviews: 301, sold: 410, emoji: '💄', isNew: false, desc: 'Six long-wear matte shades that stay comfortable and smudge-proof all day.' },
  { id: 14, name: 'Yoga Mat Pro', cat: 'Sports', price: 1099, old: 1399, stock: 26, rating: 4.7, reviews: 178, sold: 260, emoji: '🧘', isNew: false, desc: 'Extra-thick non-slip mat with alignment lines and a free carry strap.' },
  { id: 15, name: 'Adjustable Dumbbells', cat: 'Sports', price: 3299, old: 3999, stock: 12, rating: 4.6, reviews: 92, sold: 110, emoji: '🏋️', isNew: false, desc: 'Replaces 8 weights: adjust from 2 to 24 kg with a quick-turn dial.' },
  { id: 16, name: 'Creative Building Blocks Set', cat: 'Toys & Hobbies', price: 1899, old: 2399, stock: 21, rating: 4.8, reviews: 219, sold: 245, emoji: '🧩', isNew: true, desc: '1,000+ colourful pieces that spark imagination. Compatible with major brands.' },
  { id: 17, name: 'Remote Control Racer', cat: 'Toys & Hobbies', price: 1499, old: 0, stock: 15, rating: 4.3, reviews: 67, sold: 98, emoji: '🚗', isNew: false, desc: 'Fast 2.4GHz RC car with shock absorbers and a rechargeable battery.' },
  { id: 18, name: 'Scented Candle Trio', cat: 'Home & Living', price: 549, old: 0, stock: 80, rating: 4.5, reviews: 143, sold: 300, emoji: '🕯️', isNew: false, desc: 'Soy-wax candles in lavender, vanilla and sandalwood. 40 hours burn time each.' }
];
const PRODUCT_IMAGES = {
  1: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  2: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
  3: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
  4: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=80',
  5: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
  6: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
  7: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
  8: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80',
  9: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=600&q=80',
  10: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80',
  11: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80',
  12: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=600&q=80',
  13: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80',
  14: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
  15: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80',
  16: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=600&q=80',
  17: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
  18: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=600&q=80'
};
const productImage = p => p.image || PRODUCT_IMAGES[p.id] || '';

/* =====================================================
   STATE  (DATA LAYER — swap with API calls later)
   ===================================================== */
const state = {
  products: savedProducts
    ? (pricesAlreadyReduced ? savedProducts : savedProducts.map(p => ({ ...p, price: reducedPrice(p.price) })))
    : DEFAULT_PRODUCTS.map(p => ({ ...p, price: reducedPrice(p.price) })),
  cart:     load('nx_cart', []),
  wishlist: load('nx_wish', []),
  orders:   savedOrders.map(order => ({
    ...order,
    status: ORDER_STATUSES.includes(order.status) ? order.status : 'Packaging'
  })),
  reviews:  savedReviews,
  users:    load('nx_users', []),
  user:     load('nx_user', null),
  recent:   load('nx_recent', []),
  promo:    load('nx_promo', null),
  extra:    load('nx_extra', {}),          // real units sold per product per day (adds to demo history)
  filters:  { q: '', cat: 'All', sort: 'featured', maxPrice: Infinity, minRating: 0, inStock: false },
  visible: 9,
  view: 'shop'
};
const seedDemoAccounts = () => {
  const defaults = [
    { name: 'Quazar Customer', email: 'customer@nexa.com', pass: 'quazar123', role: 'customer', status: 'approved', provider: 'email' },
    { name: 'Nexa Seller', email: 'seller@nexa.com', pass: 'seller123', role: 'seller', status: 'pending', provider: 'email', shopName: 'Nexa Goods', businessAddress: '123 Market Street, Makati' },
    { name: 'Rider One', email: 'rider@nexa.com', pass: 'rider123', role: 'rider', status: 'pending', provider: 'email', vehicleType: 'Motorbike', plateNumber: 'ABC-1234' },
    { name: 'quazaradmin', email: 'admin@nexa.com', pass: 'quazar321', role: 'admin', status: 'approved', provider: 'email' }
  ];

  const seeded = [...state.users];
  let changed = false;

  defaults.forEach(account => {
    const existing = seeded.find(user => user.email === account.email);
    if (existing) {
      const normalized = {
        ...account,
        name: existing.name || account.name,
        pass: existing.pass || account.pass,
        role: normalizeRole(existing.role || account.role),
        status: existing.status || account.status,
        provider: existing.provider || account.provider
      };
      const hasChanged = Object.keys(normalized).some(key => existing[key] !== normalized[key]);
      if (hasChanged) {
        Object.assign(existing, normalized);
        changed = true;
      }
      return;
    }
    seeded.push({ ...account });
    changed = true;
  });

  if (changed) {
    state.users = seeded;
    persist.users();
  }
};

const getP = id => state.products.find(p => p.id === +id);
state.cart = state.cart.filter(l => getP(l.id));
state.wishlist = state.wishlist.filter(id => getP(id));

const persist = {
  products: () => save('nx_products', state.products),
  cart: () => save('nx_cart', state.cart),
  wish: () => save('nx_wish', state.wishlist),
  orders: () => save('nx_orders', state.orders),
  reviews: () => save('nx_reviews', state.reviews),
  users: () => save('nx_users', state.users),
  user: () => save('nx_user', state.user),
  recent: () => save('nx_recent', state.recent),
  promo: () => save('nx_promo', state.promo),
  extra: () => save('nx_extra', state.extra)
};
seedDemoAccounts();
if (state.user?.email === 'admin@nexa.com' && state.user.name !== 'quazaradmin') {
  state.user.name = 'quazaradmin';
  persist.user();
}
if (savedOrders.some((order, index) => order.status !== state.orders[index].status)) persist.orders();
if (!pricesAlreadyReduced) {
  if (savedProducts) persist.products();
  localStorage.setItem(PRICE_REDUCTION_KEY, 'true');
}

/* =====================================================
   UI UTILITIES
   ===================================================== */
function toast(msg, type = 'ok') {
  const icon = { ok: '✅', warn: '⚠️', err: '⛔' }[type] || '✅';
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.innerHTML = `<span>${icon}</span><p>${esc(msg)}</p>`;
  $('#toasts').append(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 2800);
}
function openModal(id) { $('#' + id).classList.add('open'); document.body.classList.add('locked'); }
function closeModal(id) {
  $('#' + id).classList.remove('open');
  if (id === 'modalCheckout') restoreBuyNowCart();
  if (!$('.modal.open') && !$('#cartDrawer.open')) document.body.classList.remove('locked');
}
function closeAllModals() {
  if ($('#modalCheckout').classList.contains('open')) restoreBuyNowCart();
  $$('.modal.open').forEach(m => m.classList.remove('open'));
  closeCart(); document.body.classList.remove('locked');
}
function openCart() { renderCart(); $('#cartDrawer').classList.add('open'); $('#overlay').classList.add('show'); document.body.classList.add('locked'); }
function closeCart() { $('#cartDrawer').classList.remove('open'); $('#overlay').classList.remove('show'); if (!$('.modal.open')) document.body.classList.remove('locked'); }
function bump(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
function fly(from, emoji) {
  const a = from.getBoundingClientRect(), b = $('#cartBtn').getBoundingClientRect();
  const n = document.createElement('div');
  n.className = 'fly'; n.textContent = emoji;
  n.style.left = (a.left + a.width / 2 - 16) + 'px'; n.style.top = (a.top + a.height / 2 - 16) + 'px';
  document.body.append(n);
  requestAnimationFrame(() => { n.style.transform = `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(.3)`; n.style.opacity = '.15'; });
  setTimeout(() => n.remove(), 800);
}
const stars = r => `<span class="stars" style="--r:${(r / 5) * 100}%" aria-label="${r} out of 5"></span>`;

/* ---------- Theme ---------- */
function setTheme(t) {
  document.documentElement.classList.add('theme-anim');
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('nx_theme', t);
  setTimeout(() => document.documentElement.classList.remove('theme-anim'), 450);
  setTimeout(drawChart, 60);
}
$('#themeToggle').addEventListener('click', () => {
  setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
});

/* =====================================================
   PRODUCTS: filter, sort, render
   ===================================================== */
const priceMax = () => Math.max(500, Math.ceil(Math.max(...state.products.map(p => p.price)) / 100) * 100);
const discountOf = p => p.old > p.price ? Math.round((1 - p.price / p.old) * 100) : 0;

function getFiltered() {
  const f = state.filters;
  const list = state.products.filter(p =>
    (f.cat === 'All' || p.cat === f.cat) &&
    p.price <= f.maxPrice && p.rating >= f.minRating &&
    (!f.inStock || p.stock > 0) &&
    (!f.q || (p.name + ' ' + p.cat + ' ' + p.desc).toLowerCase().includes(f.q))
  );
  const sorters = {
    featured: (a, b) => (b.rating * Math.log(b.reviews + 2)) - (a.rating * Math.log(a.reviews + 2)),
    best: (a, b) => b.sold - a.sold,
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    rating: (a, b) => b.rating - a.rating,
    discount: (a, b) => discountOf(b) - discountOf(a),
    newest: (a, b) => b.id - a.id
  };
  return list.sort(sorters[f.sort]);
}

function cardHTML(p, i = 0) {
  const [g1, g2] = catColor(p.cat);
  const off = discountOf(p);
  const tags = [];
  if (off) tags.push(`<span class="tag sale">-${off}%</span>`);
  if (p.isNew) tags.push('<span class="tag new">New</span>');
  if (p.stock === 0) tags.push('<span class="tag out">Sold out</span>');
  else if (p.stock <= 10) tags.push(`<span class="tag low">Only ${p.stock} left</span>`);
  else if (p.sold >= 400) tags.push('<span class="tag hot">🔥 Best seller</span>');
  const wished = state.wishlist.includes(p.id);
  return `
  <article class="card" style="--g1:${g1};--g2:${g2};--i:${Math.min(i, 12)}">
    <button class="card-media" data-action="quick" data-id="${p.id}" aria-label="Quick view ${esc(p.name)}">
      <img class="product-image" src="${esc(productImage(p))}" alt="">
      <span class="quick-hint">👁 Quick view</span>
      <span class="tags">${tags.join('')}</span>
    </button>
    <button class="wish-btn ${wished ? 'on' : ''}" data-action="wish" data-id="${p.id}" aria-label="Add to wishlist">${ICON_HEART}</button>
    <div class="card-body">
      <span class="card-cat">${esc(p.cat)}</span>
      <button class="card-title" data-action="quick" data-id="${p.id}">${esc(p.name)}</button>
      <div class="rating">${stars(p.rating)} <span>${p.rating.toFixed(1)} (${p.reviews})</span></div>
      <div class="price-row"><span class="price">${money(p.price)}</span>${p.old > p.price ? `<span class="old">${money(p.old)}</span>` : ''}</div>
      ${p.stock === 0
        ? `<button class="btn ghost" data-action="notify" data-id="${p.id}">🔔 Notify me</button>`
        : `<div class="product-buy-actions"><button class="btn primary" data-action="add" data-id="${p.id}">Add to cart</button><button class="btn ghost" data-action="buyNow" data-id="${p.id}">Buy now</button></div>`}
    </div>
  </article>`;
}

function renderFilters() {
  const cats = ['All', ...new Set(state.products.map(p => p.cat))];
  const countOf = c => c === 'All' ? state.products.length : state.products.filter(p => p.cat === c).length;
  $('#catList').innerHTML = cats.map(c =>
    `<button class="cat-item ${state.filters.cat === c ? 'active' : ''}" data-action="cat" data-cat="${esc(c)}"><span>${esc(c)}</span><em>${countOf(c)}</em></button>`).join('');
  $('#catChips').innerHTML = cats.map(c =>
    `<button class="chip ${state.filters.cat === c ? 'active' : ''}" data-action="cat" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
  const max = priceMax(), r = $('#priceRange');
  r.max = max; r.value = Math.min(state.filters.maxPrice, max);
  $('#priceLabel').textContent = state.filters.maxPrice >= max ? 'Any' : '≤ ' + money(state.filters.maxPrice).replace('.00', '');
  $$('#rateChips .chip').forEach(c => c.classList.toggle('active', +c.dataset.rate === state.filters.minRating));
  $('#inStock').checked = state.filters.inStock;
  $('#sortSelect').value = state.filters.sort;
}

function renderGrid() {
  const list = getFiltered();
  const vis = list.slice(0, state.visible);
  $('#resultCount').textContent = `${list.length} product${list.length !== 1 ? 's' : ''} found`;
  $('#productGrid').innerHTML = vis.length ? vis.map(cardHTML).join('') : `
    <div class="empty"><div class="big">🔍</div><h3>No products found</h3><p>Try a different keyword or clear your filters.</p>
    <button class="btn primary" data-action="resetFilters">Reset filters</button></div>`;
  $('#loadMore').hidden = list.length <= state.visible;
}

function showSkeleton() {
  $('#productGrid').innerHTML = Array.from({ length: 6 }, () =>
    '<div class="skeleton"><div class="sk-media"></div><div class="sk-line"></div><div class="sk-line s"></div></div>').join('');
}

function renderFlash() {
  const top = [...state.products].filter(p => p.stock > 0).sort((a, b) => discountOf(b) - discountOf(a)).slice(0, 4);
  $('#flashRow').innerHTML = top.map(p => {
    const [g1, g2] = catColor(p.cat);
    const pct = Math.min(100, Math.round(p.sold / (p.sold + p.stock) * 100));
    return `<button class="flash-card" style="--g1:${g1};--g2:${g2}" data-action="quick" data-id="${p.id}">
      <span class="flash-off">-${discountOf(p)}%</span>
      <span class="flash-emoji"><img src="${esc(productImage(p))}" alt=""></span>
      <span style="flex:1;min-width:0"><h4>${esc(p.name)}</h4>
        <span class="price">${money(p.price)}</span><s>${money(p.old)}</s>
        <div class="meter"><i style="width:${pct}%"></i></div><small>${pct}% claimed</small></span>
    </button>`;
  }).join('');
}

let currentBundle = [];
function renderBundleCategories() {
  const select = $('#bundleCategory');
  const selected = select.value || 'all';
  const categories = [...new Set(state.products.map(p => p.cat))];
  select.innerHTML = '<option value="all">Any category</option>' +
    categories.map(cat => `<option value="${esc(cat)}">${esc(cat)}</option>`).join('');
  select.value = categories.includes(selected) ? selected : 'all';
}

function buildBundle() {
  const budgetInput = $('#bundleBudget');
  const budget = Number(budgetInput.value);
  const focus = $('#bundleCategory').value;
  const output = $('#bundleResult');
  if (!Number.isFinite(budget) || budget <= 0 || budget > 100000) {
    output.innerHTML = '<p class="bundle-message error">Enter a budget between ₱1 and ₱100,000 to build a bundle.</p>';
    budgetInput.focus();
    return;
  }

  const candidates = state.products.filter(p => p.stock > 0 && p.price <= budget);
  if (!candidates.length) {
    currentBundle = [];
    output.innerHTML = '<p class="bundle-message">No in-stock products fit that budget yet. Try raising your budget.</p>';
    return;
  }

  let best = [], bestScore = -Infinity;
  const scoreBundle = (items, spend) => {
    const categories = new Set(items.map(p => p.cat));
    const quality = items.reduce((sum, p) =>
      sum + p.rating * 10 + Math.log1p(p.sold) + Math.min(p.stock, 20) / 50, 0);
    const categoryFocus = focus === 'all' ? 0 : items.filter(p => p.cat === focus).length * 8;
    return quality + categories.size * 8 + categoryFocus + spend / budget * 20;
  };
  const search = (start, items, spend) => {
    if (items.length) {
      const score = scoreBundle(items, spend);
      if (score > bestScore) { best = [...items]; bestScore = score; }
    }
    if (items.length === 4) return;
    for (let i = start; i < candidates.length; i++) {
      const product = candidates[i];
      if (spend + product.price <= budget) search(i + 1, [...items, product], spend + product.price);
    }
  };
  search(0, [], 0);

  currentBundle = best.map(p => p.id);
  const total = best.reduce((sum, p) => sum + p.price, 0);
  output.innerHTML = `
    <div class="bundle-result-head">
      <div><b>Your ${best.length}-item bundle</b><span class="muted"> · ${money(total)} total · ${money(budget - total)} left</span></div>
      <button class="btn primary sm" data-action="addBundle">Add bundle to cart</button>
    </div>
    <div class="bundle-items">${best.map(p => {
      const reason = focus !== 'all' && p.cat === focus ? `Matches ${esc(focus)} focus`
        : p.rating >= 4.7 ? 'Top rated'
          : p.sold >= 300 ? 'Popular pick' : 'In stock & within budget';
      return `<article class="bundle-item">
        <img src="${esc(productImage(p))}" alt="">
        <div><small>${esc(p.cat)} · ${reason}</small><b>${esc(p.name)}</b><span>${money(p.price)} · ★ ${p.rating.toFixed(1)}</span></div>
        <button class="btn ghost sm" data-action="add" data-id="${p.id}">Add</button>
      </article>`;
    }).join('')}</div>
    <p class="bundle-explanation">Picked for strong ratings, available stock${focus !== 'all' ? `, and your ${esc(focus)} focus` : ''}—while keeping the total under budget.</p>`;
}

function renderRecent() {
  const items = state.recent.map(getP).filter(Boolean).slice(0, 4);
  $('#recentWrap').hidden = !items.length;
  $('#recentGrid').innerHTML = items.map((p, i) => cardHTML(p, i)).join('');
}

function renderWishlist() {
  const items = state.wishlist.map(getP).filter(Boolean);
  $('#wishGrid').innerHTML = items.length ? items.map(cardHTML).join('') : `
    <div class="empty"><div class="big">💜</div><h3>Your wishlist is empty</h3><p>Tap the heart on any product to save it here.</p>
    <button class="btn primary" data-nav="shop">Browse products</button></div>`;
}

/* ---------- Countdown (to midnight) ---------- */
function tickCountdown() {
  const end = new Date(); end.setHours(24, 0, 0, 0);
  const s = Math.max(0, Math.floor((end - new Date()) / 1000));
  const p = n => String(n).padStart(2, '0');
  $('#countdown').textContent = `${p(Math.floor(s / 3600))}:${p(Math.floor(s % 3600 / 60))}:${p(s % 60)}`;
}

/* =====================================================
   WISHLIST + CART
   ===================================================== */
function toggleWish(id) {
  id = +id;
  const i = state.wishlist.indexOf(id);
  if (i > -1) { state.wishlist.splice(i, 1); toast('Removed from wishlist', 'warn'); }
  else { state.wishlist.push(id); toast('Saved to wishlist 💜'); }
  persist.wish();
  $$(`.wish-btn[data-id="${id}"]`).forEach(b => { b.classList.toggle('on', state.wishlist.includes(id)); b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); });
  updateBadges();
  if (state.view === 'wishlist') renderWishlist();
}

function addToCart(id, qty = 1, srcEl = null) {
  const p = getP(id);
  if (!p) return;
  if (p.stock <= 0) return toast('Sorry, this item is sold out', 'err');
  const line = state.cart.find(l => l.id === p.id);
  const have = line ? line.qty : 0;
  if (have + qty > p.stock) return toast(`Only ${p.stock} in stock`, 'warn');
  if (line) line.qty += qty; else state.cart.push({ id: p.id, qty });
  persist.cart();
  updateBadges(); renderCart();
  if (srcEl) fly(srcEl, p.emoji);
  toast(`${p.emoji} ${p.name} added to cart`);
}

function totals(extraShip = 0) {
  const sub = state.cart.reduce((s, l) => s + (getP(l.id)?.price || 0) * l.qty, 0);
  const pr = PROMOS[state.promo];
  const disc = pr?.pct ? sub * pr.pct : 0;
  const baseShip = sub === 0 ? 0 : (sub - disc >= FREE_SHIP || pr?.ship ? 0 : SHIP_FEE);
  const ship = sub === 0 ? 0 : baseShip + extraShip;
  return { sub, disc, ship, total: sub - disc + ship, count: state.cart.reduce((s, l) => s + l.qty, 0) };
}

function updateBadges() {
  const c = totals().count;
  const cb = $('#cartCount'), wb = $('#wishCount');
  const prev = +cb.textContent || 0;
  cb.textContent = c; cb.hidden = !c; if (c !== prev) bump(cb);
  wb.textContent = state.wishlist.length; wb.hidden = !state.wishlist.length;
  $('#cartHeadCount').textContent = c ? `(${c})` : '';
}

function renderCart() {
  const box = $('#cartItems'), foot = $('#cartFoot');
  if (!state.cart.length) {
    box.innerHTML = '<div class="cart-empty"><div class="big">🛒</div><h3>Your cart is empty</h3><p>Looks like you haven\'t added anything yet.</p><br><button class="btn primary" data-action="closeCart" data-nav="shop">Start shopping</button></div>';
    foot.innerHTML = '';
    return;
  }
  box.innerHTML = state.cart.map(l => {
    const p = getP(l.id), [g1, g2] = catColor(p.cat);
    return `<div class="cart-item" style="--g1:${g1};--g2:${g2}">
      <div class="ci-emoji"><img src="${esc(productImage(p))}" alt=""></div>
      <div class="ci-info">
        <h4>${esc(p.name)}</h4>
        <span class="price">${money(p.price)}</span>
        <div class="ci-row">
          <div class="qty"><button data-action="dec" data-id="${p.id}" aria-label="Decrease">−</button><span>${l.qty}</span><button data-action="inc" data-id="${p.id}" aria-label="Increase">+</button></div>
          <button class="rm" data-action="remove" data-id="${p.id}">Remove</button>
        </div>
      </div></div>`;
  }).join('');

  const t = totals();
  const left = Math.max(0, FREE_SHIP - (t.sub - t.disc));
  const pct = Math.min(100, (t.sub - t.disc) / FREE_SHIP * 100);
  const pr = PROMOS[state.promo];
  foot.innerHTML = `
    <div class="ship-note">${left > 0 && !pr?.ship ? `Add <b>${money(left)}</b> more for free shipping 🚚` : '🎉 You unlocked <b>free shipping</b>!'}
      <div class="meter"><i style="width:${pr?.ship ? 100 : pct}%"></i></div></div>
    ${state.promo
      ? `<div class="promo-applied"><span>🏷️ ${esc(state.promo)} — ${esc(pr.label)}</span><button class="rm" data-action="removePromo">Remove</button></div>`
      : `<div class="promo"><input id="promoInput" placeholder="Promo code" maxlength="12"><button class="btn ghost" data-action="applyPromo">Apply</button></div>`}
    <div class="sum-row"><span>Subtotal</span><span>${money(t.sub)}</span></div>
    ${t.disc ? `<div class="sum-row"><span>Discount</span><span class="good">−${money(t.disc)}</span></div>` : ''}
    <div class="sum-row"><span>Shipping</span><span>${t.ship ? money(t.ship) : '<span class="good">Free</span>'}</span></div>
    <div class="sum-row total"><span>Total</span><span>${money(t.total)}</span></div>
    <button class="btn primary block lg" data-action="checkout">Checkout →</button>`;
  updateBadges();
}

/* =====================================================
   QUICK VIEW
   ===================================================== */
let qvQty = 1, qvId = null;
function openQuick(id) {
  const p = getP(id); if (!p) return;
  qvId = p.id; qvQty = 1;
  state.recent = [p.id, ...state.recent.filter(x => x !== p.id)].slice(0, 8); persist.recent(); renderRecent();
  renderQuick();
  openModal('modalQuick');
}
function renderQuick() {
  const p = getP(qvId); if (!p) return;
  const [g1, g2] = catColor(p.cat);
  const rel = state.products.filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 3);
  const reviewSection = renderProductReviews(p);
  const stock = p.stock === 0 ? '<span class="stock-out">● Out of stock</span>'
    : p.stock <= 10 ? `<span class="stock-low">● Hurry — only ${p.stock} left</span>`
    : `<span class="stock-ok">● In stock (${p.stock} available)</span>`;
  $('#quickBody').innerHTML = `
  <div class="quick" style="--g1:${g1};--g2:${g2}">
    <div class="quick-media"><img src="${esc(productImage(p))}" alt="${esc(p.name)}"></div>
    <div class="quick-info">
      <span class="card-cat">${esc(p.cat)}</span>
      <h2>${esc(p.name)}</h2>
      <div class="rating">${stars(p.rating)} <span>${p.rating.toFixed(1)} · ${p.reviews} reviews · ${p.sold} sold</span></div>
      <div class="price-row"><span class="price">${money(p.price)}</span>${p.old > p.price ? `<span class="old">${money(p.old)}</span><span class="tag sale">-${discountOf(p)}%</span>` : ''}</div>
      <p class="desc">${esc(p.desc)}</p>
      ${stock}
      <div class="quick-actions">
        ${p.stock > 0 ? `<div class="qty"><button data-action="qvMinus">−</button><span id="qvQty">${qvQty}</span><button data-action="qvPlus">+</button></div>
        <button class="btn primary lg" data-action="qvAdd">Add to cart</button>
        <button class="btn ghost lg" data-action="buyNow" data-id="${p.id}" data-qty="${qvQty}">Buy now</button>` : `<button class="btn ghost lg" data-action="notify" data-id="${p.id}">🔔 Notify me</button>`}
        <button class="btn ghost lg" data-action="wish" data-id="${p.id}">♡ Wishlist</button>
      </div>
    </div>
    ${rel.length ? `<div class="related"><h4>You may also like</h4><div class="related-row">${rel.map(r =>
      `<button class="mini" data-action="quick" data-id="${r.id}"><img class="mini-image" src="${esc(productImage(r))}" alt=""><span><b>${esc(r.name)}</b><small>${money(r.price)}</small></span></button>`).join('')}</div></div>` : ''}
    ${reviewSection}
  </div>`;
}

function renderProductReviews(product) {
  const reviews = state.reviews.filter(review => review.productId === product.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const existing = state.user?.role === 'customer'
    ? reviews.find(review => review.user === state.user.key)
    : null;
  const reviewList = reviews.length
    ? reviews.slice(0, 10).map(review => `<article class="customer-review">
        <div>${stars(review.rating)} <b>${Number(review.rating).toFixed(1)} / 5</b><span class="muted small"> · ${esc(review.customer)} · ${new Date(review.date).toLocaleDateString('en-PH')}</span></div>
        <p>${esc(review.feedback)}</p>
      </article>`).join('')
    : '<p class="muted small">No customer reviews yet.</p>';
  const form = state.user?.role === 'customer'
    ? `<form class="review-form" id="reviewForm" data-product-id="${product.id}">
        <label>Rating
          <select name="rating" required aria-label="Your rating">
            ${[5, 4, 3, 2, 1].map(value => `<option value="${value}" ${Number(existing?.rating || 5) === value ? 'selected' : ''}>${value} star${value === 1 ? '' : 's'}</option>`).join('')}
          </select>
        </label>
        <label>Feedback
          <textarea name="feedback" rows="3" maxlength="600" minlength="3" required placeholder="Share what you think about this product…">${esc(existing?.feedback || '')}</textarea>
        </label>
        <button class="btn primary" type="submit">${existing ? 'Update review' : 'Submit review'}</button>
      </form>`
    : state.user?.role === 'admin'
      ? '<p class="muted small">Customer accounts can submit product feedback.</p>'
      : '<p class="muted small">Sign in as a customer to share a rating and feedback.</p>';
  return `<section class="product-reviews"><div class="section-head"><div><h3>Customer reviews</h3><p class="muted small">Ratings and feedback from customers</p></div></div>${reviewList}${form}</section>`;
}

function onReviewSubmit(e) {
  e.preventDefault();
  if (state.user?.role !== 'customer') return toast('Sign in as a customer to submit feedback.', 'err');
  const product = getP(e.target.dataset.productId);
  const form = new FormData(e.target);
  const rating = Number(form.get('rating'));
  const feedback = String(form.get('feedback') || '').trim();
  if (!product) return toast('Product not found. Refresh and try again.', 'err');
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return toast('Choose a rating from 1 to 5 stars.', 'err');
  if (feedback.length < 3 || feedback.length > 600) return toast('Feedback must be between 3 and 600 characters.', 'err');

  let review = state.reviews.find(item => item.productId === product.id && item.user === state.user.key);
  const isUpdate = Boolean(review);
  if (!review) {
    review = { id: 'review-' + Date.now(), productId: product.id, user: state.user.key, customer: state.user.name, date: new Date().toISOString() };
    state.reviews.push(review);
  }
  review.rating = rating;
  review.feedback = feedback;
  review.customer = state.user.name;
  review.date = new Date().toISOString();
  if (!Number.isFinite(product.baseRating)) product.baseRating = product.rating;
  if (!Number.isFinite(product.baseReviews)) product.baseReviews = product.reviews;
  const productReviews = state.reviews.filter(item => item.productId === product.id);
  const totalReviews = product.baseReviews + productReviews.length;
  product.rating = (product.baseRating * product.baseReviews + productReviews.reduce((sum, item) => sum + item.rating, 0)) / totalReviews;
  product.reviews = totalReviews;
  persist.reviews(); persist.products();
  renderQuick(); renderGrid();
  toast(isUpdate ? 'Your review was updated.' : 'Thanks for your feedback and rating!');
}

/* =====================================================
   AUTH
   ===================================================== */
let authMode = 'login', authMethod = 'email', authStep = 1, pendingCheckout = false, pendingBuyNowId = null, authStandalone = false;
let otpCode = '', otpPhone = '', otpName = '';
let resetCode = '', resetEmail = '', resetCodeExpires = 0;
const normPhone = p => { p = String(p).replace(/[\s-]/g, ''); return p.startsWith('+63') ? '0' + p.slice(3) : p; };
const validPhone = p => /^09\d{9}$/.test(p);
const PROVIDERS = { email: 'Email', phone: 'Phone number', facebook: 'Facebook' };
let authRole = 'customer';

function openAuth(mode = 'login', note = '') {
  authMode = mode; authStep = 1;
  authStandalone = !state.user;
  renderAuth(note);
  if (authStandalone) {
    $('#authScreen').hidden = false;
    document.body.classList.add('auth-locked');
    $('#authScreen').querySelector('.auth-screen-close').focus();
  } else openModal('modalAuth');
}

function closeAuthScreen() {
  if (!authStandalone) return;
  $('#authScreen').hidden = true;
  document.body.classList.remove('auth-locked');
  authStandalone = false;
  pendingBuyNowId = null;
  $('#loginBtn').focus();
}

function renderAuth(note = '', err = '', direction = 'forward') {
  const authBody = $(authStandalone ? '#authScreenBody' : '#authBody');
  authBody.classList.remove('auth-swipe-forward', 'auth-swipe-backward');
  void authBody.offsetWidth;
  authBody.classList.add(direction === 'backward' ? 'auth-swipe-backward' : 'auth-swipe-forward');
  const u = state.user;
  if (u) {
    authBody.innerHTML = `
      <div class="profile">
        <div class="avatar">${u.avatar ? `<img src="${esc(u.avatar)}" alt="${esc(u.name)} profile photo">` : esc(u.name[0].toUpperCase())}</div>
        <input id="profilePhotoInput" class="profile-photo-input" type="file" accept="image/*" hidden>
        <button class="link profile-photo-button" type="button" data-action="chooseAvatar">Change profile photo</button>
        <h2>${esc(u.name)}</h2>
        <p class="muted">${esc(u.email || u.phone || 'Facebook account')} · ${u.role === 'admin' ? 'Administrator' : 'Customer'}</p>
        <p class="muted small">Signed in with ${PROVIDERS[u.provider] || 'Email'}</p>
        <div class="links">
          ${u.role === 'admin'
            ? '<button class="btn primary" data-nav="admin" data-action="closeModal">📊 Admin dashboard</button>'
            : '<button class="btn ghost" data-nav="orders" data-action="closeModal">📦 My orders</button><button class="btn ghost" data-nav="wishlist" data-action="closeModal">♡ Wishlist</button>'}
          <button class="btn ghost" data-action="switchAccount">Switch account</button>
          <button class="btn danger" data-action="logout">Sign out</button>
        </div>
      </div>`;
    return;
  }
  const reg = authMode === 'register';
  const msgs = (note ? `<div class="note">${esc(note)}</div>` : '') + (err ? `<div class="note err">${esc(err)}</div>` : '');

  if (authStep === 'forgotEmail') {
    authBody.innerHTML = `
      <h2 class="form-title">Reset your password</h2>
      <p class="muted">Enter the email address linked to your Quazar account.</p>
      ${msgs}
      <form class="form" id="authForm">
        <div class="field"><label for="resetEmailInput">Email</label><input id="resetEmailInput" type="email" required autocomplete="email" placeholder="you@email.com"></div>
        <button class="btn primary block lg" type="submit">Send reset code</button>
        <button class="link" type="button" data-action="resetBack">← Back to sign in</button>
      </form>`;
    return;
  }

  if (authStep === 'forgotCode') {
    authBody.innerHTML = `
      <h2 class="form-title">Check your email</h2>
      <p class="muted">Enter the reset code for <b>${esc(resetEmail)}</b>.</p>
      ${msgs}
      <form class="form" id="authForm">
        <div class="field"><label for="resetCodeInput">6-digit reset code</label><input id="resetCodeInput" class="otp-input" required inputmode="numeric" maxlength="6" pattern="\\d{6}" placeholder="••••••" autocomplete="one-time-code"></div>
        <button class="btn primary block lg" type="submit">Verify code</button>
        <button class="link" type="button" data-action="resetBack">← Back to sign in</button>
      </form>`;
    return;
  }

  if (authStep === 'forgotPassword') {
    authBody.innerHTML = `
      <h2 class="form-title">Choose a new password</h2>
      <p class="muted">Resetting password for <b>${esc(resetEmail)}</b>.</p>
      ${msgs}
      <form class="form" id="authForm">
        <div class="field"><label for="resetPasswordInput">New password</label><input id="resetPasswordInput" type="password" required minlength="6" autocomplete="new-password" placeholder="At least 6 characters"></div>
        <div class="field"><label for="resetPasswordConfirm">Confirm new password</label><input id="resetPasswordConfirm" type="password" required minlength="6" autocomplete="new-password" placeholder="Enter it again"></div>
        <button class="btn primary block lg" type="submit">Save new password</button>
      </form>`;
    return;
  }

  /* --- Facebook step (simulated) --- */
  if (authStep === 'fb') {
    authBody.innerHTML = `
      <h2 class="form-title">Continue with Facebook</h2>
      <p class="muted">Prototype mode: real Facebook Login needs a Facebook App ID and the Facebook SDK. Enter your Facebook name and mobile number to continue.</p>
      ${msgs}
      <form class="form" id="authForm">
        <div class="field"><label for="fbName">Your Facebook name</label><input id="fbName" required minlength="2" placeholder="Juan Dela Cruz"></div>
        <div class="field"><label for="fbPhone">Mobile number</label><input id="fbPhone" type="tel" required inputmode="tel" autocomplete="tel" placeholder="09XXXXXXXXX or +639XXXXXXXXX"></div>
        <button class="btn fb block lg" type="submit"><svg class="fb-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V10H7.3v3h2.8v8h3.4Z"/></svg>Continue with Facebook</button>
        <button class="link" type="button" data-action="authBack">← Other sign-in options</button>
      </form>`;
    return;
  }

  /* --- Phone: verification step --- */
  if (authMethod === 'phone' && authStep === 2) {
    authBody.innerHTML = `
      <h2 class="form-title">Verify your number</h2>
      <p class="muted">Enter the 6-digit code for <b>${esc(otpPhone)}</b>.</p>
      ${msgs}
      <form class="form" id="authForm">
        <div class="field"><label for="aOtp">Verification code</label><input id="aOtp" class="otp-input" required inputmode="numeric" maxlength="6" pattern="\\d{6}" placeholder="••••••" autocomplete="one-time-code"></div>
        <button class="btn primary block lg" type="submit">Verify &amp; ${reg ? 'create account' : 'sign in'}</button>
        <div class="row2"><button class="btn ghost" type="button" data-action="resendOtp">Resend code</button><button class="btn ghost" type="button" data-action="changePhone">Change number</button></div>
      </form>`;
    return;
  }

  /* --- Main sign-in / register screen --- */
  const roleTabs = `
    <div class="auth-tabs role-tabs">
      ${['customer', 'seller', 'rider'].map(role => `<button type="button" class="${authRole === role ? 'active' : ''}" data-action="authRole" data-role="${role}">${roleLabel(role)}</button>`).join('')}
    </div>
    <div class="auth-tabs role-apply-tabs">
      <button type="button" class="btn ghost sm" data-action="applyRole" data-role="seller">Apply as Seller</button>
      <button type="button" class="btn ghost sm" data-action="applyRole" data-role="rider">Apply as Rider</button>
    </div>`;
  const regRoleFields = reg && authRole === 'seller'
    ? `<div class="field"><label for="sellerShop">Shop name</label><input id="sellerShop" required minlength="2" placeholder="Nexa Goods"></div><div class="field"><label for="sellerBusiness">Business address</label><textarea id="sellerBusiness" required minlength="10" rows="2" placeholder="Business address"></textarea></div>`
    : reg && authRole === 'rider'
      ? `<div class="field"><label for="riderVehicle">Vehicle type</label><input id="riderVehicle" required minlength="2" placeholder="Motorbike"></div><div class="field"><label for="riderPlate">Plate number</label><input id="riderPlate" required minlength="4" placeholder="ABC-1234"></div>`
      : '';
  let fields;
  if (authMethod === 'phone') {
    fields = `${reg ? '<div class="field"><label for="aName">Full name</label><input id="aName" required minlength="2" placeholder="Juan Dela Cruz"></div>' : ''}
      <div class="field"><label for="aPhone">Mobile number</label><input id="aPhone" type="tel" required placeholder="09XXXXXXXXX or +639XXXXXXXXX" autocomplete="tel"></div>
      <button class="btn primary lg block" type="submit">Send verification code</button>`;
  } else {
    fields = `${reg ? '<div class="field"><label for="aName">Full name</label><input id="aName" required minlength="2" placeholder="Juan Dela Cruz"></div>' : ''}
      ${reg ? regRoleFields : ''}
      <div class="field"><label for="aEmail">Email</label><input id="aEmail" type="email" required placeholder="you@email.com" autocomplete="email"></div>
      <div class="field"><label for="aPass">Password</label><input id="aPass" type="password" required minlength="6" placeholder="At least 6 characters" autocomplete="${reg ? 'new-password' : 'current-password'}"></div>
      <button class="btn primary lg block" type="submit">${reg ? 'Create account' : 'Sign in'}</button>`;
  }
  authBody.innerHTML = `
    <h2 class="form-title">${reg ? 'Create account' : 'Welcome back'}</h2>
    <p class="muted">${reg ? `Create a ${roleLabel(authRole).toLowerCase()} account for Quazar.` : 'Sign in to continue shopping.'}</p>
    ${roleTabs}
    <div class="auth-tabs"><button class="${reg ? '' : 'active'}" data-action="authTab" data-mode="login">Sign in</button><button class="${reg ? 'active' : ''}" data-action="authTab" data-mode="register">Register</button></div>
    ${msgs}
    <button class="btn fb block lg" data-action="fbLogin" style="margin-top:16px"><svg class="fb-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V10H7.3v3h2.8v8h3.4Z"/></svg>Continue with Facebook</button>
    <div class="divider"><span>or use</span></div>
    <div class="auth-tabs method-tabs"><button class="${authMethod === 'email' ? 'active' : ''}" data-action="authMethod" data-method="email"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg>Email</button><button class="${authMethod === 'phone' ? 'active' : ''}" data-action="authMethod" data-method="phone"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10 5h4M11 18.5h2"/></svg>Phone number</button></div>
    <form class="form" id="authForm" autocomplete="on">${fields}</form>
    ${authMethod === 'email' && !reg ? '<button class="link forgot-link" type="button" data-action="forgotPassword">Forgot password?</button>' : ''}
    ${authMethod === 'email' && !reg ? '<p class="muted small" style="margin-top:14px">Demo access: <b>customer@nexa.com</b> / <b>quazar123</b>, <b>seller@nexa.com</b> / <b>seller123</b>, <b>rider@nexa.com</b> / <b>rider123</b>, <b>admin@nexa.com</b> / <b>quazar321</b></p>' : ''}`;
}

function updateAccountUI() {
  const u = state.user;
  $('#accountBtn').textContent = u ? '👤 ' + u.name.split(' ')[0] : 'Account';
  $('#accountBtn').hidden = !u;
  $('#authNavActions').hidden = !!u;
  const isAdmin = u?.role === 'admin';
  const isSeller = u?.role === 'seller';
  const isRider = u?.role === 'rider';
  document.body.classList.toggle('is-admin', isAdmin);
  document.body.classList.toggle('is-customer', u?.role === 'customer');
  document.body.classList.toggle('is-seller', isSeller);
  document.body.classList.toggle('is-rider', isRider);
  $$('.admin-only').forEach(el => el.hidden = !isAdmin);
  $$('.seller-only').forEach(el => el.hidden = !isSeller);
  $$('.rider-only').forEach(el => el.hidden = !isRider);
}

function finishLogin(u) {
  if (u.blocked) {
    renderAuth('', 'This account is blocked. Please contact support.');
    return;
  }
  if ((u.role === 'seller' || u.role === 'rider') && (u.status === 'pending' || u.status === 'rejected' || u.status === 'suspended')) {
    renderAuth('', `Your ${roleLabel(u.role).toLowerCase()} account is ${u.status}. Please wait for admin approval.`);
    return;
  }
  state.user = { name: u.name, email: u.email || '', phone: u.phone || '', role: normalizeRole(u.role || 'customer'), status: u.status || 'approved', provider: u.provider || 'email', key: u.email || u.phone || u.fbid, avatar: u.avatar || '' };
  persist.user(); updateAccountUI(); closeModal('modalAuth');
  authStandalone = false;
  $('#authScreen').hidden = true;
  document.body.classList.remove('auth-locked');
  toast(`Welcome, ${state.user.name.split(' ')[0]}! 👋`);
  if (pendingCheckout) { pendingCheckout = false; openCheckout(); }
  else if (pendingBuyNowId !== null) {
    const id = pendingBuyNowId;
    pendingBuyNowId = null;
    beginBuyNow(id);
  } else if (state.user.role === 'seller') {
    nav('seller');
  } else if (state.user.role === 'rider') {
    nav('rider');
  } else if (state.user.role === 'admin') {
    nav('admin');
  } else {
    nav('shop');
  }
}

function saveProfilePhoto(file) {
  if (!file || !state.user) return;
  if (!file.type.startsWith('image/')) {
    renderAuth('', 'Choose an image file for your profile photo.');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    renderAuth('', 'Choose an image smaller than 5 MB.');
    return;
  }

  const reader = new FileReader();
  reader.onerror = () => renderAuth('', 'The image could not be read. Please choose another file.');
  reader.onload = () => {
    const image = new Image();
    image.onerror = () => renderAuth('', 'The image could not be opened. Please choose another file.');
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 256 / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        renderAuth('', 'Your browser could not process this image.');
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      state.user.avatar = canvas.toDataURL('image/jpeg', .82);
      const account = state.users.find(user =>
        (state.user.email && user.email === state.user.email) ||
        (state.user.phone && user.phone === state.user.phone) ||
        (user.fbid && user.fbid === state.user.key)
      );
      if (account) {
        account.avatar = state.user.avatar;
        persist.users();
      }
      persist.user();
      renderAuth('Profile photo updated.');
    };
    image.src = String(reader.result);
  };
  reader.readAsDataURL(file);
}

function onAuthSubmit(e) {
  e.preventDefault();
  const reg = authMode === 'register';

  if (authStep === 'forgotEmail') {
    resetEmail = $('#resetEmailInput').value.trim().toLowerCase();
    const account = state.users.find(user => user.email === resetEmail && user.provider !== 'facebook' && user.provider !== 'phone');
    if (!account) return renderAuth('', 'No email account was found. Check the address or create an account.');
    resetCode = String(100000 + Math.floor(Math.random() * 900000));
    resetCodeExpires = Date.now() + 10 * 60 * 1000;
    authStep = 'forgotCode';
    return renderAuth(`Demo mode — no email is sent. Your reset code is ${resetCode}. It expires in 10 minutes.`);
  }

  if (authStep === 'forgotCode') {
    if (Date.now() > resetCodeExpires) return renderAuth('', 'That reset code has expired. Request a new one.');
    if ($('#resetCodeInput').value.trim() !== resetCode) return renderAuth('', 'Incorrect reset code. Please try again.');
    authStep = 'forgotPassword';
    return renderAuth();
  }

  if (authStep === 'forgotPassword') {
    const password = $('#resetPasswordInput').value;
    if (password !== $('#resetPasswordConfirm').value) return renderAuth('', 'The passwords do not match.');
    const account = state.users.find(user => user.email === resetEmail && user.provider !== 'facebook' && user.provider !== 'phone');
    if (!account) {
      authStep = 'login'; resetCode = ''; resetEmail = '';
      return renderAuth('', 'This account is no longer available. Please sign in again.');
    }
    account.pass = password;
    persist.users();
    authMode = 'login'; authMethod = 'email'; authStep = 1;
    resetCode = ''; resetEmail = ''; resetCodeExpires = 0;
    return renderAuth('Password updated. Sign in with your new password.');
  }

  /* Facebook (simulated) */
  if (authStep === 'fb') {
    const name = $('#fbName').value.trim(), phone = normPhone($('#fbPhone').value);
    if (!validPhone(phone)) return renderAuth('', 'Enter a valid mobile number, e.g. 09171234567.');
    const fbid = 'fb:' + name.toLowerCase().replace(/\s+/g, '.');
    let u = state.users.find(x => x.fbid === fbid);
    if (state.users.some(x => x.phone === phone && x.fbid !== fbid)) return renderAuth('', 'This number is already linked to another account.');
    if (!u) { u = { name, phone, fbid, role: 'customer', provider: 'facebook' }; state.users.push(u); }
    else u.phone = phone;
    persist.users();
    return finishLogin(u);
  }

  /* Phone number + one-time code */
  if (authMethod === 'phone') {
    if (authStep === 2) {
      if ($('#aOtp').value.trim() !== otpCode) return renderAuth('', 'Incorrect code. Please try again.');
      let u = state.users.find(x => x.phone === otpPhone);
      if (!u) {
        u = { name: otpName, phone: otpPhone, role: normalizeRole(authRole), provider: 'phone', status: normalizeRole(authRole) === 'customer' ? 'approved' : 'pending' };
        state.users.push(u); persist.users();
      }
      return finishLogin(u);
    }
    const phone = normPhone($('#aPhone').value);
    if (!validPhone(phone)) return renderAuth('', 'Enter a valid mobile number, e.g. 09171234567.');
    const exists = state.users.some(x => x.phone === phone);
    if (reg && exists) return renderAuth('', 'This number is already registered. Please sign in.');
    if (!reg && !exists) return renderAuth('', 'No account found for this number. Please register first.');
    otpPhone = phone; otpName = reg ? $('#aName').value.trim() : '';
    return sendOtp();
  }

  /* Email + password */
  const email = $('#aEmail').value.trim().toLowerCase(), pass = $('#aPass').value;
  if (reg) {
    if (state.users.some(u => u.email === email)) return renderAuth('', 'That email is already registered.');
    const accountRole = normalizeRole(authRole);
    const u = {
      name: $('#aName').value.trim(),
      email,
      pass,
      role: accountRole,
      provider: 'email',
      status: accountRole === 'customer' ? 'approved' : 'pending',
      shopName: $('#sellerShop')?.value?.trim() || '',
      businessAddress: $('#sellerBusiness')?.value?.trim() || '',
      vehicleType: $('#riderVehicle')?.value?.trim() || '',
      plateNumber: $('#riderPlate')?.value?.trim() || ''
    };
    state.users.push(u); persist.users(); return finishLogin(u);
  }
  const u = state.users.find(x => x.email === email && x.pass === pass);
  if (!u) return renderAuth('', 'Wrong email or password.');
  if (u.role !== normalizeRole(authRole)) return renderAuth('', `This account is not registered as a ${roleLabel(normalizeRole(authRole))}.`);
  finishLogin(u);
}

/* Demo OTP: no SMS is sent. In production your backend sends it (e.g. Twilio / Semaphore / Firebase Auth). */
function sendOtp() {
  otpCode = String(100000 + Math.floor(Math.random() * 900000));
  authStep = 2;
  renderAuth(`Demo mode — no SMS is sent. Your code is ${otpCode}`);
  toast(`Demo code: ${otpCode}`, 'warn');
}

function logout() {
  state.user = null; persist.user(); updateAccountUI(); closeModal('modalAuth');
  state.view = 'shop';
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-shop'));
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.nav === 'shop'));
  location.hash = '#/customer/shop';
  authStandalone = true;
  authMode = 'login'; authStep = 1;
  renderAuth('You have been signed out.');
  $('#authScreen').classList.add('is-intro');
  $('#authScreen').classList.remove('is-entering');
  $('#authScreen').hidden = false;
  document.body.classList.add('auth-locked');
}

/* =====================================================
   CHECKOUT
   ===================================================== */
const co = { step: 1, data: { delivery: 'standard', payment: 'cod' }, buyNowCart: null };
function restoreBuyNowCart() {
  if (co.buyNowCart === null) return;
  state.cart = co.buyNowCart;
  co.buyNowCart = null;
  updateBadges();
  renderCart();
}
function beginBuyNow(id, quantity = 1) {
  const product = getP(id);
  if (!product || product.stock < 1) return toast('This product is currently out of stock.', 'err');
  const qty = Math.max(1, Math.floor(Number(quantity) || 1));
  if (qty > product.stock) return toast(`Only ${product.stock} in stock.`, 'warn');
  if (state.user?.role !== 'customer') {
    if (!state.user) {
      pendingBuyNowId = product.id;
      openAuth('login', 'Sign in as a customer to buy this item.');
    } else toast('Only customer accounts can place orders.', 'warn');
    return;
  }
  if (co.buyNowCart !== null) restoreBuyNowCart();
  co.buyNowCart = state.cart;
  state.cart = [{ id: product.id, qty }];
  if ($('#modalQuick').classList.contains('open')) closeModal('modalQuick');
  openCheckout();
}
function openCheckout() {
  if (!state.cart.length) return toast('Your cart is empty', 'warn');
  if (state.user?.role !== 'customer') {
    closeCart();
    if (!state.user) { pendingCheckout = true; openAuth('login', 'Please sign in to place your order.'); }
    else toast('Only customer accounts can place orders.', 'warn');
    return;
  }
  closeCart(); co.step = 1;
  co.data = { name: state.user.name, email: state.user.email || '', phone: state.user.phone || '', address: '', city: '', province: '', postal: '', delivery: 'standard', payment: 'cod' };
  renderCheckout(); openModal('modalCheckout');
}
function renderCheckout() {
  const d = co.data;
  const t = totals(d.delivery === 'express' ? EXPRESS_FEE : 0);
  const steps = ['Delivery details', 'Payment', 'Confirm order'].map((s, i) =>
    `<div class="step ${co.step === i + 1 ? 'now' : co.step > i + 1 ? 'done' : ''}"><i>${co.step > i + 1 ? '✓' : i + 1}</i><span>${s}</span></div>`).join('');
  const summary = `<div class="co-summary"><h4>Order summary</h4>
    ${state.cart.map(l => { const p = getP(l.id); return `<div class="co-line"><span>${esc(p.name)} × ${l.qty}</span><span>${money(p.price * l.qty)}</span></div>`; }).join('')}
    <hr style="border:0;border-top:1px dashed var(--border);margin:10px 0">
    <div class="co-line"><span>Subtotal</span><span>${money(t.sub)}</span></div>
    ${t.disc ? `<div class="co-line"><span>Discount</span><span>−${money(t.disc)}</span></div>` : ''}
    <div class="co-line"><span>Shipping</span><span>${t.ship ? money(t.ship) : 'Free'}</span></div>
    <div class="co-line" style="font-weight:800;font-size:1.05rem;margin-top:6px"><span style="color:var(--text)">Total</span><span>${money(t.total)}</span></div></div>`;

  let body = '';
  if (co.step === 1) {
    body = `<form class="form" id="coForm" data-step="1">
      <p class="muted small">Enter the recipient and complete delivery address for this order.</p>
      <div class="row2"><div class="field"><label for="orderName">Recipient full name</label><input id="orderName" name="name" required autocomplete="name" value="${esc(d.name)}"></div>
      <div class="field"><label for="orderPhone">Mobile number</label><input id="orderPhone" name="phone" required type="tel" inputmode="tel" autocomplete="tel" pattern="^(\\+63|0)9\\d{9}$" placeholder="09XXXXXXXXX" value="${esc(d.phone)}" title="Use format 09XXXXXXXXX or +639XXXXXXXXX"></div></div>
      <div class="field"><label for="orderAddress">House / unit, street, and barangay</label><textarea id="orderAddress" name="address" required minlength="8" autocomplete="street-address" placeholder="House or unit number, street name, barangay">${esc(d.address)}</textarea></div>
      <div class="row2"><div class="field"><label for="orderCity">City / municipality</label><input id="orderCity" name="city" required autocomplete="address-level2" value="${esc(d.city)}"></div>
      <div class="field"><label for="orderProvince">Province</label><input id="orderProvince" name="province" required autocomplete="address-level1" value="${esc(d.province)}"></div></div>
      <div class="row2"><div class="field"><label for="orderPostal">Postal code</label><input id="orderPostal" name="postal" required inputmode="numeric" pattern="\\d{4}" autocomplete="postal-code" placeholder="1100" value="${esc(d.postal)}"></div>
      <div class="field"><label for="orderEmail">Email (optional)</label><input id="orderEmail" name="email" type="email" autocomplete="email" value="${esc(d.email)}"></div></div>
      <div class="options">
        <label class="opt"><input type="radio" name="delivery" value="standard" ${d.delivery === 'standard' ? 'checked' : ''}><span class="oi">📦</span><span><b>Standard delivery</b><small>3–5 days · ${totals().ship ? money(SHIP_FEE) : 'Free'}</small></span></label>
        <label class="opt"><input type="radio" name="delivery" value="express" ${d.delivery === 'express' ? 'checked' : ''}><span class="oi">⚡</span><span><b>Express delivery</b><small>1–2 days · +${money(EXPRESS_FEE)}</small></span></label>
      </div>
      <div class="co-actions"><button type="button" class="btn ghost" data-action="closeModal">Cancel</button><button class="btn primary" type="submit">Continue to payment →</button></div></form>`;
  } else if (co.step === 2) {
    const onlineMethods = [['gcash', '📱', 'GCash'], ['card', '💳', 'Credit / Debit card'], ['bank', '🏦', 'Bank transfer']];
    const isOnline = d.payment !== 'cod';
    body = `<form class="form" id="coForm" data-step="2">
      <div class="options">
        <label class="opt"><input type="radio" name="paymentType" value="cod" ${!isOnline ? 'checked' : ''}><span class="oi">💵</span><span><b>Cash on Delivery (COD)</b><small>Pay when your order arrives</small></span></label>
        <label class="opt"><input type="radio" name="paymentType" value="online" ${isOnline ? 'checked' : ''}><span class="oi">💳</span><span><b>Online payment</b><small>Choose a payment method below</small></span></label>
      </div>
      ${isOnline ? `<div class="field"><label for="onlinePaymentMethod">Online payment method</label><select id="onlinePaymentMethod" name="paymentMethod" required>
        ${onlineMethods.map(([value, icon, label]) => `<option value="${value}" ${d.payment === value ? 'selected' : ''}>${icon} ${label}</option>`).join('')}
      </select></div>` : ''}
      <p class="muted small">Online payment is a demo option in this prototype. No payment is processed or card details collected.</p>
      <div class="co-actions"><button type="button" class="btn ghost" data-action="coBack">← Back</button><button class="btn primary" type="submit">Review order →</button></div></form>`;
  } else {
    const payName = d.payment === 'cod' ? 'Cash on Delivery (COD)' : `Online payment · ${{ gcash: 'GCash', card: 'Credit / Debit card', bank: 'Bank transfer' }[d.payment]}`;
    body = `<form class="form" id="coForm" data-step="3">
      <div class="review-box"><b>📍 Deliver to</b><span>${esc(d.name)} · ${esc(d.phone)}</span><span>${esc(d.address)}, ${esc(d.city)}, ${esc(d.province)} ${esc(d.postal)}</span>${d.email ? `<span>${esc(d.email)}</span>` : ''}<span class="muted">${d.delivery === 'express' ? 'Express (1–2 days)' : 'Standard (3–5 days)'}</span></div>
      <div class="review-box"><b>💳 Payment</b><span>${payName}</span></div>
      <label class="check"><input type="checkbox" required> <span class="small">I agree to the Terms &amp; Return Policy</span></label>
      <div class="co-actions"><button type="button" class="btn ghost" data-action="coBack">← Back</button><button class="btn primary lg" type="submit">Place order · ${money(t.total)}</button></div></form>`;
  }
  $('#checkoutBody').innerHTML = `<h2>Checkout</h2><div class="stepper">${steps}</div><div class="checkout"><div>${body}</div>${summary}</div>`;
}
function onCheckoutSubmit(e) {
  e.preventDefault();
  const f = e.target, step = +f.dataset.step;
  const fd = Object.fromEntries(new FormData(f).entries());
  if (step === 1) {
    const name = String(fd.name || '').trim();
    const phone = String(fd.phone || '').trim();
    const address = String(fd.address || '').trim();
    const city = String(fd.city || '').trim();
    const province = String(fd.province || '').trim();
    const postal = String(fd.postal || '').trim();
    if (!name || !/^(?:\+63|0)9\d{9}$/.test(phone) || address.length < 8 || !city || !province || !/^\d{4}$/.test(postal)) {
      return toast('Enter your full name, valid mobile number, and complete delivery address.', 'err');
    }
    Object.assign(co.data, fd, { name, phone, address, city, province, postal });
    co.step = 2; renderCheckout();
  } else if (step === 2) {
    if (fd.paymentType === 'cod') co.data.payment = 'cod';
    else if (fd.paymentType === 'online' && ['gcash', 'card', 'bank'].includes(fd.paymentMethod)) co.data.payment = fd.paymentMethod;
    else return toast('Choose Cash on Delivery or an online payment method.', 'err');
    co.step = 3; renderCheckout();
  }
  else placeOrder();
}
function placeOrder() {
  if (state.user?.role !== 'customer') return toast('Only customer accounts can place orders.', 'err');
  const d = co.data;
  if (!String(d.name || '').trim() || !/^(?:\+63|0)9\d{9}$/.test(String(d.phone || '').trim()) ||
      String(d.address || '').trim().length < 8 || !String(d.city || '').trim() ||
      !String(d.province || '').trim() || !/^\d{4}$/.test(String(d.postal || '').trim()) ||
      !['cod', 'gcash', 'card', 'bank'].includes(d.payment)) {
    co.step = 1;
    renderCheckout();
    return toast('Check your delivery details and payment method before placing the order.', 'err');
  }
  // re-validate stock
  for (const l of state.cart) { const p = getP(l.id); if (!p || p.stock < l.qty) { toast(`"${p ? p.name : 'An item'}" no longer has enough stock`, 'err'); renderCheckout(); return; } }
  const t = totals(d.delivery === 'express' ? EXPRESS_FEE : 0);
  const order = {
    id: 'NX-' + Date.now().toString().slice(-8),
    date: new Date().toISOString(),
    user: state.user.key, customer: state.user.name,
    status: 'Packaging',
    items: state.cart.map(l => { const p = getP(l.id); return { id: p.id, name: p.name, emoji: p.emoji, price: p.price, qty: l.qty }; }),
    sub: t.sub, disc: t.disc, ship: t.ship, total: t.total,
    payment: d.payment, delivery: d.delivery,
    address: `${d.address}, ${d.city}, ${d.province} ${d.postal}`, phone: d.phone, email: d.email || '', promo: state.promo
  };
  const today = dkey(new Date());
  state.cart.forEach(l => {
    const p = getP(l.id); p.stock -= l.qty; p.sold += l.qty;
    (state.extra[p.id] ||= {})[today] = (state.extra[p.id][today] || 0) + l.qty;
    delete seriesCache[p.id];
  });
  state.orders.unshift(order);
  if (co.buyNowCart !== null) {
    state.cart = co.buyNowCart;
    co.buyNowCart = null;
  } else state.cart = [];
  state.promo = null;
  persist.orders(); persist.products(); persist.extra(); persist.cart(); persist.promo();
  updateBadges(); renderFilters(); renderGrid(); renderFlash();
  $('#checkoutBody').innerHTML = `
    <div class="success"><div class="check-anim">✓</div><h2>Order placed! 🎉</h2>
    <p class="muted">Thanks, ${esc(state.user.name.split(' ')[0])}. Your order <b>${order.id}</b> is being processed.</p>
    <p style="margin-top:6px;font-weight:700">${money(order.total)}</p>
    <div class="btns"><button class="btn primary" data-nav="orders" data-action="closeModal">Track my order</button><button class="btn ghost" data-action="closeModal">Continue shopping</button></div></div>`;
}

/* =====================================================
   ORDERS
   ===================================================== */
function renderOrders() {
  const box = $('#ordersList');
  if (!state.user || state.user.role !== 'customer') { box.innerHTML = ''; return; }
  const mine = state.orders.filter(o => o.user === state.user.key);
  if (!mine.length) { box.innerHTML = '<div class="empty"><div class="big">📦</div><h3>No orders yet</h3><p>When you place an order it will show up here.</p><button class="btn primary" data-nav="shop">Start shopping</button></div>'; return; }
  box.innerHTML = mine.map((o, i) => {
    return `<div class="order" style="animation-delay:${i * 60}ms">
      <div class="order-head"><div><b>${esc(o.id)}</b><div class="muted small">${new Date(o.date).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}</div></div><div class="order-status"><span class="muted small">Order Status</span><span class="status ${esc(o.status)}">${esc(o.status)}</span></div></div>
      <div class="order-items">${o.items.map(it => `<div class="oi-row"><span class="e">${it.emoji}</span><span>${esc(it.name)} × ${it.qty}</span><span>${money(it.price * it.qty)}</span></div>`).join('')}</div>
      <div class="order-foot"><div><span class="muted small">Total</span> <b>${money(o.total)}</b> <span class="muted small">· ${esc({ cod: 'COD', gcash: 'GCash', card: 'Card', bank: 'Bank' }[o.payment])}</span></div>
      <button class="btn ghost sm" data-action="reorder" data-oid="${o.id}">↻ Buy again</button></div></div>`;
  }).join('');
}

/* =====================================================
   FORECASTING (demo)  — replace with your Python model later
   ===================================================== */
const HIST_DAYS = 120;
const seriesCache = {};
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* synthetic daily sales: base level + weekly seasonality + trend + "payday" spikes + noise */
function getSeries(p) {
  if (seriesCache[p.id]) return seriesCache[p.id];
  const rnd = mulberry(p.id * 9973 + 7), base = 1 + Math.min(p.sold, 900) / 60;
  const week = [1.25, .85, .9, .95, 1.05, 1.2, 1.3];
  const today = new Date(), out = [];
  for (let i = 0; i < HIST_DAYS; i++) {
    const d = new Date(today.getTime() - (HIST_DAYS - 1 - i) * DAY);
    const spike = (d.getDate() >= 29 || d.getDate() <= 1) ? 1.55 : 1;
    out.push(Math.max(0, Math.round(base * week[d.getDay()] * (1 + i * .003) * spike * (.75 + .5 * rnd()))));
  }
  // add real orders placed in this app
  const ex = state.extra[p.id] || {};
  for (let i = 0; i < HIST_DAYS; i++) {
    const d = new Date(today.getTime() - (HIST_DAYS - 1 - i) * DAY);
    out[i] += ex[dkey(d)] || 0;
  }
  return (seriesCache[p.id] = out);
}
const aggSeries = () => {
  const out = Array(HIST_DAYS).fill(0);
  state.products.forEach(p => getSeries(p).forEach((v, i) => out[i] += v));
  return out;
};

const FORECAST_METHODS = {
  seasonal: 'Seasonal trend',
  'moving-average': '7-day moving average',
  'weighted-average': '7-day weighted moving average',
  exponential: 'Simple exponential smoothing',
  'linear-trend': 'Linear trend',
  delphi: 'Delphi expert consensus (demo)',
  causal: 'Price & promotion scenario',
  knn: 'Machine learning: k-nearest neighbors',
  ensemble: 'AI-inspired model ensemble (demo)'
};

/* seasonal-trend forecast: weekday indices + linear trend on de-seasonalised last 28 days */
function fitSeasonalTrend(series, h, endDate) {
  const n = series.length, w = Math.min(28, n), tail = series.slice(n - w);
  const dow = i => new Date(endDate.getTime() + (i - (n - 1)) * DAY).getDay();
  const avg = tail.reduce((a, b) => a + b, 0) / w || 1e-4;
  const sum = Array(7).fill(0), cnt = Array(7).fill(0);
  tail.forEach((v, j) => { const d = dow(n - w + j); sum[d] += v; cnt[d]++; });
  const si = sum.map((s, d) => cnt[d] ? (s / cnt[d]) / avg : 1);
  const ds = tail.map((v, j) => v / (si[dow(n - w + j)] || 1));
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  ds.forEach((y, x) => { sx += x; sy += y; sxy += x * y; sxx += x * x; });
  const slope = (w * sxy - sx * sy) / ((w * sxx - sx * sx) || 1), icpt = (sy - slope * sx) / w;
  return Array.from({ length: h }, (_, k) => Math.max(0, (icpt + slope * (w + k)) * si[dow(n + k)]));
}

function fitKnn(series, h, endDate) {
  const n = series.length;
  if (n < 15) return fitSeasonalTrend(series, h, endDate);
  const scale = series.reduce((sum, value) => sum + value, 0) / n || 1;
  const examples = [];
  const featuresAt = (values, index, date) => [
    values[index - 1] / scale,
    values[index - 7] / scale,
    values[index - 14] / scale,
    Math.sin(2 * Math.PI * date.getDay() / 7),
    Math.cos(2 * Math.PI * date.getDay() / 7)
  ];
  for (let i = 14; i < n; i++) {
    const date = new Date(endDate.getTime() - (n - 1 - i) * DAY);
    examples.push({ features: featuresAt(series, i, date), target: series[i] });
  }
  const values = [...series];
  const k = Math.min(5, examples.length);
  return Array.from({ length: h }, (_, step) => {
    const index = values.length;
    const date = new Date(endDate.getTime() + (step + 1) * DAY);
    const features = featuresAt(values, index, date);
    const nearest = examples.map(example => {
      const distance = example.features.reduce((sum, value, i) => sum + (value - features[i]) ** 2, 0);
      return { target: example.target, weight: 1 / (Math.sqrt(distance) + .05) };
    }).sort((a, b) => a.weight - b.weight).slice(-k);
    const weight = nearest.reduce((sum, item) => sum + item.weight, 0);
    const prediction = nearest.reduce((sum, item) => sum + item.target * item.weight, 0) / weight;
    values.push(Math.max(0, prediction));
    return Math.max(0, prediction);
  });
}

function readMethodAdjustment(id, fallback = 0) {
  const input = $('#' + id);
  if (!input) return fallback;
  const value = Number(input.value);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(Number(input.min), Math.min(Number(input.max), value)) / 100;
}

function fitForecast(series, h, endDate = new Date(), method = 'seasonal') {
  const n = series.length;
  if (!n || h <= 0) return [];
  if (method === 'seasonal') return fitSeasonalTrend(series, h, endDate);

  if (method === 'moving-average' || method === 'weighted-average') {
    const window = series.slice(-Math.min(7, n));
    const avg = method === 'moving-average'
      ? window.reduce((sum, value) => sum + value, 0) / window.length
      : window.reduce((sum, value, i) => sum + value * (i + 1), 0) /
        (window.length * (window.length + 1) / 2);
    return Array(h).fill(Math.max(0, avg));
  }

  if (method === 'exponential') {
    const alpha = .3;
    let level = series[0];
    for (let i = 1; i < n; i++) level = alpha * series[i] + (1 - alpha) * level;
    return Array(h).fill(Math.max(0, level));
  }

  if (method === 'delphi') {
    const adjustments = ['fcExpert1', 'fcExpert2', 'fcExpert3'].map(id => readMethodAdjustment(id));
    const consensus = adjustments.reduce((sum, value) => sum + value, 0) / adjustments.length;
    return fitSeasonalTrend(series, h, endDate).map(value => Math.max(0, value * (1 + consensus)));
  }

  if (method === 'causal') {
    const priceChange = readMethodAdjustment('fcPriceChange');
    const promoLift = readMethodAdjustment('fcPromoLift');
    const priceEffect = Math.max(.1, 1 + priceChange) ** -1.2;
    const scenarioEffect = priceEffect * (1 + promoLift);
    return fitSeasonalTrend(series, h, endDate).map(value => Math.max(0, value * scenarioEffect));
  }

  if (method === 'knn') return fitKnn(series, h, endDate);

  if (method === 'ensemble') {
    const methods = ['seasonal', 'moving-average', 'exponential', 'linear-trend', 'knn'];
    const forecasts = methods.map(name => fitForecast(series, h, endDate, name));
    return Array.from({ length: h }, (_, i) =>
      Math.max(0, forecasts.reduce((sum, forecast) => sum + forecast[i], 0) / forecasts.length));
  }

  if (method === 'linear-trend') {
    const window = series.slice(-Math.min(28, n)), size = window.length;
    const meanX = (size - 1) / 2;
    const meanY = window.reduce((sum, value) => sum + value, 0) / size;
    const denominator = window.reduce((sum, _, i) => sum + (i - meanX) ** 2, 0);
    const slope = denominator
      ? window.reduce((sum, value, i) => sum + (i - meanX) * (value - meanY), 0) / denominator
      : 0;
    return Array.from({ length: h }, (_, i) => Math.max(0, meanY + slope * (size + i - 1 - meanX)));
  }

  return fitSeasonalTrend(series, h, endDate);
}

function backtest(series, k = 14, method = 'seasonal') {
  const train = series.slice(0, -k), test = series.slice(-k);
  const f = fitForecast(train, k, new Date(Date.now() - k * DAY), method);
  let ape = 0, c = 0, se = 0;
  test.forEach((a, i) => { se += (a - f[i]) ** 2; if (a > 0) { ape += Math.abs(a - f[i]) / a; c++; } });
  return { mape: c ? ape / c * 100 : 0, rmse: Math.sqrt(se / k) };
}
const sumArr = a => a.reduce((x, y) => x + y, 0);

/* =====================================================
   ADMIN DASHBOARD
   ===================================================== */
function renderAdmin() {
  if (state.user?.role !== 'admin') return;
  // product selector (keep selection)
  const sel = $('#fcProduct'), keep = sel.value || 'all';
  sel.innerHTML = '<option value="all">All products</option>' + state.products.map(p => `<option value="${p.id}">${p.emoji} ${esc(p.name)}</option>`).join('');
  sel.value = [...sel.options].some(o => o.value === keep) ? keep : 'all';
  renderForecastMethodOptions(); renderKpis(); renderTop(); renderReorder(); renderProductTable(); renderSalesReport(); renderCustomerTable(); renderCustomerReviews(); renderAdminOrders();
  requestAnimationFrame(drawChart);
}

function renderForecastMethodOptions() {
  const method = $('#fcMethod').value;
  $$('[data-method-options]').forEach(option => { option.hidden = !option.dataset.methodOptions.split(' ').includes(method); });
}

function renderKpis() {
  const rev = (from, to) => state.products.reduce((s, p) => { const a = getSeries(p); return s + p.price * sumArr(a.slice(a.length - from, a.length - to)); }, 0);
  const units = (from, to) => { const a = aggSeries(); return sumArr(a.slice(a.length - from, a.length - to)); };
  const r1 = rev(30, 0), r0 = rev(60, 30), u1 = units(30, 0), u0 = units(60, 30);
  const delta = (a, b) => b ? ((a - b) / b * 100) : 0;
  const low = state.products.filter(p => p.stock <= 10).length;
  const method = $('#fcMethod').value;
  const acc = state.products.map(p => 100 - Math.min(100, backtest(getSeries(p), 14, method).mape));
  const avgAcc = acc.reduce((a, b) => a + b, 0) / acc.length;
  const kp = (label, val, d, i) => `<div class="kpi" style="--i:${i}"><span>${label}</span><b>${val}</b>${d == null ? '' : `<em class="${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '▲' : '▼'} ${Math.abs(d).toFixed(1)}% vs previous 30d</em>`}</div>`;
  $('#kpis').innerHTML =
    kp('Revenue (30 days)', money(r1).replace(/\.00$/, ''), delta(r1, r0), 0) +
    kp('Units sold (30 days)', u1.toLocaleString(), delta(u1, u0), 1) +
    kp('Orders placed here', state.orders.length, null, 2) +
    kp('Low-stock products', low, null, 3) +
    kp('Avg forecast accuracy', avgAcc.toFixed(1) + '%', null, 4);
}

function renderTop() {
  const rows = state.products.map(p => ({ p, u: sumArr(getSeries(p).slice(-30)) })).sort((a, b) => b.u - a.u).slice(0, 6);
  const max = rows[0]?.u || 1;
  $('#topSellers').innerHTML = rows.map(r => `<div class="bar-row"><div class="top"><span class="admin-product-label"><img class="admin-product-image" src="${esc(productImage(r.p))}" alt=""><span>${esc(r.p.name.length > 24 ? r.p.name.slice(0, 22) + '…' : r.p.name)}</span></span><b>${r.u}</b></div><div class="meter"><i data-w="${r.u / max * 100}"></i></div></div>`).join('');
  requestAnimationFrame(() => $$('#topSellers .meter i').forEach(i => i.style.width = i.dataset.w + '%'));
}

function renderReorder() {
  const H = +$('#fcHorizon').value;
  const method = $('#fcMethod').value;
  const rows = state.products.map(p => {
    const f = fitForecast(getSeries(p), H, new Date(), method), demand = sumArr(f), daily = demand / H;
    const cover = daily > 0 ? p.stock / daily : 999;
    const need = Math.max(0, Math.ceil(demand * 1.2 - p.stock));
    return { p, demand, cover, need, st: cover < 7 ? 'crit' : cover < H ? 'low' : 'ok' };
  }).sort((a, b) => a.cover - b.cover);
  $('#reorderTable').innerHTML = `<thead><tr><th>Product</th><th>In stock</th><th>Forecast (${H}d)</th><th>Days of cover</th><th>Status</th><th>Suggested reorder</th><th></th></tr></thead><tbody>` +
    rows.map(r => `<tr><td><span class="admin-product-label"><img class="admin-product-image" src="${esc(productImage(r.p))}" alt=""><span>${esc(r.p.name)}</span></span></td><td>${r.p.stock}</td><td>${Math.round(r.demand)}</td><td>${r.cover > 300 ? '—' : r.cover.toFixed(1)}</td>
      <td><span class="st ${r.st}">${{ crit: 'Critical', low: 'Reorder soon', ok: 'Healthy' }[r.st]}</span></td>
      <td>${r.need ? '+' + r.need : '—'}</td>
      <td>${r.need ? `<button class="btn sm primary" data-action="restock" data-id="${r.p.id}" data-qty="${r.need}">Restock</button>` : ''}</td></tr>`).join('') + '</tbody>';
}

function renderProductTable() {
  $('#productTable').innerHTML = '<thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Sold</th><th></th></tr></thead><tbody>' +
    state.products.map(p => `<tr><td><span class="admin-product-label"><img class="admin-product-image" src="${esc(productImage(p))}" alt=""><span>${esc(p.name)}</span></span></td><td>${esc(p.cat)}</td><td>${money(p.price)}</td><td><div class="inventory-control"><button class="btn sm ghost" data-action="adjustStock" data-id="${p.id}" data-delta="-1" aria-label="Remove one ${esc(p.name)} from stock">−</button><b>${p.stock}</b><button class="btn sm ghost" data-action="adjustStock" data-id="${p.id}" data-delta="1" aria-label="Add one ${esc(p.name)} to stock">+</button></div></td><td>${p.sold}</td>
    <td><div class="row-actions"><button class="btn sm ghost" data-action="editProduct" data-id="${p.id}">Edit</button><button class="btn sm danger" data-action="delProduct" data-id="${p.id}">Delete</button></div></td></tr>`).join('') + '</tbody>';
}

function renderSalesReport() {
  if (state.user?.role !== 'admin') return;
  const days = $('#salesRange').value;
  const cutoff = days === 'all' ? 0 : Date.now() - Number(days) * DAY;
  const orders = state.orders.filter(order => new Date(order.date).getTime() >= cutoff);
  const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const average = orders.length ? revenue / orders.length : 0;
  $('#salesReport').innerHTML = [
    ['Orders', orders.length],
    ['Order revenue', money(revenue)],
    ['Average order value', money(average)]
  ].map(([label, value], index) => `<div class="kpi" style="--i:${index}"><span>${label}</span><b>${value}</b></div>`).join('');
}

function renderCustomerTable() {
  if (state.user?.role !== 'admin') return;
  const query = $('#customerSearch').value.trim().toLowerCase();
  const customers = state.users.filter(user => user.role === 'customer').filter(user =>
    `${user.name || ''} ${user.email || ''} ${user.phone || ''}`.toLowerCase().includes(query)
  );
  $('#customerTable').innerHTML = customers.length
    ? '<thead><tr><th>Customer</th><th>Contact</th><th>Orders</th><th>Account</th><th>Actions</th></tr></thead><tbody>' +
      customers.map(user => {
        const key = user.email || user.phone || user.fbid;
        const customerOrders = state.orders.filter(order => order.user === key);
        const blocked = Boolean(user.blocked);
        return `<tr><td>${esc(user.name || 'Customer')}</td><td>${esc(user.email || user.phone || '—')}</td><td>${customerOrders.length}</td>
          <td><span class="status ${blocked ? 'Blocked' : 'Active'}">${blocked ? 'Blocked' : 'Active'}</span></td>
          <td><div class="row-actions">
            <button class="btn sm ghost" data-action="toggleCustomerBlock" data-customer="${encodeURIComponent(key)}">${blocked ? 'Unblock' : 'Block'}</button>
            <button class="btn sm danger" data-action="deleteCustomer" data-customer="${encodeURIComponent(key)}">Delete</button>
          </div></td></tr>`;
      }).join('') + '</tbody>'
    : `<tbody><tr><td class="muted customer-empty" colspan="5">${query ? 'No customers match your search.' : 'No customer accounts yet.'}</td></tr></tbody>`;
}

function renderCustomerReviews() {
  if (state.user?.role !== 'admin') return;
  const reviews = [...state.reviews].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50);
  $('#customerReviewsTable').innerHTML = reviews.length
    ? '<thead><tr><th>Product</th><th>Customer</th><th>Rating</th><th>Feedback</th><th>Date</th></tr></thead><tbody>' +
      reviews.map(review => `<tr><td>${esc(getP(review.productId)?.name || 'Deleted product')}</td><td>${esc(review.customer || 'Deleted customer')}</td>
        <td>${stars(review.rating)} ${Number(review.rating).toFixed(1)} / 5</td><td>${esc(review.feedback)}</td>
        <td>${new Date(review.date).toLocaleDateString('en-PH')}</td></tr>`).join('') + '</tbody>'
    : '<tbody><tr><td class="muted customer-empty" colspan="5">No customer feedback yet.</td></tr></tbody>';
}

function renderAdminOrders() {
  if (state.user?.role !== 'admin') return;
  const query = $('#adminOrderSearch').value.trim().toLowerCase();
  const status = $('#adminOrderStatusFilter').value;
  const orders = state.orders.filter(order => {
    const matchesText = `${order.id} ${order.customer || ''}`.toLowerCase().includes(query);
    return matchesText && (status === 'all' || order.status === status);
  });
  $('#adminOrders').innerHTML = orders.length
    ? '<thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th></tr></thead><tbody>' +
      orders.map(o => `<tr data-order-row="${esc(o.id)}"><td><b>${esc(o.id)}</b></td><td>${esc(o.customer || 'Deleted customer')}</td><td>${new Date(o.date).toLocaleDateString('en-PH')}</td><td>${o.items.reduce((s, i) => s + i.qty, 0)}</td><td>${money(o.total)}</td><td>
        <span class="status ${esc(o.status)}">${esc(o.status)}</span>
        <button class="btn sm ghost" data-action="editOrderStatus" data-oid="${esc(o.id)}">Edit</button>
        <span class="order-status-editor" hidden>
          <select aria-label="Order status for ${esc(o.id)}"><option value="Packaging" ${o.status === 'Packaging' ? 'selected' : ''}>Packaging</option><option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option></select>
          <button class="btn sm primary" data-action="saveOrderStatus" data-oid="${esc(o.id)}">Save</button>
          <button class="btn sm ghost" data-action="cancelOrderStatus">Cancel</button>
        </span>
      </td></tr>`).join('') + '</tbody>'
    : `<tbody><tr><td class="muted customer-empty" colspan="6">${state.orders.length ? 'No orders match these filters.' : 'No orders yet — place one from the shop and it will appear here.'}</td></tr></tbody>`;
}

/* ---------- Forecast chart (canvas, no library) ---------- */
let chartInfo = null;
function drawChart() {
  const canvas = $('#fcChart');
  if (!canvas || !$('#view-admin').classList.contains('active')) return;
  const wrap = canvas.parentElement, dpr = window.devicePixelRatio || 1;
  const W = wrap.clientWidth, H = wrap.clientHeight;
  if (!W || !H) return;
  canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
  const cs = getComputedStyle(document.documentElement), col = n => cs.getPropertyValue(n).trim();
  const pid = $('#fcProduct').value, h = +$('#fcHorizon').value, method = $('#fcMethod').value;
  const series = pid === 'all' ? aggSeries() : getSeries(getP(pid));
  const SHOW = 45, actual = series.slice(-SHOW), fc = fitForecast(series, h, new Date(), method);
  const bt = backtest(series, 14, method), band = bt.rmse * 1.28;
  const n = SHOW + h, pad = { l: 46, r: 14, t: 14, b: 30 };
  const maxV = Math.max(...actual, ...fc.map(v => v + band), 1);
  const yMax = Math.ceil(maxV * 1.1 / 5) * 5 || 5;
  const x = i => pad.l + i * (W - pad.l - pad.r) / (n - 1);
  const y = v => H - pad.b - v / yMax * (H - pad.t - pad.b);
  const today = new Date(), dateAt = i => new Date(today.getTime() + (i - (SHOW - 1)) * DAY);

  // grid + y labels
  ctx.font = '11px Inter, sans-serif'; ctx.fillStyle = col('--muted'); ctx.strokeStyle = col('--border'); ctx.lineWidth = 1;
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let k = 0; k <= 4; k++) { const v = yMax * k / 4, yy = y(v); ctx.beginPath(); ctx.moveTo(pad.l, yy); ctx.lineTo(W - pad.r, yy); ctx.stroke(); ctx.fillText(Math.round(v), pad.l - 8, yy); }
  // x labels
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  const stepX = Math.ceil(n / 8);
  for (let i = 0; i < n; i += stepX) ctx.fillText(fmtDate(dateAt(i)), x(i), H - pad.b + 8);

  // forecast band
  ctx.fillStyle = col('--accent-2'); ctx.globalAlpha = .16;
  ctx.beginPath(); ctx.moveTo(x(SHOW - 1), y(actual[SHOW - 1]));
  fc.forEach((v, k) => ctx.lineTo(x(SHOW + k), y(v + band)));
  for (let k = h - 1; k >= 0; k--) ctx.lineTo(x(SHOW + k), y(Math.max(0, fc[k] - band)));
  ctx.lineTo(x(SHOW - 1), y(actual[SHOW - 1])); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;

  // actual area + line
  const grad = ctx.createLinearGradient(0, pad.t, 0, H - pad.b);
  grad.addColorStop(0, col('--accent')); grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = .22; ctx.fillStyle = grad;
  ctx.beginPath(); ctx.moveTo(x(0), y(0)); actual.forEach((v, i) => ctx.lineTo(x(i), y(v))); ctx.lineTo(x(SHOW - 1), y(0)); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
  ctx.strokeStyle = col('--accent'); ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
  ctx.beginPath(); actual.forEach((v, i) => i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v))); ctx.stroke();

  // forecast line (dashed)
  ctx.strokeStyle = col('--accent-2'); ctx.setLineDash([7, 5]); ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(x(SHOW - 1), y(actual[SHOW - 1])); fc.forEach((v, k) => ctx.lineTo(x(SHOW + k), y(v))); ctx.stroke(); ctx.setLineDash([]);

  // today divider
  ctx.strokeStyle = col('--muted'); ctx.globalAlpha = .5; ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x(SHOW - 1), pad.t); ctx.lineTo(x(SHOW - 1), H - pad.b); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
  ctx.fillStyle = col('--muted'); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('Today', x(SHOW - 1) + 6, pad.t + 2);
  ctx.fillStyle = col('--accent'); ctx.beginPath(); ctx.arc(x(SHOW - 1), y(actual[SHOW - 1]), 4.5, 0, 7); ctx.fill();

  const total = sumArr(fc);
  $('#fcMeta').textContent = `${FORECAST_METHODS[method]} · forecast ${Math.round(total)} units over ${h} days · backtest error (MAPE) ${bt.mape.toFixed(1)}% · synthetic sales data`;
  const recentAverage = sumArr(series.slice(-28)) / Math.min(28, series.length);
  const previousAverage = sumArr(series.slice(-56, -28)) / Math.max(1, Math.min(28, series.length - 28));
  const change = previousAverage ? (recentAverage - previousAverage) / previousAverage * 100 : 0;
  const projectedDaily = total / h;
  const inventory = pid === 'all' ? state.products.reduce((sum, product) => sum + product.stock, 0) : getP(pid).stock;
  const cover = projectedDaily > 0 ? inventory / projectedDaily : Infinity;
  const trendText = change > 5 ? `Recent demand is trending up ${Math.round(change)}% against the prior 28 days.`
    : change < -5 ? `Recent demand is trending down ${Math.round(Math.abs(change))}% against the prior 28 days.`
      : 'Recent demand is broadly steady against the prior 28 days.';
  const coverText = Number.isFinite(cover) ? ` At the forecast pace, current stock covers about ${cover.toFixed(1)} days.` : ' No demand is forecast for this period.';
  $('#forecastInsight').innerHTML = `<b>Forecast interpretation · rule-based demo</b><span>${trendText}${coverText} This is a transparent local summary, not a generative AI service.</span>`;
  chartInfo = { pad, W, H, n, SHOW, actual, fc, band, x, y, dateAt };
}
function onChartMove(e) {
  if (!chartInfo) return;
  const { pad, W, n, SHOW, actual, fc, band, x, dateAt } = chartInfo;
  const r = $('#chartWrap').getBoundingClientRect(), mx = e.clientX - r.left;
  const i = Math.max(0, Math.min(n - 1, Math.round((mx - pad.l) / ((W - pad.l - pad.r) / (n - 1)))));
  const isF = i >= SHOW, val = isF ? fc[i - SHOW] : actual[i];
  const tip = $('#chartTip'), line = $('#chartLine');
  tip.innerHTML = `<b>${dateAt(i).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</b><br>${isF ? 'Forecast' : 'Actual'}: ${isF ? val.toFixed(1) : val} units${isF ? `<br>Range: ${Math.max(0, val - band).toFixed(0)}–${(val + band).toFixed(0)}` : ''}`;
  const tx = x(i); line.style.left = tx + 'px'; line.style.opacity = '.4';
  tip.style.left = Math.min(Math.max(8, tx + 12), W - tip.offsetWidth - 8) + 'px'; tip.style.opacity = '1';
}
function onChartLeave() { $('#chartTip').style.opacity = '0'; $('#chartLine').style.opacity = '0'; }

function exportCsv() {
  const method = $('#fcMethod').value;
  const rows = [['product_id', 'product_name', 'method', 'forecast_date', 'predicted_quantity']];
  state.products.forEach(p => fitForecast(getSeries(p), 30, new Date(), method).forEach((v, k) =>
    rows.push([p.id, '"' + p.name.replace(/"/g, '""') + '"', FORECAST_METHODS[method], new Date(Date.now() + (k + 1) * DAY).toISOString().slice(0, 10), v.toFixed(2)])));
  const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'quazar_demand_forecast.csv'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('Forecast CSV downloaded');
}

/* ---------- Product editor (admin) ---------- */
function openProductForm(id = null) {
  const p = id ? getP(id) : { name: '', cat: '', emoji: '📦', image: '', price: '', old: '', stock: '', desc: '' };
  const cats = [...new Set(state.products.map(x => x.cat))];
  $('#productBody').innerHTML = `
    <h2>${id ? 'Edit product' : 'Add product'}</h2>
    <form class="form" id="prodForm" data-id="${id || ''}">
      <div class="row2"><div class="field"><label>Name</label><input name="name" required value="${esc(p.name)}"></div>
      <div class="field"><label>Emoji icon</label><input name="emoji" required maxlength="4" value="${esc(p.emoji)}"></div></div>
      <div class="field"><label>Product image URL</label><input name="image" type="url" placeholder="https://example.com/product.jpg" value="${esc(productImage(p))}"></div>
      <div class="field"><label>Category</label><input name="cat" required list="catOptions" value="${esc(p.cat)}"><datalist id="catOptions">${cats.map(c => `<option value="${esc(c)}">`).join('')}</datalist></div>
      <div class="row2"><div class="field"><label>Price (₱)</label><input name="price" type="number" min="1" step="0.01" required value="${p.price}"></div>
      <div class="field"><label>Old price (optional)</label><input name="old" type="number" min="0" step="0.01" value="${p.old || ''}"></div></div>
      <div class="field"><label>Stock</label><input name="stock" type="number" min="0" step="1" required value="${p.stock}"></div>
      <div class="field"><label>Description</label><textarea name="desc" required>${esc(p.desc)}</textarea></div>
      <button class="btn primary lg block" type="submit">${id ? 'Save changes' : 'Add product'}</button>
    </form>`;
  openModal('modalProduct');
}
function onProductSubmit(e) {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target).entries()), id = e.target.dataset.id;
  const data = { name: f.name.trim(), emoji: f.emoji.trim(), image: f.image.trim(), cat: f.cat.trim(), price: +f.price, old: +f.old || 0, stock: Math.floor(+f.stock), desc: f.desc.trim() };
  if (id) { Object.assign(getP(id), data); toast('Product updated'); }
  else {
    const nid = Math.max(0, ...state.products.map(p => p.id)) + 1;
    state.products.push({ id: nid, rating: 4.5, reviews: 0, sold: 0, isNew: true, ...data }); toast('Product added');
  }
  persist.products(); closeModal('modalProduct'); refreshCatalog(); renderAdmin();
}
function refreshCatalog() { renderFilters(); renderGrid(); renderFlash(); renderBundleCategories(); renderRecent(); if (state.view === 'wishlist') renderWishlist(); }

const BLOG_ARTICLES = {
  'confident-shopping': {
    category: 'SHOPPING GUIDE',
    title: 'How to shop online with confidence',
    intro: 'A little preparation can make online shopping easier and help you choose products you will be happy with.',
    sections: [
      ['Start with what you need', 'Make a short list of the features that matter most. Knowing your priorities helps you compare options without getting distracted by extras.'],
      ['Read the product details', 'Check dimensions, materials, included accessories, and care instructions. Clear details help set the right expectations before you order.'],
      ['Compare value, not only price', 'Consider ratings, useful features, delivery, and how often you expect to use the item. The best choice is the one that fits your needs and budget.']
    ]
  },
  'budget-bundle': {
    category: 'SMART PICKS',
    title: 'Build a useful bundle on any budget',
    intro: 'A thoughtful bundle can make shopping more convenient without stretching your budget.',
    sections: [
      ['Set a comfortable limit', 'Choose a budget before browsing and leave a little room for delivery or other costs.'],
      ['Choose a main item first', 'Start with the item you need most. Then look for complementary products that add real usefulness rather than filling the cart.'],
      ['Review before checkout', 'Check quantities, prices, and stock one last time. Remove anything that does not support the plan you started with.']
    ]
  },
  'buying-checklist': {
    category: 'PRODUCT TIPS',
    title: 'What to look for before you buy',
    intro: 'Product pages include useful clues to help you decide whether an item is a good fit.',
    sections: [
      ['Check the specifications', 'Look closely at size, compatibility, materials, and included components so the product works for your situation.'],
      ['Use ratings as one signal', 'Ratings can help you spot common strengths and concerns. Consider them alongside the description and your own priorities.'],
      ['Confirm availability', 'Review the stock status and estimated delivery information before placing an order.']
    ]
  }
};

function openBlogArticle(button) {
  const article = BLOG_ARTICLES[button.dataset.article];
  if (!article) return toast('This article is unavailable right now.', 'err');
  $('#articleBody').innerHTML = `
    <article class="article-content">
      <span class="journal-category">${esc(article.category)} · QUAZAR JOURNAL</span>
      <h2>${esc(article.title)}</h2>
      <p>${esc(article.intro)}</p>
      ${article.sections.map(([heading, body]) => `<h3>${esc(heading)}</h3><p>${esc(body)}</p>`).join('')}
      <button class="btn primary" type="button" data-action="closeArticleShop">Explore products</button>
    </article>`;
  openModal('modalArticle');
}

/* =====================================================
   NAVIGATION
   ===================================================== */
function viewFromHash() {
  const [section, view] = location.hash.replace(/^#\/?/, '').split('/');
  if (section === 'admin') return 'admin';
  if (section === 'seller') return 'seller';
  if (section === 'rider') return 'rider';
  if (section === 'customer' && ['shop', 'wishlist', 'orders'].includes(view)) return view;
  return null;
}

function nav(view, syncRoute = true) {
  if (!['shop', 'wishlist', 'orders', 'admin', 'seller', 'rider'].includes(view)) view = 'shop';
  if (!state.user && view !== 'shop') {
    openAuth('login', 'Sign in to access your account.');
    return;
  }
  if (state.user?.role === 'admin' && view !== 'admin') {
    toast('Admins can only access the admin dashboard.', 'warn');
    view = 'admin';
  } else if (state.user?.role === 'seller' && view !== 'seller') {
    toast('Sellers can only access the seller dashboard.', 'warn');
    view = 'seller';
  } else if (state.user?.role === 'rider' && view !== 'rider') {
    toast('Riders can only access the rider dashboard.', 'warn');
    view = 'rider';
  } else if (state.user && state.user?.role !== 'admin' && state.user?.role !== 'seller' && state.user?.role !== 'rider' && view === 'admin') {
    toast('Admin access only', 'warn');
    view = 'shop';
  }
  state.view = view;
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.nav === view));
  if (syncRoute) {
    if (view === 'admin') location.hash = '#/admin/dashboard';
    else if (view === 'seller') location.hash = '#/seller/dashboard';
    else if (view === 'rider') location.hash = '#/rider/dashboard';
    else location.hash = `#/customer/${view}`;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (view === 'wishlist') renderWishlist();
  if (view === 'orders') renderOrders();
  if (view === 'admin') renderAdmin();
  if (view === 'seller') renderSellerDashboard();
  if (view === 'rider') renderRiderDashboard();
}

window.addEventListener('hashchange', () => {
  const requested = viewFromHash();
  if (!state.user && requested && requested !== 'shop') {
    nav('shop');
    openAuth('login', 'Sign in to access that page.');
    return;
  }
  nav(requested || (state.user?.role === 'admin' ? 'admin' : state.user?.role === 'seller' ? 'seller' : state.user?.role === 'rider' ? 'rider' : 'shop'));
});

function renderSellerDashboard() {
  const seller = state.user; 
  if (seller?.role !== 'seller') return;
  $('#sellerDashboard').innerHTML = `
    <div class="kpi"><span>Today sales</span><b>₱0.00</b><em class="up">▲ 0.0%</em></div>
    <div class="kpi"><span>Total orders</span><b>0</b></div>
    <div class="kpi"><span>Pending orders</span><b>0</b></div>
    <div class="kpi"><span>Low stock</span><b>0</b></div>
    <div class="kpi"><span>Earnings</span><b>₱0.00</b></div>
  `;
}

function renderRiderDashboard() {
  const rider = state.user;
  if (rider?.role !== 'rider') return;
  $('#riderDashboard').innerHTML = `
    <div class="kpi"><span>Online</span><b>Offline</b></div>
    <div class="kpi"><span>Today deliveries</span><b>0</b></div>
    <div class="kpi"><span>Today earnings</span><b>₱0.00</b></div>
    <div class="kpi"><span>Active delivery</span><b>None</b></div>
  `;
}

/* =====================================================
   EVENTS
   ===================================================== */
const actions = {
  quick: el => openQuick(el.dataset.id),
  add: el => addToCart(+el.dataset.id, 1, el),
  buildBundle,
  addBundle: () => {
    if (!currentBundle.length) return toast('Build a bundle first', 'warn');
    currentBundle.forEach(id => addToCart(id));
    openCart();
  },
  wish: el => toggleWish(el.dataset.id),
  notify: el => toast(`We'll notify you when "${getP(el.dataset.id).name}" is back 🔔`),
  cat: el => { state.filters.cat = el.dataset.cat; state.visible = 9; renderFilters(); renderGrid(); },
  rate: el => { state.filters.minRating = +el.dataset.rate; state.visible = 9; renderFilters(); renderGrid(); },
  resetFilters: () => { state.filters = { q: '', cat: 'All', sort: 'featured', maxPrice: Infinity, minRating: 0, inStock: false }; $('#searchInput').value = ''; state.visible = 9; renderFilters(); renderGrid(); },
  loadMore: () => { state.visible += 9; renderGrid(); },
  viewMode: el => { $('#productGrid').classList.toggle('list', el.dataset.mode === 'list'); $$('.seg button').forEach(b => b.classList.toggle('active', b === el)); },
  toggleFilters: () => $('#filters').classList.toggle('open'),
  scrollProducts: (el, e) => { e.preventDefault(); $('#products').scrollIntoView({ behavior: 'smooth' }); },
  scrollBlog: () => $('#journal').scrollIntoView({ behavior: 'smooth', block: 'start' }),
  openBlogArticle,
  closeArticleShop: () => { closeModal('modalArticle'); $('#products').scrollIntoView({ behavior: 'smooth' }); },
  clearRecent: () => { state.recent = []; persist.recent(); renderRecent(); },
  wishToCart: () => { const ok = state.wishlist.map(getP).filter(p => p && p.stock > 0); ok.forEach(p => addToCart(p.id)); if (!ok.length) toast('Nothing available to add', 'warn'); else openCart(); },
  // cart
  openCart, closeCart,
  inc: el => addToCart(+el.dataset.id, 1),
  dec: el => { const l = state.cart.find(x => x.id === +el.dataset.id); if (!l) return; l.qty--; if (l.qty <= 0) state.cart = state.cart.filter(x => x !== l); persist.cart(); renderCart(); },
  remove: el => { state.cart = state.cart.filter(x => x.id !== +el.dataset.id); persist.cart(); renderCart(); toast('Item removed', 'warn'); },
  applyPromo: () => { const c = $('#promoInput').value.trim().toUpperCase(); if (!PROMOS[c]) return toast('Invalid promo code', 'err'); state.promo = c; persist.promo(); renderCart(); toast(`Promo ${c} applied 🎉`); },
  removePromo: () => { state.promo = null; persist.promo(); renderCart(); },
  checkout: openCheckout,
  reorder: el => { const o = state.orders.find(x => x.id === el.dataset.oid); o?.items.forEach(i => addToCart(i.id, i.qty)); openCart(); },
  // quick view
  qvPlus: () => { const p = getP(qvId); if (qvQty < p.stock) qvQty++; else toast(`Only ${p.stock} in stock`, 'warn'); $('#qvQty').textContent = qvQty; $('#quickBody [data-action="buyNow"]').dataset.qty = qvQty; },
  qvMinus: () => { if (qvQty > 1) qvQty--; $('#qvQty').textContent = qvQty; $('#quickBody [data-action="buyNow"]').dataset.qty = qvQty; },
  qvAdd: el => { addToCart(qvId, qvQty, el); closeModal('modalQuick'); },
  buyNow: el => beginBuyNow(+el.dataset.id, el.dataset.qty),
  // auth + checkout
  openAuth: () => openAuth('login'),
  openRegister: () => openAuth('register'),
  closeAuthScreen,
  authRole: el => {
    authRole = normalizeRole(el.dataset.role);
    authMode = 'login';
    authStep = 1;
    renderAuth('', '', 'forward');
  },
  applyRole: el => {
    authRole = normalizeRole(el.dataset.role);
    authMode = 'register';
    authStep = 1;
    renderAuth('', '', 'forward');
  },
  switchAccount: () => {
    state.user = null;
    persist.user();
    updateAccountUI();
    openAuth('login');
  },
  authTab: el => { const direction = el.dataset.mode === 'register' ? 'forward' : 'backward'; authMode = el.dataset.mode; authStep = 1; renderAuth('', '', direction); },
  authMethod: el => { const direction = el.dataset.method === 'phone' ? 'forward' : 'backward'; authMethod = el.dataset.method; authStep = 1; renderAuth('', '', direction); },
  authBack: () => { authStep = 1; renderAuth('', '', 'backward'); },
  forgotPassword: () => { authMode = 'login'; authMethod = 'email'; authStep = 'forgotEmail'; renderAuth('', '', 'forward'); },
  resetBack: () => { authMode = 'login'; authMethod = 'email'; authStep = 1; resetCode = ''; resetEmail = ''; resetCodeExpires = 0; renderAuth('', '', 'backward'); },
  fbLogin: () => { authStep = 'fb'; renderAuth('', '', 'forward'); },
  enterAuth: () => {
    const screen = $('#authScreen');
    if (!screen.classList.contains('is-intro')) return;
    screen.classList.remove('is-intro');
    screen.classList.add('is-entering');
    setTimeout(() => screen.classList.remove('is-entering'), 650);
  },
  chooseAvatar: () => $('#profilePhotoInput')?.click(),
  resendOtp: () => sendOtp(),
  changePhone: () => { authStep = 1; renderAuth(); },
  logout,
  coBack: () => { co.step = Math.max(1, co.step - 1); renderCheckout(); },
  // modals
  closeModal: el => { const m = el.closest('.modal'); if (m) closeModal(m.id); },
  closeAll: closeAllModals,
  // admin
  exportCsv: () => { if (state.user?.role === 'admin') exportCsv(); else toast('Admin access only', 'err'); },
  newProduct: () => { if (state.user?.role === 'admin') openProductForm(); else toast('Admin access only', 'err'); },
  editProduct: el => { if (state.user?.role === 'admin') openProductForm(+el.dataset.id); else toast('Admin access only', 'err'); },
  delProduct: el => {
    if (state.user?.role !== 'admin') return toast('Admin access only', 'err');
    const p = getP(el.dataset.id);
    if (!p || !confirm(`Delete "${p.name}"?`)) return;
    state.products = state.products.filter(x => x.id !== p.id); state.cart = state.cart.filter(l => l.id !== p.id); state.wishlist = state.wishlist.filter(i => i !== p.id);
    state.reviews = state.reviews.filter(review => review.productId !== p.id);
    persist.products(); persist.cart(); persist.wish(); persist.reviews(); updateBadges(); refreshCatalog(); renderAdmin(); toast('Product deleted', 'warn');
  },
  restock: el => {
    if (state.user?.role !== 'admin') return toast('Admin access only', 'err');
    const p = getP(el.dataset.id);
    if (!p) return toast('Product not found.', 'err');
    p.stock += +el.dataset.qty; persist.products(); refreshCatalog(); renderAdmin(); toast(`Restocked ${p.name} (+${el.dataset.qty})`);
  },
  adjustStock: el => {
    if (state.user?.role !== 'admin') return toast('Admin access only', 'err');
    const p = getP(el.dataset.id), delta = Number(el.dataset.delta);
    if (!p || ![-1, 1].includes(delta)) return toast('Could not update product stock.', 'err');
    if (p.stock + delta < 0) return toast('Stock cannot be less than zero.', 'warn');
    p.stock += delta;
    persist.products(); renderProductTable(); renderReorder(); renderKpis(); drawChart();
    toast(`${p.name} stock ${delta > 0 ? 'increased' : 'decreased'} to ${p.stock}.`);
  },
  toggleCustomerBlock: el => {
    if (state.user?.role !== 'admin') return toast('Admin access only', 'err');
    const key = decodeURIComponent(el.dataset.customer || '');
    const customer = state.users.find(user => user.role === 'customer' && (user.email || user.phone || user.fbid) === key);
    if (!customer) return toast('Customer account not found.', 'err');
    customer.blocked = !customer.blocked;
    persist.users(); renderCustomerTable();
    toast(`${customer.name} ${customer.blocked ? 'blocked' : 'unblocked'}.`);
  },
  deleteCustomer: el => {
    if (state.user?.role !== 'admin') return toast('Admin access only', 'err');
    const key = decodeURIComponent(el.dataset.customer || '');
    const customer = state.users.find(user => user.role === 'customer' && (user.email || user.phone || user.fbid) === key);
    if (!customer) return toast('Customer account not found.', 'err');
    if (!confirm(`Permanently delete the account for ${customer.name}?`)) return;
    const deleteOrders = confirm('Also delete this customer’s orders? Click OK to delete them; Cancel keeps anonymized orders for reports.');
    state.users = state.users.filter(user => user !== customer);
    if (deleteOrders) {
      state.orders = state.orders.filter(order => order.user !== key);
    } else {
      state.orders.forEach(order => {
        if (order.user !== key) return;
        delete order.user;
        order.customer = 'Deleted customer';
        delete order.email;
        delete order.phone;
        delete order.address;
      });
    }
    state.reviews.forEach(review => {
      if (review.user !== key) return;
      delete review.user;
      review.customer = 'Deleted customer';
    });
    persist.users(); persist.orders(); persist.reviews();
    renderCustomerTable(); renderCustomerReviews(); renderAdminOrders(); renderSalesReport(); renderKpis();
    toast(`Deleted ${customer.name}${deleteOrders ? ' and associated orders' : '; order history anonymized'}.`, 'warn');
  },
  editOrderStatus: el => {
    if (state.user?.role !== 'admin') return toast('Admin access only', 'err');
    const row = el.closest('[data-order-row]');
    const editor = row?.querySelector('.order-status-editor');
    if (!editor) return toast('The order status editor is unavailable.', 'err');
    editor.hidden = false;
    el.hidden = true;
    editor.querySelector('select').focus();
  },
  saveOrderStatus: el => {
    // This front-end-only role check is not security; a real backend must enforce admin authorization.
    if (state.user?.role !== 'admin') return toast('Admin access only', 'err');
    const row = el.closest('[data-order-row]');
    const order = state.orders.find(item => item.id === el.dataset.oid);
    const status = row?.querySelector('.order-status-editor select')?.value;
    if (!order) return toast('Order not found. Refresh and try again.', 'err');
    if (!ORDER_STATUSES.includes(status)) return toast('Choose Packaging or Delivered.', 'err');
    order.status = status;
    persist.orders();
    renderAdminOrders();
    toast(`Order ${order.id} updated to ${status}.`);
  },
  cancelOrderStatus: () => renderAdminOrders()
};

document.addEventListener('click', e => {
  const act = e.target.closest('[data-action]');
  const nv = e.target.closest('[data-nav]');
  if (act && actions[act.dataset.action]) {
    if (act.tagName === 'A') e.preventDefault();
    actions[act.dataset.action](act, e);
  }
  if (nv) { e.preventDefault(); nav(nv.dataset.nav); }
  if (!e.target.closest('#searchBox')) $('#suggest').classList.remove('show');
  if (e.target.classList.contains('modal')) closeModal(e.target.id);   // click on backdrop
});

document.addEventListener('submit', e => {
  if (e.target.id === 'authForm') onAuthSubmit(e);
  else if (e.target.id === 'coForm') onCheckoutSubmit(e);
  else if (e.target.id === 'prodForm') onProductSubmit(e);
  else if (e.target.id === 'reviewForm') onReviewSubmit(e);
});

document.addEventListener('change', e => {
  if (e.target.id === 'profilePhotoInput') {
    saveProfilePhoto(e.target.files[0]);
    return;
  }
  if (e.target.name === 'paymentType' && e.target.closest('#coForm')) {
    co.data.payment = e.target.value === 'cod' ? 'cod' : co.data.payment === 'cod' ? 'gcash' : co.data.payment;
    renderCheckout();
    return;
  }
  if (e.target.name === 'delivery' && e.target.closest('#coForm')) {
    // keep typed values when delivery option changes
    Object.assign(co.data, Object.fromEntries(new FormData(e.target.closest('form')).entries())); renderCheckout();
  }
});
document.addEventListener('input', e => {
  if (e.target.name === 'cardnum') e.target.value = e.target.value.replace(/[^\d]/g, '').replace(/(.{4})/g, '$1 ').trim();
  if (e.target.name === 'exp') { let v = e.target.value.replace(/[^\d]/g, ''); if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2, 4); e.target.value = v; }
});

window.addEventListener('storage', e => {
  if (e.key === 'nx_orders') {
    state.orders = load('nx_orders', []).map(order => ({
      ...order,
      status: ORDER_STATUSES.includes(order.status) ? order.status : 'Packaging'
    }));
    if (state.view === 'orders') renderOrders();
    if (state.view === 'admin') {
      renderAdminOrders();
      renderSalesReport();
      renderCustomerTable();
    }
  }
  if (e.key === 'nx_users') {
    state.users = load('nx_users', []);
    if (state.view === 'admin') renderCustomerTable();
    if (state.user?.role === 'customer') {
      const account = state.users.find(user =>
        (state.user.email && user.email === state.user.email) ||
        (state.user.phone && user.phone === state.user.phone) ||
        (state.user.key && user.fbid === state.user.key)
      );
      if (!account || account.blocked) {
        state.user = null;
        persist.user();
        updateAccountUI();
        nav('shop');
        toast('This customer account is no longer active.', 'warn');
      }
    }
  }
  if (e.key === 'nx_reviews') {
    state.reviews = load('nx_reviews', []);
    if (state.view === 'admin') renderCustomerReviews();
    if (qvId && $('#modalQuick').classList.contains('open')) renderQuick();
  }
});

/* search + suggestions */
let searchTimer;
$('#searchInput').addEventListener('input', e => {
  const q = e.target.value.trim().toLowerCase();
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { state.filters.q = q; state.visible = 9; renderGrid(); }, 180);
  const box = $('#suggest');
  if (!q) return box.classList.remove('show');
  const m = state.products.filter(p => (p.name + ' ' + p.cat).toLowerCase().includes(q)).slice(0, 5);
  box.innerHTML = m.length ? m.map(p => `<button data-action="quick" data-id="${p.id}"><img class="s-image" src="${esc(productImage(p))}" alt=""><span><b>${esc(p.name)}</b><small>${esc(p.cat)} · ${money(p.price)}</small></span></button>`).join('') : '<div class="none">No matches — try another word</div>';
  box.classList.add('show');
});
$('#searchInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') { nav('shop'); $('#suggest').classList.remove('show'); setTimeout(() => $('#products').scrollIntoView({ behavior: 'smooth' }), 50); }
});
$('#sortSelect').addEventListener('change', e => { state.filters.sort = e.target.value; renderGrid(); });
$('#priceRange').addEventListener('input', e => { const v = +e.target.value; state.filters.maxPrice = v >= +e.target.max ? Infinity : v; state.visible = 9; $('#priceLabel').textContent = v >= +e.target.max ? 'Any' : '≤ ₱' + v.toLocaleString(); renderGrid(); });
$('#inStock').addEventListener('change', e => { state.filters.inStock = e.target.checked; renderGrid(); });
$('#fcProduct').addEventListener('change', drawChart);
$('#fcMethod').addEventListener('change', () => { renderForecastMethodOptions(); renderKpis(); drawChart(); renderReorder(); });
$('#fcHorizon').addEventListener('change', () => { drawChart(); renderReorder(); });
$('#salesRange').addEventListener('change', renderSalesReport);
$('#customerSearch').addEventListener('input', renderCustomerTable);
$('#adminOrderSearch').addEventListener('input', renderAdminOrders);
$('#adminOrderStatusFilter').addEventListener('change', renderAdminOrders);
['fcExpert1', 'fcExpert2', 'fcExpert3', 'fcPriceChange', 'fcPromoLift'].forEach(id => {
  $('#' + id).addEventListener('input', () => {
    if (['delphi', 'causal'].includes($('#fcMethod').value)) {
      renderKpis(); drawChart(); renderReorder();
    }
  });
});
$('#chartWrap').addEventListener('mousemove', onChartMove);
$('#chartWrap').addEventListener('mouseleave', onChartLeave);
$('#chartWrap').addEventListener('touchmove', e => onChartMove(e.touches[0]), { passive: true });
new ResizeObserver(() => drawChart()).observe($('#chartWrap'));

/* keyboard + scroll */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeAllModals();
    closeAuthScreen();
  }
  if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); $('#searchInput').focus(); }
});
window.addEventListener('scroll', () => $('#toTop').classList.toggle('show', window.scrollY > 600), { passive: true });
$('#toTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* =====================================================
   INIT
   ===================================================== */
function init() {
  updateAccountUI(); updateBadges(); renderFilters(); renderFlash(); renderBundleCategories(); renderRecent(); renderCart(); tickCountdown();
  authStandalone = false;
  $('#authScreen').hidden = true;
  $('#authScreen').classList.remove('is-intro', 'is-entering');
  document.body.classList.remove('auth-locked');
  showSkeleton();
  const initialView = viewFromHash();
  if (!state.user && initialView && initialView !== 'shop') {
    location.hash = '#/customer/shop';
    openAuth('login', 'Sign in to access that page.');
    nav('shop', false);
  } else {
    nav(initialView || (state.user?.role === 'admin' ? 'admin' : 'shop'));
  }
  setTimeout(renderGrid, 650);                // short skeleton loading effect
  setInterval(tickCountdown, 1000);
}
init();

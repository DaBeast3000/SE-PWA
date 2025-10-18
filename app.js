/* Minimal PWA front-end prototype for multi-TCG store.
   Replace mock data/fetches with real API endpoints for production.
*/
const state = {
  products: [],
  tcgs: [],
  sets: {},
  query: '',
  filters: { tcg: [], set: [], inStock: null, minPrice: 0, maxPrice: Infinity },
  cart: []
};

const el = {
  searchInput: () => document.getElementById('searchInput'),
  tcgTabs: () => document.getElementById('tcgTabs'),
  filters: () => document.getElementById('filters'),
  catalogue: () => document.getElementById('catalogue'),
  cartBtn: () => document.getElementById('cartBtn'),
  cartCount: () => document.getElementById('cartCount'),
  cartDrawer: () => document.getElementById('cartDrawer'),
  cartItems: () => document.getElementById('cartItems'),
  cartSubtotal: () => document.getElementById('cartSubtotal'),
  closeCart: () => document.getElementById('closeCart'),
  checkoutBtn: () => document.getElementById('checkoutBtn')
};

document.addEventListener('DOMContentLoaded', async () => {
  registerSW();
  loadCartFromStorage();
  await loadMetadata();
  await loadProducts();
  wireEvents();
  renderAll();
});

async function loadMetadata() {
  state.tcgs = ['One Piece','Pokémon','Magic','Yu-Gi-Oh','Lorcana','Gundam','Grand Archive','Hololive'];
  state.sets['One Piece'] = [{code:'op12',name:'OP12'},{code:'op11',name:'OP11'},{code:'prb02',name:'PRB02'}];
  state.sets['Pokémon'] = [{code:'scv',name:'Scarlet/Violet'},{code:'swsh',name:'Sword & Shield'}];
  state.sets['Magic'] = [{code:'m25',name:'Core Set 2025'},{code:'stx',name:'Strixhaven'}];
}

async function loadProducts() {
  state.products = [
    {id:1,name:'One Piece OP12 Booster Box',tcg:'One Piece',setCode:'op12',type:'sealed',price:12995,inStock:true,imageUrl:'/images/op12.jpg',releaseDate:'2025-09-01'},
    {id:2,name:'One Piece OP12 Single - Luffy',tcg:'One Piece',setCode:'op12',type:'single',price:2995,inStock:true,imageUrl:'/images/op12-luffy.jpg',releaseDate:'2025-09-01'},
    {id:3,name:'One Piece PRB02 Promo Pack',tcg:'One Piece',setCode:'prb02',type:'sealed',price:8995,inStock:false,imageUrl:'/images/prb02.jpg',releaseDate:'2025-06-12'},
    {id:4,name:'Pokémon Rare Holo',tcg:'Pokémon',setCode:'scv',type:'single',price:799,inStock:true,imageUrl:'/images/poke1.jpg',releaseDate:'2025-07-10'},
    {id:5,name:'Magic Commander Deck',tcg:'Magic',setCode:'m25',type:'sealed',price:4995,inStock:true,imageUrl:'/images/magic1.jpg',releaseDate:'2024-11-05'}
  ];
  const prices = state.products.map(p => p.price);
  state.filters.minPrice = Math.min(...prices);
  state.filters.maxPrice = Math.max(...prices);
}

function wireEvents() {
  el.searchInput().addEventListener('input', (e) => {
    state.query = e.target.value;
    renderCatalogue();
  });

  el.cartBtn().addEventListener('click', () => toggleCart(true));
  el.closeCart().addEventListener('click', () => toggleCart(false));
  el.checkoutBtn().addEventListener('click', () => alert('Checkout flow not implemented in demo'));
}

function renderAll() {
  renderTabs();
  renderFilters();
  renderCatalogue();
  updateCartUI();
}

function renderTabs() {
  const container = el.tcgTabs();
  container.innerHTML = '';
  state.tcgs.forEach(tcg => {
    const tab = document.createElement('div');
    tab.className = 'tcg-tab';
    tab.textContent = tcg;
    tab.addEventListener('mouseenter', (ev) => showSetFlyout(ev.currentTarget, tcg));
    tab.addEventListener('click', () => {
      state.filters.tcg = [tcg];
      state.filters.set = [];
      renderFilters();
      renderCatalogue();
    });
    container.appendChild(tab);
  });
}

let activeFlyout = null;
function showSetFlyout(targetEl, tcg) {
  if (activeFlyout) activeFlyout.remove();
  const fly = document.createElement('div');
  fly.className = 'flyout';
  const sets = state.sets[tcg] || [];
  if (!sets.length) {
    fly.textContent = 'No recent sets';
  } else {
    sets.slice(0,6).forEach(s => {
      const btn = document.createElement('button');
      btn.textContent = s.code;
      btn.style.padding = '6px 8px';
      btn.style.border = '1px solid #eee';
      btn.style.borderRadius = '6px';
      btn.style.background = '#fff';
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.filters.tcg = [tcg];
        state.filters.set = [s.code];
        renderFilters();
        renderCatalogue();
        fly.remove();
      });
      fly.appendChild(btn);
    });
  }
  document.body.appendChild(fly);
  const rect = targetEl.getBoundingClientRect();
  fly.style.left = `${rect.left}px`;
  fly.style.top = `${rect.bottom + 8}px`;
  activeFlyout = fly;

  const hide = () => { fly.remove(); activeFlyout = null; targetEl.removeEventListener('mouseleave', hide); };
  targetEl.addEventListener('mouseleave', hide);
}

function renderFilters() {
  const f = el.filters();
  f.innerHTML = '';

  const avail = document.createElement('div');
  avail.className = 'filter-section';
  avail.innerHTML = `<h4>Availability</h4>`;
  const availIn = document.createElement('label');
  availIn.innerHTML = `<input type="radio" name="avail" value="any" ${state.filters.inStock === null ? 'checked' : ''}> Any`;
  const availOnly = document.createElement('label');
  availOnly.innerHTML = `<input type="radio" name="avail" value="in" ${state.filters.inStock === true ? 'checked' : ''}> In stock`;
  const availOut = document.createElement('label');
  availOut.innerHTML = `<input type="radio" name="avail" value="out" ${state.filters.inStock === false ? 'checked' : ''}> Out of stock`;
  avail.appendChild(availIn); avail.appendChild(availOnly); avail.appendChild(availOut);
  f.appendChild(avail);
  f.querySelectorAll('input[name="avail"]').forEach(r => r.addEventListener('change', (e) => {
    const v = e.target.value;
    if (v === 'any') state.filters.inStock = null;
    else state.filters.inStock = v === 'in';
    renderCatalogue();
  }));

  const tcgSec = document.createElement('div'); tcgSec.className='filter-section';
  tcgSec.innerHTML = '<h4>TCG</h4>';
  state.tcgs.forEach(t => {
    const id = `tcg-${t.replace(/\s+/g,'-')}`;
    const row = document.createElement('div'); row.className='checkbox-row';
    row.innerHTML = `<label><input type="checkbox" id="${id}" ${state.filters.tcg.includes(t) ? 'checked' : ''}> ${t}</label>`;
    row.querySelector('input').addEventListener('change', (e) => {
      if (e.target.checked) state.filters.tcg.push(t); else state.filters.tcg = state.filters.tcg.filter(x => x !== t);
      renderCatalogue();
    });
    tcgSec.appendChild(row);
  });
  f.appendChild(tcgSec);

  const setSec = document.createElement('div'); setSec.className='filter-section';
  setSec.innerHTML = '<h4>Set</h4>';
  const relevantTcgs = state.filters.tcg.length ? state.filters.tcg : state.tcgs;
  const seen = new Set();
  relevantTcgs.forEach(t => {
    (state.sets[t] || []).forEach(s => {
      if (seen.has(s.code)) return;
      seen.add(s.code);
      const row = document.createElement('div'); row.className='checkbox-row';
      row.innerHTML = `<label><input type="checkbox" data-setcode="${s.code}" ${state.filters.set.includes(s.code) ? 'checked' : ''}> ${s.code} ${s.name ? '- ' + s.name : ''}</label>`;
      row.querySelector('input').addEventListener('change', (e) => {
        const code = e.target.dataset.setcode;
        if (e.target.checked) state.filters.set.push(code); else state.filters.set = state.filters.set.filter(x => x !== code);
        renderCatalogue();
      });
      setSec.appendChild(row);
    });
  });
  f.appendChild(setSec);

  const priceSec = document.createElement('div'); priceSec.className='filter-section';
  priceSec.innerHTML = '<h4>Price</h4>';
  const min = Math.floor(state.filters.minPrice/100);
  const max = Math.ceil(state.filters.maxPrice/100);
  const sliderWrap = document.createElement('div'); sliderWrap.className = 'price-range';
  const inputMin = document.createElement('input'); inputMin.type='range'; inputMin.min=min; inputMin.max=max; inputMin.value=min; inputMin.step=1;
  const inputMax = document.createElement('input'); inputMax.type='range'; inputMax.min=min; inputMax.max=max; inputMax.value=max; inputMax.step=1;
  const lbl = document.createElement('div'); lbl.style.fontSize='0.9rem'; lbl.style.color='var(--muted)'; lbl.textContent = `$${inputMin.value} - $${inputMax.value}`;
  sliderWrap.appendChild(inputMin); sliderWrap.appendChild(inputMax);
  priceSec.appendChild(sliderWrap); priceSec.appendChild(lbl);

  const updatePrice = () => {
    let a = Number(inputMin.value), b = Number(inputMax.value);
    if (a > b) [a,b] = [b,a];
    state.filters.minPrice = a*100;
    state.filters.maxPrice = b*100;
    lbl.textContent = `$${a} - $${b}`;
    renderCatalogue();
  };
  inputMin.addEventListener('input', updatePrice);
  inputMax.addEventListener('input', updatePrice);

  f.appendChild(priceSec);

  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'Clear filters';
  clearBtn.style.marginTop = '8px';
  clearBtn.addEventListener('click', () => {
    state.filters.tcg = []; state.filters.set = []; state.filters.inStock = null;
    const prices = state.products.map(p => p.price);
    state.filters.minPrice = Math.min(...prices);
    state.filters.maxPrice = Math.max(...prices);
    renderFilters();
    renderCatalogue();
  });
  f.appendChild(clearBtn);
}

function renderCatalogue() {
  const container = el.catalogue();
  container.innerHTML = '';
  const q = state.query.trim().toLowerCase();

  const results = state.products.filter(p => {
    if (state.filters.tcg.length && !state.filters.tcg.includes(p.tcg)) return false;
    if (state.filters.set.length && !state.filters.set.includes(p.setCode)) return false;
    if (state.filters.inStock !== null && p.inStock !== state.filters.inStock) return false;
    if (p.price < state.filters.minPrice || p.price > state.filters.maxPrice) return false;
    if (q) {
      const hay = `${p.name} ${p.tcg} ${p.setCode}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (!results.length) {
    const empty = document.createElement('div'); empty.style.gridColumn='1/-1'; empty.style.padding='40px'; empty.style.textAlign='center'; empty.style.color='var(--muted)';
    empty.textContent = 'No products match your search/filters.';
    container.appendChild(empty);
    updateCartUI();
    return;
  }

  results.forEach(p => {
    const card = document.createElement('div'); card.className = 'card';
    const img = document.createElement('img'); img.src = p.imageUrl || '/images/placeholder.png'; img.alt = p.name;
    const name = document.createElement('div'); name.className='name'; name.textContent = p.name;
    const price = document.createElement('div'); price.className='price'; price.textContent = `$${(p.price/100).toFixed(2)}`;
    const btn = document.createElement('button'); btn.className='add-btn'; btn.textContent='Add to cart';
    btn.addEventListener('click', () => addToCart(p.id));

    card.appendChild(img); card.appendChild(name); card.appendChild(price); card.appendChild(btn);
    container.appendChild(card);
  });

  updateCartUI();
}

function loadCartFromStorage() {
  try {
    const raw = localStorage.getItem('sc_cart');
    state.cart = raw ? JSON.parse(raw) : [];
  } catch {
    state.cart = [];
  }
}

function persistCart() {
  localStorage.setItem('sc_cart', JSON.stringify(state.cart));
}

function addToCart(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;
  const existing = state.cart.find(i => i.id === productId);
  if (existing) existing.qty++;
  else state.cart.push({ id: productId, name: product.name, price: product.price, qty: 1, image: product.imageUrl });
  persistCart();
  updateCartUI();
  el.cartBtn().animate([{ transform: 'scale(1.05)' }, { transform: 'scale(1)' }], { duration: 120 });
}

function updateCartUI() {
  const count = state.cart.reduce((s,i) => s + i.qty, 0);
  el.cartCount().textContent = count;
  if (!el.cartDrawer().hidden) renderCartDrawer();
}

function toggleCart(open) {
  if (open) {
    el.cartDrawer().hidden = false;
    el.cartDrawer().setAttribute('aria-hidden', 'false');
    renderCartDrawer();
  } else {
    el.cartDrawer().hidden = true;
    el.cartDrawer().setAttribute('aria-hidden', 'true');
  }
}

function renderCartDrawer() {
  const node = el.cartItems();
  node.innerHTML = '';
  if (!state.cart.length) {
    node.textContent = 'Your cart is empty.';
    el.cartSubtotal().textContent = '$0.00';
    return;
  }
  let subtotal = 0;
  state.cart.forEach(item => {
    const row = document.createElement('div'); row.className='cart-item';
    const img = document.createElement('img'); img.src = item.image || '/images/placeholder.png';
    const meta = document.createElement('div'); meta.style.flex='1';
    meta.innerHTML = `<div style="font-weight:700">${item.name}</div><div style="color:var(--muted)">$${(item.price/100).toFixed(2)}</div>`;
    const qtyWrap = document.createElement('div'); qtyWrap.style.display='flex'; qtyWrap.style.flexDirection='column'; qtyWrap.style.alignItems='flex-end';
    const qty = document.createElement('div'); qty.textContent = `x${item.qty}`; qty.style.marginBottom='8px';
    const remove = document.createElement('button'); remove.textContent='Remove'; remove.style.fontSize='0.8rem';
    remove.addEventListener('click', () => {
      state.cart = state.cart.filter(ci => ci.id !== item.id);
      persistCart();
      renderCartDrawer();
      updateCartUI();
    });
    qtyWrap.appendChild(qty); qtyWrap.appendChild(remove);
    row.appendChild(img); row.appendChild(meta); row.appendChild(qtyWrap);
    node.appendChild(row);
    subtotal += item.price * item.qty;
  });
  el.cartSubtotal().textContent = `$${(subtotal/100).toFixed(2)}`;
}

function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  }
}

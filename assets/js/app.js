

// === TourWings SPA (Server-Side, Admin Removed) ===

const STATE = {
  tours: [],
  page: 1,
  perPage: 6,
  search: '',
  sort: 'dateAsc',
  loading: false,
  error: null,
  totalPages: 1
};

const API_BASE = "http://127.0.0.1:8000"; // change in production

// ---- Helpers ----
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

function formatBDT(n){
  return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 })
    .format(n).replace('BDT','').trim() + '/-';
}

function debounce(fn, wait=250){
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(()=> fn(...args), wait); };
}

// ---- API Layer ----
async function loadTours(){
  STATE.loading = true; renderStatus();
  try {
    const params = new URLSearchParams({
      search: STATE.search,
      sort: STATE.sort,
      page: STATE.page,
      per_page: STATE.perPage
    });
    const res = await fetch(`${API_BASE}/tours/?${params.toString()}`);
    if(!res.ok) throw new Error(`Load failed: ${res.status}`);
    const data = await res.json();
    STATE.tours = data;
    STATE.error = null;

    const totalCount = res.headers.get("X-Total-Count");
    STATE.totalPages = totalCount ? Math.ceil(totalCount / STATE.perPage) : 1;
  } catch(e){
    console.error(e);
    STATE.error = "Could not load tours. Please try again.";
    STATE.tours = [];
    STATE.totalPages = 1;
  } finally {
    STATE.loading = false;
    render();
  }
}

// ---- Rendering ----
function renderStatus(){
  const status = $('#status');
  if(STATE.loading){
    status.textContent = "Loading tours…";
    status.hidden = false;
  } else if(STATE.error){
    status.textContent = STATE.error;
    status.hidden = false;
  } else {
    status.hidden = true;
  }
}

function createCard(t){
  const article = document.createElement('article');
  article.className = 'card';
  article.dataset.id = t.id;

  const media = document.createElement('div');
  media.className = 'card-media';
  const img = document.createElement('img');
  img.src = t.image || 'assets/img/placeholder.svg';
  img.alt = `${t.name} image`;
  media.appendChild(img);
  article.appendChild(media);

  const body = document.createElement('div');
  body.className = 'card-body';

  const header = document.createElement('div');
  header.style.display = "flex";
  header.style.gap = "10px";
  header.innerHTML = `
    <h3 class="card-title">${t.name}</h3>
    <span class="badge">${t.location}</span>
    <span class="price">${formatBDT(t.price)}</span>`;
  body.appendChild(header);

  const meta = document.createElement('div');
  meta.className = 'card-meta';
  meta.textContent = `📅 ${new Date(t.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}`;
  body.appendChild(meta);

  if(t.description){
    const desc = document.createElement('p');
    desc.className = 'card-desc';
    desc.textContent = t.description;
    body.appendChild(desc);
  }

  const actions = document.createElement('div');
  actions.className = 'card-actions';
  actions.innerHTML = `
    <a class="btn" href="/payment.html?tourId=${encodeURIComponent(t.id)}" data-book>Book Now</a>`;
  body.appendChild(actions);

  article.appendChild(body);
  return article;
}

function render(){
  renderStatus();
  const grid = $('#tourGrid');
  grid.innerHTML = "";
  STATE.tours.forEach(t => grid.appendChild(createCard(t)));

  // pagination
  const pag = $('#pagination');
  pag.innerHTML = "";
  for(let p=1;p<=STATE.totalPages;p++){
    const btn = document.createElement('button');
    btn.className = 'page-btn' + (p===STATE.page ? ' active':'');
    btn.textContent = p;
    btn.addEventListener("click", ()=>{
      STATE.page = p;
      loadTours();
    });
    pag.appendChild(btn);
  }
}

// ---- Events ----
function bindEvents(){
  $('#searchInput').addEventListener('input', debounce(e=>{
    STATE.search = e.target.value;
    STATE.page = 1;
    loadTours();
  }, 250));

  $('#sortSelect').addEventListener('change', e=>{
    STATE.sort = e.target.value;
    STATE.page = 1;
    loadTours();
  });
}

// ---- Bootstrap ----
(async function init(){
  bindEvents();
  await loadTours();
})();

// --- Modals ---
function toggleModal(id, show) {
  const modal = document.getElementById(id);
  if (!modal) return;
  if (show) modal.removeAttribute("hidden");
  else modal.setAttribute("hidden", "true");
}

document.getElementById("loginbtn").addEventListener("click", () => toggleModal("loginmodal", true));
document.getElementById("registerbtn").addEventListener("click", () => toggleModal("registermodal", true));
document.querySelectorAll(".close").forEach(el=>{
  el.addEventListener("click", ()=> toggleModal(el.getAttribute("data-close"), false));
});
document.querySelectorAll(".modal").forEach(modal=>{
  modal.addEventListener("click", e=>{
    if(e.target===modal) modal.setAttribute("hidden", "true");
  });
});

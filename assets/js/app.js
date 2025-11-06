

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
  actions.innerHTML = `
  <button class="btn" onclick="openBookingModal(${t.id})">Book Now</button>`;

  body.appendChild(actions);

  article.appendChild(body);
  return article;
}



async function login(email, password) {
  const response = await fetch("http://127.0.0.1:8000/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email,
      password: password
    }),
  });

  if (response.ok) {
    const data = await response.json();
    localStorage.setItem("token", data.access_token);
    alert("✅ Login successful!");
    toggleModal("loginmodal", false);
    await loadTours(); // optional refresh after login
  } else {
    const error = await response.json();
    alert("❌ Login failed. " + error.detail);
  }
}





async function register(email, password, full_name) {
  const response = await fetch("http://127.0.0.1:8000/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email,
      password: password,
      full_name: full_name
    }),
  });

  if (response.ok) {
    const data = await response.json();
    alert("✅ Registration successful! You can now log in.");
    toggleModal("registermodal", false);
  } else {
    const error = await response.json();
    alert("❌ Registration failed. " + error.detail);
  }
}




document.getElementById("registerform").addEventListener("submit", async (e) => {
  e.preventDefault(); // prevent page reload

  const email = document.getElementById("regemail").value;
  const password = document.getElementById("regpass").value;
  const full_name = document.getElementById("regname").value;

  try {
    await register(email, password, full_name);
  } catch (err) {
    console.error(err);
    alert("⚠️ Registration failed. Please try again.");
  }
});






// === LOGIN FORM HANDLER ===
document.getElementById("loginform").addEventListener("submit", async (e) => {
  e.preventDefault(); // stop reload

  const email = document.getElementById("loginemail").value;
  const password = document.getElementById("loginpass").value;

  try {
    await login(email, password); // call the async login() you defined
  } catch (err) {
    console.error(err);
    alert("⚠️ Login failed. Please try again.");
  }
});





document.getElementById("bookingform").addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = e.target;
  const formData = Object.fromEntries(new FormData(form));

  if (!selectedTourId) {
    alert("Please select a tour to book.");
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    alert("⚠️ You must be logged in to book a tour!");
    toggleModal("loginmodal", true);
    return;
  }

  // ✅ Parse number properly
  formData.persons = parseInt(formData.persons);
  formData.tour_id = selectedTourId;

  try {
    const res = await fetch(`${API_BASE}/booking/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    const data = await res.json(); // read response always

    if (!res.ok) {
      console.error("Booking API error:", data);
      throw new Error(data.detail || "Booking failed");
    }

    alert(`✅ Booking successful! Total price: ${data.total_price} BDT`);
    toggleModal("bookingmodal", false);
    form.reset();

  } catch (err) {
    console.error("Booking error:", err);
    alert("❌ Could not complete booking. Please try again.");
  }
});







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

let selectedTourId = null;

function openBookingModal(tour_id){
  selectedTourId = tour_id;
  toggleModal("bookingmodal", true);
}

document.querySelectorAll(".close").forEach(el=>{
  el.addEventListener("click", ()=> toggleModal(el.getAttribute("data-close"), false));
});
document.querySelectorAll(".modal").forEach(modal=>{
  modal.addEventListener("click", e=>{
    if(e.target===modal) modal.setAttribute("hidden", "true");
  });
});



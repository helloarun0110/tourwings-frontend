const API_BASE = "http://127.0.0.1:8000"; // backend base URL

const adminState = {
  tours: [],
  selectedTour: null,
};

// === Fetch All Tours ===
async function fetchTours() {
  try {
    const res = await fetch(`${API_BASE}/tours/`);
    if (!res.ok) throw new Error("Failed to load tours");
    const data = await res.json();
    adminState.tours = data;
    renderTours();
  } catch (err) {
    console.error(err);
    alert("❌ Could not load tours from server");
  }
}

// === Create a New Tour ===
async function createTour(e) {
  e.preventDefault();
  const form = e.target;
  const body = Object.fromEntries(new FormData(form));
  body.price = parseFloat(body.price);

  try {
    const res = await fetch(`${API_BASE}/tours/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error("Failed to create tour");

    alert("✅ Tour created successfully!");
    form.reset();
    fetchTours();
  } catch (err) {
    console.error(err);
    alert("❌ Could not create tour");
  }
}

// === Delete Tour ===
async function deleteTour(id) {
  if (!confirm("Are you sure you want to delete this tour?")) return;

  try {
    const res = await fetch(`${API_BASE}/tours/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete");
    alert("🗑️ Tour deleted!");
    fetchTours();
  } catch (err) {
    console.error(err);
    alert("❌ Could not delete tour");
  }
}

// === View Tour Details ===
function viewTour(id) {
  const tour = adminState.tours.find(t => t.id === id);
  if (!tour) return alert("Tour not found!");

  adminState.selectedTour = tour;

  // Populate modal
  const modal = document.getElementById("viewTourModal");
  modal.querySelector(".modal-title").textContent = tour.name;
  modal.querySelector(".modal-body").innerHTML = `
    <img src="${tour.image || 'assets/img/placeholder.svg'}" alt="${tour.name}" style="width:100%;border-radius:10px; margin-bottom:10px;">
    <p><b>Location:</b> ${tour.location}</p>
    <p><b>Date:</b> ${new Date(tour.date).toLocaleDateString()}</p>
    <p><b>Price:</b> ${tour.price} BDT</p>
    <p><b>Description:</b> ${tour.description || 'No description'}</p>
  `;
  modal.removeAttribute("hidden");
}

// === Render Tour List ===
function renderTours() {
  const grid = document.getElementById("adminTourList");
  grid.innerHTML = "";

  adminState.tours.forEach(t => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <div class="card-body">
        <h3>${t.name}</h3>
        <p>${t.location} — ${new Date(t.date).toLocaleDateString()}</p>
        <p><b>${t.price} BDT</b></p>
        <div class="card-actions">
          <button class="btn" onclick="viewTour(${t.id})">👁️ View</button>
          <button class="btn" onclick="viewBookings(${t.id})">🧾 Bookings</button>
          <button class="btn" onclick="exportBookings(${t.id})">📄 Export Pdf</button>
          <button class="btn" style="background:var(--danger);color:#fff" onclick="deleteTour(${t.id})">🗑️ Delete</button>
        </div>
      </div>
    `;
    grid.appendChild(div);
  });
}


function exportBookings(tourId){
  window.open(`${API_BASE}/booking/tour/${tourId}/export`, "_blank");
}



async function viewBookings(tourId){
  try{
    const res = await fetch(`${API_BASE}/booking/tour/${tourId}`);
    if(!res.ok) throw new Error("faild to load booking");
    const booking = await res.json();

    const modal = document.getElementById("bookingsModal");
    const body = modal.querySelector(".modal-body");
    const title = modal.querySelector(".modal-title");
    title.textContent = `Bookings for Tour #${tourId}`;

    body.innerHTML = booking.length
      ? `
      <table style="width:100%; border-collapse: collapse;">
      <tr><th>User Id</th><th>Persons</th><th>Total Price</th><th>Date</th><th>Status</th></tr>
      ${booking.map(b => `
        <tr>
          <td>${b.user_id}</td>
          <td>${b.persons}</td>
          <td>${b.total_price}</td>
          <td>${new Date(b.booking_date).toLocaleDateString()}</td>
          <td>${b.status}</td>

        </tr>
        `).join("")}
        </table>
      `
      : "<p> No bookings for this tour.</p>";

      modal.removeAttribute("hidden");

  } catch (err){
    console.error(err);
    alert("could not load bookings");
  }
}



// === Modal Logic ===
function closeModal() {
  document.getElementById("viewTourModal").setAttribute("hidden", "true");
}

// === Event Binding ===
document.getElementById("createTourForm").addEventListener("submit", createTour);
document.getElementById("closeViewModal").addEventListener("click", closeModal);
fetchTours();

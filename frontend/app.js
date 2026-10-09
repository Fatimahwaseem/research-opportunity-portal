const API = '/api/opportunities';
const FIELDS = ['title', 'description', 'research_area', 'faculty_name',
  'department', 'required_skills', 'positions', 'deadline', 'status'];
const detailsModal = new bootstrap.Modal(document.getElementById('detailsModal'));
const formModal = new bootstrap.Modal(document.getElementById('formModal'));

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function showMessage(text, type = 'success') {
  const box = document.getElementById('alerts');
  box.innerHTML = `<div class="alert alert-${type} alert-dismissible">${esc(text)}
    <button class="btn-close" data-bs-dismiss="alert"></button></div>`;
  setTimeout(() => (box.innerHTML = ''), 5000);
}

async function request(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

async function loadList() {
  try {
    const items = await request(API);
    const list = document.getElementById('list');
    if (!items.length) {
      list.innerHTML = '<p class="text-muted">No opportunities yet. Click "New opportunity" to add one.</p>';
      return;
    }
    list.innerHTML = items.map((o) => `
      <div class="col-md-6 col-lg-4"><div class="card h-100 shadow-sm"><div class="card-body d-flex flex-column">
        <div class="d-flex justify-content-between">
          <h5 class="card-title">${esc(o.title)}</h5>
          <span class="badge ${o.status === 'Open' ? 'bg-success' : 'bg-secondary'} align-self-start">${o.status}</span>
        </div>
        <p class="text-muted mb-1">${esc(o.research_area)} - ${esc(o.faculty_name)}</p>
        <p class="small">Deadline: ${o.deadline} | Positions: ${o.positions}</p>
        <div class="mt-auto d-flex flex-wrap gap-1">
          <button class="btn btn-sm btn-outline-primary" onclick="viewOne(${o.id})">View</button>
          <button class="btn btn-sm btn-outline-secondary" onclick="openForm(${o.id})">Edit</button>
          ${o.status === 'Open' ? `<button class="btn btn-sm btn-outline-warning" onclick="closeOpp(${o.id})">Close</button>` : ''}
          <button class="btn btn-sm btn-outline-danger" onclick="removeOpp(${o.id})">Delete</button>
        </div>
      </div></div></div>`).join('');
  } catch (e) { showMessage('Could not load opportunities: ' + e.message, 'danger'); }
}

async function viewOne(id) {
  try {
    const o = await request(`${API}/${id}`);
    document.getElementById('detailsTitle').textContent = o.title;
    document.getElementById('detailsBody').innerHTML = `
      <p>${esc(o.description)}</p>
      <ul class="list-unstyled mb-0">
        <li><b>Research area:</b> ${esc(o.research_area)}</li>
        <li><b>Faculty member:</b> ${esc(o.faculty_name)}</li>
        <li><b>Department:</b> ${esc(o.department)}</li>
        <li><b>Required skills:</b> ${esc(o.required_skills)}</li>
        <li><b>Available positions:</b> ${o.positions}</li>
        <li><b>Deadline:</b> ${o.deadline}</li>
        <li><b>Status:</b> ${o.status}</li>
      </ul>`;
    detailsModal.show();
  } catch (e) { showMessage(e.message, 'danger'); loadList(); }
}

async function openForm(id) {
  const form = document.getElementById('oppForm');
  form.reset();
  form.classList.remove('was-validated');
  document.getElementById('oppId').value = id || '';
  document.getElementById('formTitle').textContent = id ? 'Edit opportunity' : 'New opportunity';
  if (id) {
    try {
      const o = await request(`${API}/${id}`);
      FIELDS.forEach((f) => (document.getElementById(f).value = o[f]));
    } catch (e) { return showMessage(e.message, 'danger'); }
  }
  formModal.show();
}

document.getElementById('oppForm').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const form = ev.target;
  if (!form.checkValidity()) { form.classList.add('was-validated'); return; }
  const id = document.getElementById('oppId').value;
  const body = {};
  FIELDS.forEach((f) => (body[f] = document.getElementById(f).value.trim()));
  try {
    await request(id ? `${API}/${id}` : API, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    formModal.hide();
    showMessage(id ? 'Opportunity updated.' : 'Opportunity created.');
    loadList();
  } catch (e) { showMessage(e.message, 'danger'); }
});

async function closeOpp(id) {
  try {
    await request(`${API}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Closed' }),
    });
    showMessage('Opportunity closed.');
    loadList();
  } catch (e) { showMessage(e.message, 'danger'); }
}

async function removeOpp(id) {
  if (!confirm('Delete this opportunity? This cannot be undone.')) return;
  try {
    await request(`${API}/${id}`, { method: 'DELETE' });
    showMessage('Opportunity deleted.');
    loadList();
  } catch (e) { showMessage(e.message, 'danger'); }
}

loadList();

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'research_portal',
});

const FIELDS = ['title', 'description', 'research_area', 'faculty_name',
  'department', 'required_skills', 'positions', 'deadline', 'status'];

// Returns an error message string, or null if valid.
function validate(body, partial = false) {
  for (const f of FIELDS) {
    if (!partial && f !== 'status' && (body[f] === undefined || String(body[f]).trim() === ''))
      return `${f} is required`;
  }
  if (body.positions !== undefined && (!Number.isInteger(Number(body.positions)) || Number(body.positions) < 1))
    return 'positions must be a whole number of at least 1';
  if (body.deadline !== undefined && isNaN(Date.parse(body.deadline)))
    return 'deadline must be a valid date (YYYY-MM-DD)';
  if (body.status !== undefined && !['Open', 'Closed'].includes(body.status))
    return "status must be 'Open' or 'Closed'";
  return null;
}

const fmt = (r) => ({ ...r, deadline: new Date(r.deadline).toLocaleDateString('en-CA') });

// 1. Create
app.post('/api/opportunities', async (req, res) => {
  try {
    const err = validate(req.body);
    if (err) return res.status(400).json({ error: err });
    const b = req.body;
    const [result] = await pool.query(
      `INSERT INTO opportunities (title, description, research_area, faculty_name,
       department, required_skills, positions, deadline, status) VALUES (?,?,?,?,?,?,?,?,?)`,
      [b.title, b.description, b.research_area, b.faculty_name, b.department,
       b.required_skills, b.positions, b.deadline, b.status || 'Open']);
    const [rows] = await pool.query('SELECT * FROM opportunities WHERE id = ?', [result.insertId]);
    res.status(201).json(fmt(rows[0]));
  } catch (e) { console.error(e); res.status(500).json({ error: 'Internal server error' }); }
});

// 2. Get all
app.get('/api/opportunities', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM opportunities ORDER BY id DESC');
    res.status(200).json(rows.map(fmt));
  } catch (e) { console.error(e); res.status(500).json({ error: 'Internal server error' }); }
});

// 3. Get one
app.get('/api/opportunities/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM opportunities WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Opportunity not found' });
    res.status(200).json(fmt(rows[0]));
  } catch (e) { console.error(e); res.status(500).json({ error: 'Internal server error' }); }
});

// 4. Update (only fields that are sent are changed)
app.put('/api/opportunities/:id', async (req, res) => {
  try {
    const err = validate(req.body, true);
    if (err) return res.status(400).json({ error: err });
    const keys = FIELDS.filter((f) => req.body[f] !== undefined);
    if (!keys.length) return res.status(400).json({ error: 'No fields to update' });
    for (const k of keys)
      if (typeof req.body[k] === 'string' && req.body[k].trim() === '')
        return res.status(400).json({ error: `${k} cannot be empty` });
    const [result] = await pool.query(
      `UPDATE opportunities SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`,
      [...keys.map((k) => req.body[k]), req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Opportunity not found' });
    const [rows] = await pool.query('SELECT * FROM opportunities WHERE id = ?', [req.params.id]);
    res.status(200).json(fmt(rows[0]));
  } catch (e) { console.error(e); res.status(500).json({ error: 'Internal server error' }); }
});

// 5. Delete
app.delete('/api/opportunities/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM opportunities WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Opportunity not found' });
    res.status(200).json({ message: 'Opportunity deleted' });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Internal server error' }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

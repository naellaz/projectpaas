require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});


// === CONNECT DATABASE ===
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // penting untuk Railway
});

// === BUAT TABEL (sekali jalan) ===
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    photo VARCHAR(255)
  )
`).then(() => console.log("✅ Table 'users' siap"))
 .catch(err => console.error("❌ Gagal buat tabel:", err));

// === MIDDLEWARE ===
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use('/storage', express.static(path.join(__dirname, 'storage')));

// === MULTER UNTUK UPLOAD ===
if (!fs.existsSync(process.env.STORAGE_PATH)) {
  fs.mkdirSync(process.env.STORAGE_PATH);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.STORAGE_PATH);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// === ROUTES ===

// Halaman utama
app.get('/', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users ORDER BY id DESC");
    res.render('index', { users: result.rows });
  } catch (err) {
    res.send("❌ Error ambil data: " + err);
  }
});

// Simpan data
app.post('/submit', upload.single('photo'), async (req, res) => {
  const { name, email } = req.body;
  const photo = req.file ? req.file.filename : null;

  try {
    await pool.query(
      "INSERT INTO users (name, email, photo) VALUES ($1, $2, $3)",
      [name, email, photo]
    );
    res.redirect('/');
  } catch (err) {
    res.send("❌ Gagal simpan data: " + err);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});

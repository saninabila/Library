require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// Inisialisasi Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();
const app = express();

app.use(cors());
app.use(express.json());

// API Root Check
app.get('/api', (req, res) => {
  res.json({ message: 'API Sistem Perpustakaan Digital Berjalan!' });
});

// GET: Ambil Semua Buku
app.get('/api/books', async (req, res) => {
  try {
    const snapshot = await db.collection('books').orderBy('createdAt', 'desc').get();
    const books = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json({ success: true, data: books });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST: Tambah Buku Baru
app.post('/api/books', async (req, res) => {
  try {
    const { title, author, category, stock } = req.body;
    if (!title || !author) {
      return res.status(400).json({ success: false, message: 'Judul dan Penulis wajib diisi!' });
    }
    
    const newBook = { 
      title, 
      author, 
      category: category || 'Umum', 
      stock: Number(stock) || 1, 
      createdAt: new Date().toISOString() 
    };
    
    const docRef = await db.collection('books').add(newBook);
    res.status(201).json({ success: true, id: docRef.id, data: newBook });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Jalankan lokal jika bukan di Vercel
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server lokal berjalan di http://localhost:${PORT}`);
  });
}

module.exports = app;
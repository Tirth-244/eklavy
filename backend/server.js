import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import chapterRoutes from './routes/chapterRoutes.js';
import studentRoutes from './routes/studentRoutes.js';

// Import middleware
import errorHandler from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ── Global Middleware ─────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ── Database Connection ───────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err.message));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/students', studentRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Eklavya Backend is running ✅',
    env: process.env.NODE_ENV,
  });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler (must be last) ───────────────────────────────────────
app.use((req, res, next) => { const originalSend = res.send; res.send = function (data) { if (res.statusCode === 403) console.log("403 ON ROUTE:", req.method, req.originalUrl, data); return originalSend.apply(this, arguments); }; next(); });
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Eklavya Backend running on http://localhost:${PORT}`);
});

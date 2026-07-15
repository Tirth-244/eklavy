import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ── Task 1: Env Var Audit ─────────────────────────────────────────────────────
// BUG: On Render, env vars are set in the dashboard, NOT via .env file.
//      dotenv.config() loads nothing if .env is missing (which it should be
//      in production). If any var is missing, the app silently uses fallbacks
//      like 'http://localhost:5173' which breaks email links, CORS, etc.
// FIX: Log presence of every critical var at startup so you can immediately
//      spot what's missing in the Render dashboard.
(function envVarAudit() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  🔍 ENVIRONMENT VARIABLE AUDIT (startup)');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`NODE_ENV        = ${process.env.NODE_ENV || '❌ MISSING'}`);
  console.log(`PORT            = ${process.env.PORT || '(default 5000)'}`);
  console.log(`FRONTEND_URL    = ${process.env.FRONTEND_URL || '❌ MISSING'}`);
  console.log(`BACKEND_URL     = ${process.env.BACKEND_URL || '(not set, using fallback)'}`);
  console.log(`SMTP_HOST       = ${process.env.SMTP_HOST || '❌ MISSING'}`);
  console.log(`SMTP_PORT       = ${process.env.SMTP_PORT || '❌ MISSING'}`);
  console.log(`SMTP_USER       = ${process.env.SMTP_USER || '❌ MISSING'}`);
  console.log(`EMAIL_FROM      = ${process.env.EMAIL_FROM || '(not set, will fallback to SMTP_USER)'}`);
  console.log(`SMTP_PASSWORD   = ${process.env.SMTP_PASSWORD ? '✅ Loaded' : '❌ Missing'}`);
  console.log(`JWT_SECRET      = ${process.env.JWT_SECRET ? '✅ Loaded' : '❌ Missing'}`);
  console.log(`MONGODB_URL     = ${process.env.MONGODB_URL ? '✅ Loaded (credentials hidden)' : '❌ Missing'}`);
  console.log(`JWT_EXPIRES_IN  = ${process.env.JWT_EXPIRES_IN || '(default 7d)'}`);

  if (!process.env.FRONTEND_URL && process.env.NODE_ENV === 'production') {
    console.error('🚨 FRONTEND_URL is missing. Verification emails will link to localhost!');
  }
  if (!process.env.JWT_SECRET) {
    console.error('🚨 JWT_SECRET is missing. Token signing will crash!');
  }
  if (!process.env.MONGODB_URL) {
    console.error('🚨 MONGODB_URL is missing. Database connection will fail!');
  }
  console.log('═══════════════════════════════════════════════════════\n');
})();

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
import lectureRoutes from './routes/lectureRoutes.js';
import streamRoutes from './routes/streamRoutes.js';


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

// ── Task 4: Database Connection with detailed logging ─────────────────────────
// BUG: Original only logged err.message, hiding auth failures, DNS issues,
//      and IP-whitelist problems that are common on Render (dynamic IPs).
// FIX: Log full error object and Mongoose connection events.
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log('✅ MongoDB Connected successfully'))
  .catch((err) => {
    console.error('❌ MongoDB Connection FAILED');
    console.error('   Error name:', err.name);
    console.error('   Error message:', err.message);
    console.error('   Error code:', err.code);
    console.error('   Full error:', err);
  });

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB runtime error:', err.message);
});
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});
mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

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
app.use('/api/lectures', lectureRoutes);
app.use('/api/stream', streamRoutes);



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

// ── Global Process Error Handlers ─────────────────────────────────────────────
// BUG: Unhandled promise rejections (e.g. failed email sends without await)
//      crash the process silently on Render with no logs.
// FIX: Log them explicitly so they appear in Render's log viewer.
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Promise Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception:', err);
  process.exit(1);
});

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Eklavya Backend running on port ${PORT}`);
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const hpp = require('hpp');
const sanitizeBody = require('./middleware/sanitizeMiddleware');
require('dotenv').config();

const authRoutes       = require('./routes/authRoutes');
const treeRoutes       = require('./routes/treeRoutes');
const userRoutes       = require('./routes/userRoutes');
const adminRoutes      = require('./routes/adminRoutes');
const airQualityRoutes = require('./routes/airQualityRoutes');
const chatRoutes       = require('./routes/chatRoutes');

const app = express();

// Trust first proxy (Render, Vercel) so rate limiting uses real client IP
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS — never fall back to wildcard in production
const allowedOrigin = process.env.FRONTEND_URL;
if (!allowedOrigin && process.env.NODE_ENV === 'production') {
  console.error('❌ FRONTEND_URL env var is not set — CORS will block all origins');
}
app.use(cors({
  origin: allowedOrigin || (process.env.NODE_ENV !== 'production' ? 'http://localhost:5173' : false),
  credentials: true,
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// HTTP Parameter Pollution protection
app.use(hpp());

// XSS + NoSQL injection sanitization (strips $-prefixed keys, deep-escapes
// values across body/query/params). Replaces express-mongo-sanitize, which
// reassigns req.query and crashes on Express 5's read-only query getter.
app.use(sanitizeBody);

// Rate limiting — strict for auth, relaxed for general API
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'محاولات كثيرة جداً، يرجى المحاولة بعد 15 دقيقة' },
});

// Progressive slowdown before hard cut-off on auth routes
const authSlowDown = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 5,
  delayMs: (used) => (used - 5) * 500,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'طلبات كثيرة جداً، يرجى المحاولة لاحقاً' },
});

// Apply rate limiting
app.use('/api/auth', authSlowDown, authLimiter);
app.use('/api', generalLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trees', treeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/air-quality', airQualityRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: '🌱 Green Iraq API is running' });
});

// 404 — unmatched routes return JSON like the rest of the API
app.use((req, res) => {
  res.status(404).json({ message: 'المسار غير موجود' });
});

// Centralized error handler — keeps responses as JSON and hides stack
// traces in production so internal details are never leaked to clients.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.message);

  // Multer upload errors (e.g. file too large) map to 400
  const status = err.status || (err.name === 'MulterError' ? 400 : 500);

  res.status(status).json({
    message:
      process.env.NODE_ENV === 'production'
        ? 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً'
        : err.message,
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));
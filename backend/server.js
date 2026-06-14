const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const sanitizeBody = require('./middleware/sanitizeMiddleware');
require('dotenv').config();

const authRoutes       = require('./routes/authRoutes');
const treeRoutes       = require('./routes/treeRoutes');
const userRoutes       = require('./routes/userRoutes');
const adminRoutes      = require('./routes/adminRoutes');
const airQualityRoutes = require('./routes/airQualityRoutes');

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

// NoSQL injection sanitization (strips $ and . from req.body/query/params)
app.use(mongoSanitize());

// XSS + deep NoSQL sanitization
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

// Health check
app.get('/', (req, res) => {
  res.json({ message: '🌱 Green Iraq API is running' });
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
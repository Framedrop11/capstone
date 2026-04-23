require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cookieParser = require('cookie-parser');
const cors       = require('cors');
const session    = require('express-session');
const passport   = require('passport');
const flash      = require('connect-flash');

const app  = express();
const PORT = process.env.PORT || 3000;

// ──── CORS (must be first, before all routes) ────
// In app.js - UPDATE the CORS section
app.use(cors({
  origin: ['https://*.ngrok-free.dev', 'http://localhost:3001', 'http://localhost:3005'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ──── Session configuration (preserved for passport-oauth2) ────
app.use(session({
  secret: process.env.SESSION_SECRET || 'clearscore-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// ──── Passport initialization (preserved) ────
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// ──── Middleware ────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// ──── Health check (for Docker / Jenkins) ────
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// ──── ClearScore API routes ────
const authRoutes    = require('./routes/auth');
const loanRoutes    = require('./routes/loan');
const analystRoutes = require('./routes/analyst');
const adminRoutes   = require('./routes/admin');

app.use('/api/auth',     authRoutes);
app.use('/api/loan',     loanRoutes);
app.use('/api/analyst',  analystRoutes);
app.use('/api/admin',    adminRoutes);

// ──── Google OAuth routes (PRESERVED - passport-oauth2 wiring) ────
// These remain exactly as they were
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', failureFlash: true }),
  (req, res) => {
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:3005/dashboard');
  }
);

// ──── 404 Handler ────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ──── Error Handler ────
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ──── Connect to MongoDB & start server ────
mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/loginpage')
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import ssoRoutes from './routes/sso.js';
import sequelize from './config/db.js';
import passport from './config/passport.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Debug logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/sso', ssoRoutes);

// Root
app.get('/', (req, res) => {
  res.json({
    message: 'Auth Service with SSO',
    endpoints: {
      test: '/sso/test',
      login: '/sso/login?redirect=http://localhost:3000',
      verify: '/sso/verify'
    }
  });
});

// Health
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

// 404 handler (must be last)
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method 
  });
});

sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server: http://localhost:${PORT}`);
    console.log(`🔐 Test SSO: http://localhost:${PORT}/sso/test`);
  });
});
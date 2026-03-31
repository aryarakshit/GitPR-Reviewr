require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const reviewRoutes = require('./routes/review');
const repoPrsRoutes = require('./routes/repoPrs');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3005;

// ─── Middleware ──────────────────────────────────────────────
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://localhost:3000',
    ];

app.use(helmet());

app.use(
  cors({
    origin: corsOrigins,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
);

const reviewLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please wait a minute before trying again.' },
});

app.use(express.json({ limit: '1mb' }));

// ─── Request logging (lightweight) ─────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`
    );
  });
  next();
});

// ─── Routes ─────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/review', reviewLimiter, reviewRoutes);
app.use('/api/repo-prs', reviewLimiter, repoPrsRoutes);

// ─── Global error handler ──────────────────────────────────
app.use(errorHandler);

// ─── Start server ──────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`\n🚀 PR Reviewer Backend running on http://localhost:${PORT}.`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Review endpoint: POST http://localhost:${PORT}/api/review\n`);

  if (!process.env.GROQ_API_KEY) {
    console.warn('⚠️  GROQ_API_KEY not set — AI analysis will fail.');
    console.warn('   Add your Groq API key to the .env file.\n');
  }

  if (!process.env.GITHUB_TOKEN) {
    console.warn('ℹ️  GITHUB_TOKEN not set — using unauthenticated GitHub API (60 req/hr limit).');
    console.warn('   Add a GitHub PAT to .env for higher rate limits (5000 req/hr).\n');
  }

  if (!process.env.CORS_ORIGIN) {
    console.warn('ℹ️  CORS_ORIGIN not set — only accepting requests from localhost origins.');
    console.warn('   Set CORS_ORIGIN in .env for deployed frontends (comma-separated).\n');
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please free the port or set a different PORT in .env.`);
    process.exit(1);
  }
  throw err;
});

module.exports = app;

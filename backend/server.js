const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const cors = require('cors');

const { load, flushNow } = require('./src/store');
const { authRequired } = require('./src/middleware');
const auth = require('./src/auth');
const personal = require('./src/personal');
const business = require('./src/business');
const payments = require('./src/payments');
const features = require('./src/features');

const app = express();
const PORT = Number(process.env.PORT) || 3001;

const APP_ORIGINS = (process.env.APP_ORIGINS || 'http://localhost:5173,https://*.monkeycode-ai.live')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function originAllowed(origin) {
  if (!origin) return false;
  for (const entry of APP_ORIGINS) {
    if (entry.startsWith('*.')) {
      const suffix = entry.slice(1);
      if (origin.endsWith(suffix)) return true;
    } else if (entry === origin) {
      return true;
    }
  }
  return false;
}

app.set('trust proxy', 1);
app.use(cors({
  origin: function (origin, cb) {
    if (!origin || originAllowed(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: false
}));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'");
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  if (req.secure && !/^https/.test(req.protocol + '://')) {}
  next();
});

app.use(express.json({
  limit: '256kb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

app.use('/api/health', (req, res) => res.json({ ok: true, service: 'husk-api', time: new Date().toISOString() }));

app.use('/api/auth', auth.router);
app.use('/api/personal', personal.router);
app.use('/api/business', business);
app.use('/api/webhooks', payments);
app.use('/api/payments', payments);
app.use('/api', features.router);

const distDir = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request payload too large.' });
  }
  if (err && err.status === 429) {
    return res.status(429).json({ error: err.message || 'Too many requests.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

const server = http.createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  load();
  console.log(`HUSK server listening on port ${PORT}`);
});

process.on('SIGINT', () => {
  flushNow();
  process.exit(0);
});

process.on('SIGTERM', () => {
  flushNow();
  process.exit(0);
});

module.exports = { app };

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const express = require('express');
const { load, persist, genId, nowIso } = require('./store');
const {
  authLimiter,
  sha256,
  checkAccountLock,
  recordFailure,
  resetFailures,
  sanitizeString,
  logAudit
} = require('./security');
const { authRequired } = require('./middleware');
const { publicUser, issueAccessToken, findUserById } = require('./user');
const { seedUserData } = require('./seed');

const router = express.Router();

const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL) || 7;

function issueRefreshToken(userId, device) {
  const db = load();
  const token = crypto.randomBytes(48).toString('hex');
  const hash = sha256(token);
  db.sessions.push({
    id: genId('ses'),
    userId,
    tokenHash: hash,
    device: sanitizeString(device || 'Unknown device', 60),
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    revoked: false
  });
  persist();
  return token;
}

function revokeSession(tokenHash) {
  const db = load();
  const s = db.sessions.find((x) => x.tokenHash === tokenHash);
  if (s) {
    s.revoked = true;
    s.revokedAt = nowIso();
    persist();
  }
}

function validateRegister(body) {
  const errors = [];
  if (!body.name || String(body.name).trim().length < 2) errors.push('Name must be at least 2 characters.');
  if (!body.username || !/^[a-zA-Z0-9_.-]{3,30}$/.test(String(body.username))) errors.push('Username must be 3-30 chars using letters, numbers, _ . -');
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email))) errors.push('A valid email is required.');
  if (!body.pin || !/^\d{4,6}$/.test(String(body.pin))) errors.push('PIN must be 4-6 digits.');
  if (body.mode === 'business' && body.role === 'employee') {
    if (!body.ownerCode) errors.push('Business code is required to register as an employee.');
  }
  return errors;
}

function createTokensForUser(user, device) {
  const access = issueAccessToken(user.id);
  const refresh = issueRefreshToken(user.id, device);
  return { access, refresh };
}

router.post('/register', authLimiter, async (req, res) => {
  const errors = validateRegister(req.body);
  if (errors.length) return res.status(400).json({ error: errors[0] });

  const db = load();
  const name = sanitizeString(req.body.name, 60);
  const username = String(req.body.username).toLowerCase();
  const email = String(req.body.email).toLowerCase();
  const mode = req.body.mode === 'business' ? 'business' : 'personal';
  const biometricEnabled = !!req.body.biometricEnabled;

  if (db.users.some((u) => u.username === username)) {
    return res.status(409).json({ error: 'Username is already taken.' });
  }
  if (db.users.some((u) => u.email === email)) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const pinHash = await bcrypt.hash(String(req.body.pin), 10);
  const paymentPinHash = req.body.paymentPin && /^\d{4,6}$/.test(String(req.body.paymentPin))
    ? await bcrypt.hash(String(req.body.paymentPin), 10)
    : null;

  let user = {
    id: genId('usr'),
    name,
    username,
    email,
    pinHash,
    paymentPinHash,
    biometricEnabled,
    mode,
    role: 'owner',
    ownerId: null,
    balance: 25000,
    dailyLimit: mode === 'business' ? 100000 : 50000,
    txnLimit: mode === 'business' ? 50000 : 20000,
    active: true,
    failedAttempts: 0,
    lockUntil: 0,
    createdAt: nowIso()
  };

  if (mode === 'business' && req.body.role === 'employee') {
    const owner = db.users.find((u) => u.mode === 'business' && u.role === 'owner' && u.employeeCode === String(req.body.ownerCode).trim());
    if (!owner) return res.status(404).json({ error: 'Invalid business code. Ask your business owner for the correct code.' });
    user = {
      ...user,
      role: 'employee',
      ownerId: owner.id,
      balance: 0,
      dailyLimit: owner.defaultEmployeeDailyLimit || 50000,
      txnLimit: owner.defaultEmployeeTxnLimit || 20000,
      mode: 'business'
    };
    logAudit(owner.id, user.id, 'employee_granted', `Employee "${name}" (@${username}) was granted access to ${owner.name}'s business.`);
  } else if (mode === 'business') {
    user.employeeCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    user.defaultEmployeeDailyLimit = Number(req.body.employeeDailyLimit) || 50000;
    user.defaultEmployeeTxnLimit = Number(req.body.employeeTxnLimit) || 20000;
  }

  db.users.push(user);
  seedUserData(db, user);
  persist();

  const tokens = createTokensForUser(user, req.body.device);
  res.status(201).json({ user: publicUser(user), employeeCode: user.employeeCode || null, ...tokens, biometricRequired: false });
});

router.post('/login', authLimiter, async (req, res) => {
  const db = load();
  const username = String(req.body.username || '').toLowerCase().trim();
  const pin = String(req.body.pin || '');
  const user = db.users.find((u) => u.username === username);

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or PIN.' });
  }
  if (user.active === false) {
    return res.status(403).json({ error: 'Your access has been revoked. Contact your business owner.' });
  }
  if (checkAccountLock(user)) {
    return res.status(429).json({ error: 'Account temporarily locked. Try again in 15 minutes.' });
  }

  const ok = await bcrypt.compare(pin, user.pinHash);
  if (!ok) {
    recordFailure(user);
    const remaining = Math.max(0, (user.lockUntil || 0) - Date.now());
    return res.status(401).json({
      error: 'Invalid username or PIN.',
      attemptsRemaining: user.lockUntil ? 0 : Math.max(0, require('./security').MAX_FAILED_ATTEMPTS - (user.failedAttempts || 0)),
      locked: !!user.lockUntil,
      lockSeconds: remaining > 0 ? Math.ceil(remaining / 1000) : 0
    });
  }

  resetFailures(user);
  persist();

  const pending = crypto.randomBytes(24).toString('hex');
  const pendingHash = sha256(pending);
  user.pendingAuth = { hash: pendingHash, expiresAt: Date.now() + 5 * 60 * 1000, device: sanitizeString(req.body.device || 'Unknown device', 60) };
  persist();

  if (user.biometricEnabled) {
    return res.json({ biometricRequired: true, pendingAuth: pending, user: publicUser(user) });
  }

  const tokens = createTokensForUser(user, user.pendingAuth.device);
  delete user.pendingAuth;
  persist();
  res.json({ biometricRequired: false, user: publicUser(user), ...tokens });
});

router.post('/biometric-verify', authLimiter, (req, res) => {
  const db = load();
  const pendingAuth = String(req.body.pendingAuth || '');
  if (!pendingAuth) return res.status(400).json({ error: 'Missing verification token.' });

  const user = db.users.find((u) => u.pendingAuth && u.pendingAuth.hash === sha256(pendingAuth));
  if (!user) return res.status(401).json({ error: 'Session expired. Please enter your PIN again.' });
  if (!user.biometricEnabled) return res.status(400).json({ error: 'Biometrics are not enabled for this account.' });
  if (Date.now() > user.pendingAuth.expiresAt) {
    delete user.pendingAuth;
    persist();
    return res.status(401).json({ error: 'Verification expired. Please enter your PIN again.' });
  }
  if (user.active === false) {
    return res.status(403).json({ error: 'Your access has been revoked. Contact your business owner.' });
  }

  const device = user.pendingAuth.device;
  const tokens = createTokensForUser(user, device);
  delete user.pendingAuth;
  persist();
  res.json({ biometricRequired: false, user: publicUser(user), ...tokens });
});

router.post('/refresh', authLimiter, (req, res) => {
  const db = load();
  const token = String(req.body.refreshToken || '');
  const hash = sha256(token);
  const session = db.sessions.find((s) => s.tokenHash === hash && !s.revoked);
  if (!session) return res.status(401).json({ error: 'Session expired. Please log in again.' });
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    session.revoked = true;
    persist();
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
  const user = findUserById(session.userId);
  if (!user || user.active === false) return res.status(401).json({ error: 'Session no longer valid.' });
  const access = issueAccessToken(user.id);
  res.json({ access, user: publicUser(user) });
});

router.post('/logout', (req, res) => {
  const token = String(req.body.refreshToken || '');
  if (token) revokeSession(sha256(token));
  res.json({ ok: true });
});

router.post('/logout-all', (req, res) => {
  const db = load();
  const token = String(req.body.refreshToken || '');
  const session = db.sessions.find((s) => s.tokenHash === sha256(token));
  if (session) {
    db.sessions.forEach((s) => {
      if (s.userId === session.userId && !s.revoked) {
        s.revoked = true;
        s.revokedAt = nowIso();
      }
    });
    persist();
  }
  res.json({ ok: true });
});

router.post('/change-pin', authRequired, authLimiter, async (req, res) => {
  const user = req.user;
  const currentPin = String(req.body.currentPin || '');
  const newPin = String(req.body.newPin || '');
  if (!/^\d{4,6}$/.test(newPin)) return res.status(400).json({ error: 'New PIN must be 4-6 digits.' });

  const ok = await bcrypt.compare(currentPin, user.pinHash);
  if (!ok) return res.status(401).json({ error: 'Current PIN is incorrect.' });

  const db = load();
  const currentSessionHash = req.refreshHash;
  user.pinHash = await bcrypt.hash(newPin, 10);
  db.sessions.forEach((s) => {
    if (s.userId === user.id && !s.revoked && s.tokenHash !== currentSessionHash) {
      s.revoked = true;
      s.revokedAt = nowIso();
    }
  });
  persist();
  res.json({ ok: true, message: 'PIN changed. All other sessions were logged out.' });
});

router.post('/change-payment-pin', authRequired, authLimiter, async (req, res) => {
  const user = req.user;
  const currentPin = String(req.body.currentPin || '');
  const newPin = String(req.body.newPin || '');
  if (!/^\d{4,6}$/.test(newPin)) return res.status(400).json({ error: 'New PIN must be 4-6 digits.' });

  const ok = await bcrypt.compare(currentPin, user.pinHash);
  if (!ok) return res.status(401).json({ error: 'Current login PIN is incorrect.' });

  user.paymentPinHash = await bcrypt.hash(newPin, 10);
  persist();
  res.json({ ok: true, message: 'Payment PIN updated.' });
});

router.post('/set-payment-pin', authRequired, authLimiter, async (req, res) => {
  const user = req.user;
  const loginPin = String(req.body.loginPin || '');
  const newPin = String(req.body.newPin || '');
  if (!/^\d{4,6}$/.test(newPin)) return res.status(400).json({ error: 'Payment PIN must be 4-6 digits.' });

  const ok = await bcrypt.compare(loginPin, user.pinHash);
  if (!ok) return res.status(401).json({ error: 'Login PIN is incorrect.' });

  user.paymentPinHash = await bcrypt.hash(newPin, 10);
  persist();
  res.json({ ok: true, message: 'Payment PIN set.' });
});

router.post('/toggle-biometrics', authRequired, authLimiter, async (req, res) => {
  const user = req.user;
  const pin = String(req.body.pin || '');
  const ok = await bcrypt.compare(pin, user.pinHash);
  if (!ok) return res.status(401).json({ error: 'PIN is incorrect.' });
  user.biometricEnabled = !!req.body.enabled;
  persist();
  res.json({ ok: true, biometricEnabled: user.biometricEnabled });
});

router.get('/me', authRequired, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.post('/notifications/read', authRequired, (req, res) => {
  const db = load();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  if (!Array.isArray(user.notifications)) user.notifications = [];
  user.notifications.forEach((n) => {
    n.read = true;
  });
  persist();
  res.json({ ok: true, notifications: user.notifications });
});

router.get('/business-code', authRequired, (req, res) => {
  if (req.user.mode !== 'business' || req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Only business owners can view the employee code.' });
  }
  res.json({ employeeCode: req.user.employeeCode });
});

module.exports = {
  router
};

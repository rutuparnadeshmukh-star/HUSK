const bcrypt = require('bcryptjs');
const express = require('express');
const { load, persist, genId, nowIso } = require('./store');
const { authRequired, requireOwner } = require('./middleware');
const { sanitizeString, validPositiveAmount, logAudit } = require('./security');

const router = express.Router();
router.use(authRequired);

router.get('/dashboard', (req, res) => {
  const db = load();
  const user = req.user;
  if (user.mode !== 'business') return res.status(403).json({ error: 'This endpoint is for business accounts.' });

  if (user.role === 'owner') {
    const employees = db.users.filter((u) => u.ownerId === user.id);
    const txns = db.transactions.filter((t) => t.businessId === user.id && t.status === 'completed');
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTxns = txns.filter((t) => new Date(t.date) >= todayStart);
    res.json({
      role: 'owner',
      balance: Math.round(user.balance * 100) / 100,
      employeeCount: employees.length,
      activeEmployees: employees.filter((e) => e.active !== false).length,
      totalTransactions: txns.length,
      todaySpend: Math.round(todayTxns.filter((t) => t.direction === 'out').reduce((s, t) => s + t.amount, 0) * 100) / 100,
      todayCount: todayTxns.length,
      dailyLimit: user.dailyLimit,
      txnLimit: user.txnLimit,
      employeeCode: user.employeeCode,
      recent: txns.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8)
    });
  } else {
    const owner = req.business;
    const txns = db.transactions.filter((t) => t.actorId === user.id && t.status === 'completed');
    res.json({
      role: 'employee',
      business: owner.name,
      balance: Math.round(owner.balance * 100) / 100,
      dailyLimit: user.dailyLimit,
      txnLimit: user.txnLimit,
      totalTransactions: txns.length,
      todaySpend: Math.round(txns.filter((t) => new Date(t.date) >= new Date().setHours(0, 0, 0, 0)).reduce((s, t) => s + t.amount, 0) * 100) / 100,
      recent: txns.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8)
    });
  }
});

router.get('/me', (req, res) => {
  const user = req.user;
  res.json({
    role: user.role,
    dailyLimit: user.dailyLimit,
    txnLimit: user.txnLimit,
    businessName: user.mode === 'business' && user.role === 'employee' ? req.business.name : user.name,
    active: user.active !== false
  });
});

router.get('/employees', requireOwner, (req, res) => {
  const db = load();
  const employees = db.users
    .filter((u) => u.ownerId === req.user.id)
    .map((e) => ({
      id: e.id,
      name: e.name,
      username: e.username,
      email: e.email,
      active: e.active !== false,
      dailyLimit: e.dailyLimit,
      txnLimit: e.txnLimit,
      createdAt: e.createdAt,
      transactions: db.transactions.filter((t) => t.actorId === e.id && t.status === 'completed').length,
      lastLogin: e.lastLogin || null
    }));
  res.json({ employees });
});

router.post('/employees', requireOwner, async (req, res) => {
  const db = load();
  const owner = req.user;
  const name = sanitizeString(req.body.name, 60);
  const username = String(req.body.username || '').toLowerCase();
  const email = String(req.body.email || '').toLowerCase();
  const pin = String(req.body.pin || '');
  const dailyLimit = Number(req.body.dailyLimit);
  const txnLimit = Number(req.body.txnLimit);

  if (name.length < 2) return res.status(400).json({ error: 'Employee name is required.' });
  if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(username)) return res.status(400).json({ error: 'Username must be 3-30 chars using letters, numbers, _ . -' });
  if (!/^\d{4,6}$/.test(pin)) return res.status(400).json({ error: 'PIN must be 4-6 digits.' });
  if (!validPositiveAmount(dailyLimit) || !validPositiveAmount(txnLimit) || txnLimit > dailyLimit) {
    return res.status(400).json({ error: 'Limits must be positive and per-transaction limit cannot exceed the daily limit.' });
  }
  if (db.users.some((u) => u.username === username)) return res.status(409).json({ error: 'Username is already taken.' });

  const employee = {
    id: genId('usr'),
    name,
    username,
    email: email || `${username}@artham.local`,
    pinHash: await bcrypt.hash(pin, 10),
    paymentPinHash: null,
    biometricEnabled: false,
    mode: 'business',
    role: 'employee',
    ownerId: owner.id,
    balance: 0,
    dailyLimit,
    txnLimit,
    active: true,
    failedAttempts: 0,
    lockUntil: 0,
    createdAt: nowIso()
  };
  db.users.push(employee);
  logAudit(owner.id, employee.id, 'employee_granted', `Granted access to ${employee.name} (@${employee.username}) with daily \u20B9${dailyLimit.toLocaleString('en-IN')} / txn \u20B9${txnLimit.toLocaleString('en-IN')}.`);
  persist();
  res.status(201).json({ ok: true, employee });
});

router.post('/employees/:id/limits', requireOwner, (req, res) => {
  const db = load();
  const employee = db.users.find((u) => u.id === req.params.id && u.ownerId === req.user.id);
  if (!employee) return res.status(404).json({ error: 'Employee not found.' });
  const dailyLimit = Number(req.body.dailyLimit);
  const txnLimit = Number(req.body.txnLimit);
  if (!validPositiveAmount(dailyLimit) || !validPositiveAmount(txnLimit) || txnLimit > dailyLimit) {
    return res.status(400).json({ error: 'Limits must be positive and per-transaction limit cannot exceed the daily limit.' });
  }
  employee.dailyLimit = dailyLimit;
  employee.txnLimit = txnLimit;
  logAudit(req.user.id, employee.id, 'limits_updated', `Updated limits for ${employee.name} to daily \u20B9${dailyLimit.toLocaleString('en-IN')} / txn \u20B9${txnLimit.toLocaleString('en-IN')}.`);
  persist();
  res.json({ ok: true, employee: { id: employee.id, name: employee.name, dailyLimit, txnLimit } });
});

router.post('/employees/:id/revoke', requireOwner, (req, res) => {
  const db = load();
  const employee = db.users.find((u) => u.id === req.params.id && u.ownerId === req.user.id);
  if (!employee) return res.status(404).json({ error: 'Employee not found.' });
  employee.active = false;
  db.sessions.forEach((s) => {
    if (s.userId === employee.id && !s.revoked) {
      s.revoked = true;
      s.revokedAt = nowIso();
    }
  });
  logAudit(req.user.id, employee.id, 'employee_revoked', `Revoked access for ${employee.name} (@${employee.username}). All sessions were terminated immediately.`);
  persist();
  res.json({ ok: true, message: `Access for ${employee.name} has been revoked and all sessions terminated.` });
});

router.post('/employees/:id/restore', requireOwner, (req, res) => {
  const db = load();
  const employee = db.users.find((u) => u.id === req.params.id && u.ownerId === req.user.id);
  if (!employee) return res.status(404).json({ error: 'Employee not found.' });
  employee.active = true;
  logAudit(req.user.id, employee.id, 'employee_restored', `Restored access for ${employee.name} (@${employee.username}).`);
  persist();
  res.json({ ok: true, message: `Access for ${employee.name} has been restored.` });
});

router.get('/audit-log', requireOwner, (req, res) => {
  const db = load();
  const logs = db.auditLog
    .filter((l) => l.ownerId === req.user.id)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json({ logs });
});

router.post('/limits', requireOwner, (req, res) => {
  const owner = req.user;
  const dailyLimit = Number(req.body.dailyLimit);
  const txnLimit = Number(req.body.txnLimit);
  if (!validPositiveAmount(dailyLimit) || !validPositiveAmount(txnLimit) || txnLimit > dailyLimit) {
    return res.status(400).json({ error: 'Limits must be positive and per-transaction limit cannot exceed the daily limit.' });
  }
  owner.dailyLimit = dailyLimit;
  owner.txnLimit = txnLimit;
  logAudit(owner.id, owner.id, 'owner_limits_updated', `Owner updated business limits to daily \u20B9${dailyLimit.toLocaleString('en-IN')} / txn \u20B9${txnLimit.toLocaleString('en-IN')}.`);
  persist();
  res.json({ ok: true, dailyLimit, txnLimit });
});

module.exports = router;

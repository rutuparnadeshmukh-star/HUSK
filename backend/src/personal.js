const bcrypt = require('bcryptjs');
const express = require('express');
const { load, persist, genId, nowIso } = require('./store');
const { authRequired } = require('./middleware');
const { paymentLimiter, sanitizeString, validPositiveAmount } = require('./security');
const { BANKS, PRODUCTS, CATEGORIES, candleData, marketSnapshot, lineSeries } = require('./mockdata');

const router = express.Router();
router.use(authRequired);

function businessFor(req) {
  return req.business;
}

function spendContext(req) {
  const op = req.business;
  const user = req.user;
  const isEmployee = user.mode === 'business' && user.role === 'employee';
  const limits = isEmployee ? user : op;
  return { op, user, isEmployee, limits };
}

function enforceLimits(limits, amount, spentToday) {
  if (amount > limits.txnLimit) {
    return { ok: false, error: `Amount exceeds your per-transaction limit of \u20B9${limits.txnLimit.toLocaleString('en-IN')}.` };
  }
  if (spentToday + amount > limits.dailyLimit) {
    return { ok: false, error: `This would exceed your daily spend limit of \u20B9${limits.dailyLimit.toLocaleString('en-IN')} (remaining \u20B9${Math.max(0, limits.dailyLimit - spentToday).toLocaleString('en-IN')}).` };
  }
  return { ok: true };
}

function spentTodayFor(actorId) {
  const db = load();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return db.transactions
    .filter((t) => t.actorId === actorId && t.type !== 'received' && t.status === 'completed' && new Date(t.date) >= start)
    .reduce((sum, t) => sum + t.amount, 0);
}

router.get('/dashboard', (req, res) => {
  const db = load();
  const { op } = spendContext(req);
  const userId = req.user.id;
  const transactions = db.transactions
    .filter((t) => t.userId === userId && t.status === 'completed')
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const bankLinks = db.bankLinks.filter((b) => b.userId === userId);
  const portfolio = db.portfolio.filter((p) => p.userId === userId);
  const totalSpent = transactions.filter((t) => t.direction === 'out').reduce((s, t) => s + t.amount, 0);
  const totalReceived = transactions.filter((t) => t.direction === 'in').reduce((s, t) => s + t.amount, 0);

  res.json({
    balance: Math.round(op.balance * 100) / 100,
    totalSpent,
    totalReceived,
    spendToday: spentTodayFor(userId),
    dailyLimit: op.dailyLimit,
    txnLimit: op.txnLimit,
    isEmployee: spendContext(req).isEmployee,
    transactions: transactions.slice(0, 8),
    bankLinks,
    portfolioValue: portfolio.reduce((s, p) => s + p.value, 0)
  });
});

router.get('/transactions', (req, res) => {
  const db = load();
  const userId = req.user.id;
  const transactions = db.transactions
    .filter((t) => t.userId === userId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json({ transactions });
});

router.post('/transactions/send', paymentLimiter, async (req, res) => {
  const db = load();
  const { op, user, limits } = spendContext(req);
  const to = sanitizeString(req.body.to, 60);
  const note = sanitizeString(req.body.note || '', 120);
  const amount = Number(req.body.amount);
  const paymentPin = String(req.body.paymentPin || '');

  if (!to) return res.status(400).json({ error: 'Recipient is required.' });
  if (!validPositiveAmount(amount)) return res.status(400).json({ error: 'Enter a valid amount greater than 0.' });
  if (!user.paymentPinHash) return res.status(400).json({ error: 'Set a Payment PIN in Profile before sending money.' });
  const pinOk = await bcrypt.compare(paymentPin, user.paymentPinHash);
  if (!pinOk) return res.status(401).json({ error: 'Incorrect Payment PIN.' });

  const limitCheck = enforceLimits(limits, amount, spentTodayFor(user.id));
  if (!limitCheck.ok) return res.status(400).json({ error: limitCheck.error });

  if (amount > op.balance) {
    return res.status(400).json({ error: 'Insufficient balance.' });
  }

  op.balance = Math.round((op.balance - amount) * 100) / 100;
  const tx = {
    id: genId('tx'),
    userId: user.id,
    actorId: user.id,
    businessId: op.id !== user.id ? op.id : null,
    direction: 'out',
    type: 'send',
    to,
    amount: Math.round(amount * 100) / 100,
    note,
    date: nowIso(),
    status: 'completed',
    method: 'UPI (simulated)'
  };
  db.transactions.push(tx);
  persist();

  res.status(201).json({ ok: true, transaction: tx, balance: Math.round(op.balance * 100) / 100 });
});

router.get('/expenses', (req, res) => {
  const db = load();
  const userId = req.user.id;
  const expenses = db.expenses.filter((e) => e.userId === userId).sort((a, b) => new Date(b.date) - new Date(a.date));
  const byCategory = {};
  let total = 0;
  expenses.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    total += e.amount;
  });
  const donut = CATEGORIES
    .filter((c) => byCategory[c])
    .map((c) => ({ name: c, value: Math.round(byCategory[c]) }))
    .sort((a, b) => b.value - a.value);
  res.json({ expenses: expenses.slice(0, 60), summary: { total, byCategory, donut } });
});

router.post('/expenses', paymentLimiter, (req, res) => {
  const db = load();
  const user = req.user;
  const category = sanitizeString(req.body.category, 40);
  const note = sanitizeString(req.body.note || '', 120);
  const amount = Number(req.body.amount);
  const date = req.body.date || nowIso();

  if (!CATEGORIES.includes(category)) return res.status(400).json({ error: 'Invalid category.' });
  if (!validPositiveAmount(amount)) return res.status(400).json({ error: 'Enter a valid amount greater than 0.' });

  const expense = { id: genId('exp'), userId: user.id, category, amount: Math.round(amount * 100) / 100, note, date };
  db.expenses.push(expense);
  persist();
  res.status(201).json({ ok: true, expense });
});

router.get('/banks', (req, res) => {
  res.json({ banks: BANKS });
});

router.post('/banks/link', paymentLimiter, (req, res) => {
  const db = load();
  const user = req.user;
  const bankId = String(req.body.bankId || '');
  const holderName = sanitizeString(req.body.holderName, 60);
  const last4 = String(req.body.last4 || '').replace(/\D/g, '').slice(-4);
  const bank = BANKS.find((b) => b.id === bankId);
  if (!bank) return res.status(400).json({ error: 'Select a valid bank.' });
  if (holderName.length < 2) return res.status(400).json({ error: 'Enter the account holder name.' });
  if (last4.length !== 4) return res.status(400).json({ error: 'Enter the last 4 digits of the account number.' });

  if (db.bankLinks.some((b) => b.userId === user.id && b.bankId === bankId)) {
    return res.status(409).json({ error: 'This bank is already linked.' });
  }

  const link = {
    id: genId('blk'),
    userId: user.id,
    bankId: bank.id,
    bankName: bank.name,
    bankColor: bank.color,
    holderName,
    last4,
    balance: Math.round(5000 + Math.random() * 95000),
    status: 'linked',
    linkedAt: nowIso()
  };
  db.bankLinks.push(link);
  persist();
  res.status(201).json({ ok: true, link });
});

router.get('/invest/market', (req, res) => {
  res.json({ stocks: marketSnapshot() });
});

router.get('/invest/candles', (req, res) => {
  const symbol = String(req.query.symbol || 'RELIANCE').toUpperCase();
  const days = Math.min(365, Math.max(7, Number(req.query.days) || 90));
  const stock = require('./mockdata').STOCKS.find((s) => s.symbol === symbol);
  if (!stock) return res.status(404).json({ error: 'Unknown symbol.' });
  const candles = candleData(symbol, days);
  const series = lineSeries(days, candles[0].open, 0.012, symbol.length * 7 + days);
  res.json({ symbol: stock.symbol, name: stock.name, candles, series });
});

router.get('/invest/portfolio', (req, res) => {
  const db = load();
  const userId = req.user.id;
  const portfolio = db.portfolio.filter((p) => p.userId === userId);
  const snap = marketSnapshot();
  const enriched = portfolio.map((p) => {
    const m = snap.find((s) => s.symbol === p.symbol) || { price: p.avgPrice, changePct: 0 };
    const value = Math.round(p.shares * m.price * 100) / 100;
    p.value = value;
    p.currentPrice = m.price;
    p.changePct = Math.round(((m.price - p.avgPrice) / p.avgPrice) * 10000) / 100;
    return p;
  });
  const history = lineSeries(30, enriched.reduce((s, p) => s + p.value, 0) || 10000, 0.03, userId.length * 13);
  res.json({ portfolio: enriched, totalValue: enriched.reduce((s, p) => s + p.value, 0), history });
});

router.post('/invest/buy', paymentLimiter, async (req, res) => {
  const db = load();
  const { op, user, limits } = spendContext(req);
  const symbol = String(req.body.symbol || '').toUpperCase();
  const amount = Number(req.body.amount);
  const paymentPin = String(req.body.paymentPin || '');
  const stock = require('./mockdata').STOCKS.find((s) => s.symbol === symbol);
  if (!stock) return res.status(404).json({ error: 'Unknown symbol.' });
  if (!validPositiveAmount(amount)) return res.status(400).json({ error: 'Enter a valid amount greater than 0.' });
  if (!user.paymentPinHash) return res.status(400).json({ error: 'Set a Payment PIN in Profile first.' });
  const pinOk = await bcrypt.compare(paymentPin, user.paymentPinHash);
  if (!pinOk) return res.status(401).json({ error: 'Incorrect Payment PIN.' });

  const limitCheck = enforceLimits(limits, amount, spentTodayFor(user.id));
  if (!limitCheck.ok) return res.status(400).json({ error: limitCheck.error });
  if (amount > op.balance) return res.status(400).json({ error: 'Insufficient balance.' });

  const price = (marketSnapshot().find((s) => s.symbol === symbol) || {}).price;
  const shares = Math.round((amount / price) * 1000000) / 1000000;

  op.balance = Math.round((op.balance - amount) * 100) / 100;
  let holding = db.portfolio.find((p) => p.userId === user.id && p.symbol === symbol);
  if (holding) {
    const totalValue = holding.shares * holding.avgPrice + amount;
    holding.shares = Math.round((holding.shares + shares) * 1000000) / 1000000;
    holding.avgPrice = Math.round((totalValue / holding.shares) * 100) / 100;
  } else {
    holding = { id: genId('pf'), userId: user.id, symbol, shares, avgPrice: Math.round(price * 100) / 100, buyAmount: amount };
    db.portfolio.push(holding);
  }
  db.transactions.push({
    id: genId('tx'), userId: user.id, actorId: user.id, businessId: op.id !== user.id ? op.id : null, direction: 'out', type: 'invest', to: symbol, amount: Math.round(amount * 100) / 100, note: `Bought ${stock.name}`, date: nowIso(), status: 'completed'
  });
  persist();
  res.status(201).json({ ok: true, holding, balance: op.balance });
});

router.post('/invest/sell', paymentLimiter, async (req, res) => {
  const db = load();
  const { op, user } = spendContext(req);
  const symbol = String(req.body.symbol || '').toUpperCase();
  const shares = Number(req.body.shares);
  const paymentPin = String(req.body.paymentPin || '');
  const holding = db.portfolio.find((p) => p.userId === user.id && p.symbol === symbol);
  if (!holding) return res.status(404).json({ error: 'No holdings for this symbol.' });
  if (!Number.isFinite(shares) || shares <= 0 || shares > holding.shares + 1e-9) {
    return res.status(400).json({ error: 'Invalid number of shares.' });
  }
  if (!user.paymentPinHash) return res.status(400).json({ error: 'Set a Payment PIN in Profile first.' });
  const pinOk = await bcrypt.compare(paymentPin, user.paymentPinHash);
  if (!pinOk) return res.status(401).json({ error: 'Incorrect Payment PIN.' });

  const price = (marketSnapshot().find((s) => s.symbol === symbol) || {}).price;
  const proceeds = Math.round(shares * price * 100) / 100;
  holding.shares = Math.round((holding.shares - shares) * 1000000) / 1000000;
  if (holding.shares <= 1e-6) {
    db.portfolio = db.portfolio.filter((p) => p.id !== holding.id);
  }
  op.balance = Math.round((op.balance + proceeds) * 100) / 100;
  db.transactions.push({
    id: genId('tx'), userId: user.id, actorId: user.id, businessId: op.id !== user.id ? op.id : null, direction: 'in', type: 'invest', to: symbol, amount: proceeds, note: `Sold ${symbol}`, date: nowIso(), status: 'completed'
  });
  persist();
  res.json({ ok: true, proceeds, balance: op.balance });
});

router.get('/products', (req, res) => {
  let products = PRODUCTS;
  const category = String(req.query.category || 'All');
  if (category !== 'All') products = PRODUCTS.filter((p) => p.category === category);
  res.json({ products });
});

module.exports = { router, spentTodayFor, enforceLimits };

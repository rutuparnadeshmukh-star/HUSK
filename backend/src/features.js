const express = require('express');
const { load, persist, genId, nowIso } = require('./store');
const { authRequired, requireOwner } = require('./middleware');
const { paymentLimiter, sanitizeString, validPositiveAmount } = require('./security');
const { BANKS, STOCKS, CATEGORIES, CATEGORY_COLORS, candleData, marketSnapshot, lineSeries } = require('./mockdata');

const router = express.Router();
router.use(authRequired);

const BILLERS = [
  { id: 'b1', name: 'BESCOM Electricity', category: 'Electricity', ref: 'EB-220441-8821' },
  { id: 'b2', name: 'Tata Power', category: 'Electricity', ref: 'TP-1185-904' },
  { id: 'b3', name: 'BWSSB Water', category: 'Water', ref: 'WTR-774-202' },
  { id: 'b4', name: 'Indane Gas', category: 'Gas', ref: 'GAS-5522' },
  { id: 'b5', name: 'HP Gas', category: 'Gas', ref: 'HP-8801-77' },
  { id: 'b6', name: 'Jio Mobile', category: 'Mobile', ref: '9900-441-221' },
  { id: 'b7', name: 'Airtel Mobile', category: 'Mobile', ref: '7702-155-008' },
  { id: 'b8', name: 'Airtel Broadband', category: 'Broadband', ref: 'BB-7741' },
  { id: 'b9', name: 'JioFiber', category: 'Wi-Fi', ref: 'WIFI-9022' },
  { id: 'b10', name: 'Rent · Green Villa Apts', category: 'Rent', ref: 'RENT-001' },
  { id: 'b11', name: 'HDFC Home Loan EMI', category: 'EMI', ref: 'LOAN-5588' },
  { id: 'b12', name: 'Car Loan EMI · Axis', category: 'EMI', ref: 'CL-3311' },
  { id: 'b13', name: 'HDFC Ergo Health', category: 'Insurance', ref: 'POL-88441' },
  { id: 'b14', name: 'ICICI Term Life', category: 'Insurance', ref: 'TL-22018' },
  { id: 'b15', name: 'FASTag · Indian Oil', category: 'FASTag', ref: 'FAST-9911' },
  { id: 'b16', name: 'FASTag · Paytm', category: 'FASTag', ref: 'FAST-7722' }
];
const BILL_AMOUNT = (b) => 120 + ((b.id.charCodeAt(1) * 37) % 4800);

const P2P_CONTACTS = [
  { id: 'c1', name: 'Aarav Mehta', username: 'aarav', upi: 'aarav@artham' },
  { id: 'c2', name: 'Priya Sharma', username: 'priya', upi: 'priya@artham' },
  { id: 'c3', name: 'Rohan Iyer', username: 'rohan', upi: 'rohan@artham' },
  { id: 'c4', name: 'Sneha Kulkarni', username: 'sneha', upi: 'sneha@artham' },
  { id: 'c5', name: 'Kabir Khan', username: 'kabir', upi: 'kabir@artham' },
  { id: 'c6', name: 'Ananya Das', username: 'ananya', upi: 'ananya@artham' }
];

const FOREX = [
  { symbol: 'USDINR', name: 'US Dollar / INR', type: 'forex', color: '#10b981' },
  { symbol: 'EURINR', name: 'Euro / INR', type: 'forex', color: '#2563eb' },
  { symbol: 'GBPINR', name: 'British Pound / INR', type: 'forex', color: '#7c3aed' },
  { symbol: 'JPYINR', name: 'Japanese Yen / INR', type: 'forex', color: '#f59e0b' }
];
const GOLD = [
  { symbol: 'GOLD24K', name: '24K Gold (per gram)', type: 'gold', color: '#d4a017' },
  { symbol: 'GOLD22K', name: '22K Gold (per gram)', type: 'gold', color: '#b8860b' },
  { symbol: 'SILVER', name: 'Silver (per gram)', type: 'gold', color: '#94a3b8' }
];
const MUTUAL_FUNDS = [
  { symbol: 'MFHDFC', name: 'HDFC Balanced Advantage', type: 'mf', color: '#e11d48' },
  { symbol: 'MFSBI', name: 'SBI Bluechip', type: 'mf', color: '#0d9488' },
  { symbol: 'MFTATA', name: 'Tata Digital India', type: 'mf', color: '#f43f5e' }
];
const SIPS = [
  { symbol: 'SIPNIFTY', name: 'NIFTY 50 Index Fund', type: 'sip', color: '#6366f1', min: 500 },
  { symbol: 'SIPELSS', name: 'ELSS Tax Saver', type: 'sip', color: '#8b5cf6', min: 500 },
  { symbol: 'SIPMID', name: 'Midcap 150 Fund', type: 'sip', color: '#06b6d4', min: 500 }
];
const PRICE = (s) => 50 + ((s.charCodeAt(s.length - 1) * 89) % 9000) + ((s.charCodeAt(0) * 7) % 50);

const FRANKY_RULES = [
  [/balance|money left|how much/, 'Your available balance is shown on the dashboard. Keep it safe - your PIN is always required to spend.'],
  [/send|transfer|p2p/, 'To send money, open Send money, enter the amount and your Payment PIN. Transfers are recorded instantly.'],
  [/bill|recharge|electric|mobile|gas|wifi|fastag/, 'You can pay bills and recharges under Bill pay - electricity, water, gas, mobile, broadband, rent, EMI, insurance and FASTag are all supported.'],
  [/invest|stock|gold|mutual|sip|forex/, 'Invest offers stocks, forex, mutual funds, SIPs and digital gold with candlestick charts. Returns shown are simulated.'],
  [/budget|save|limit/, 'Set a monthly Save Money budget on the Budget page. I can nudge you if you are close to it.'],
  [/gst|tax|invoice/, 'Business users get GST tracking, invoicing and a cash flow dashboard. Ask your owner if you need access.'],
  [/point|reward/, 'You earn Artham Points on spend - 1 point for every ₹100. Redeem for cashback (50 points = ₹1).'],
  [/who are you|help|franky/, 'I am Franky, your ARTHAM assistant. Ask me about balance, sending money, bills, invest, budget, GST or points.'],
  [/loan|emi/, 'Use the EMI calculator under Tools to estimate monthly payments before you borrow.'],
  [/security|pin|safe/, 'Your login PIN and Payment PIN are separate, hashed and rate-limited. Biometrics never bypass the PIN.'],
  [/hi|hello|hey/, 'Hello! I am Franky. Ask me anything about ARTHAM banking.'],
  [/bye|thanks|thank/, 'You are welcome! Franky is here anytime you need me.']
];
const FRANKY_FALLBACK = 'I can help with balance, sending money, bills, invest, budgets, GST, points and security. Try asking in a different way.';

function spendContext(req) {
  const op = req.business;
  const user = req.user;
  const isEmployee = user.mode === 'business' && user.role === 'employee';
  const limits = isEmployee ? user : op;
  return { op, user, isEmployee, limits };
}
function spentTodayFor(actorId) {
  const db = load();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return db.transactions.filter((t) => t.actorId === actorId && t.status === 'completed' && new Date(t.date) >= start).reduce((s, t) => s + t.amount, 0);
}
function enforceLimits(limits, amount, spent) {
  if (amount > limits.txnLimit) return { ok: false, error: `Amount exceeds your per-transaction limit of \u20B9${limits.txnLimit.toLocaleString('en-IN')}.` };
  if (spent + amount > limits.dailyLimit) return { ok: false, error: `This would exceed your daily spend limit of \u20B9${limits.dailyLimit.toLocaleString('en-IN')}.` };
  return { ok: true };
}
function addTx(db, user, op, direction, type, to, amount, note) {
  const tx = { id: genId('tx'), userId: user.id, actorId: user.id, businessId: op.id !== user.id ? op.id : null, direction, type, to, amount: Math.round(amount * 100) / 100, note, date: nowIso(), status: 'completed', method: 'UPI (simulated)' };
  db.transactions.push(tx);
  const u = db.users.find((x) => x.id === user.id);
  const pts = Math.floor(amount / 100);
  if (pts > 0 && direction === 'out') {
    u.points = (u.points || 0) + pts;
    if (!Array.isArray(u.pointLog)) u.pointLog = [];
    u.pointLog.unshift({ id: genId('pt'), points: pts, note: `Earned on ${to}`, date: nowIso() });
  }
  return tx;
}

router.get('/bills/catalog', (req, res) => {
  res.json({ billers: BILLERS.map((b) => ({ ...b, amount: BILL_AMOUNT(b) })) });
});
router.get('/bills/history', (req, res) => {
  const db = load();
  res.json({ bills: (db.bills || []).filter((b) => b.userId === req.user.id).sort((a, b) => new Date(b.date) - new Date(a.date)) });
});
router.post('/bills/pay', paymentLimiter, (req, res) => {
  const db = load();
  const { op, user, limits } = spendContext(req);
  const biller = BILLERS.find((b) => b.id === String(req.body.billerId || ''));
  if (!biller) return res.status(404).json({ error: 'Unknown biller.' });
  const amount = Math.round((Number(req.body.amount) || BILL_AMOUNT(biller)) * 100) / 100;
  if (!validPositiveAmount(amount)) return res.status(400).json({ error: 'Enter a valid amount.' });
  const lc = enforceLimits(limits, amount, spentTodayFor(user.id));
  if (!lc.ok) return res.status(400).json({ error: lc.error });
  if (amount > op.balance) return res.status(400).json({ error: 'Insufficient balance.' });
  op.balance = Math.round((op.balance - amount) * 100) / 100;
  const tx = addTx(db, user, op, 'out', 'bill', biller.name, amount, `${biller.category} bill ${biller.ref}`);
  const bill = { id: genId('bil'), userId: user.id, billerId: biller.id, name: biller.name, category: biller.category, ref: biller.ref, amount, date: nowIso(), status: 'paid', txId: tx.id };
  if (!Array.isArray(db.bills)) db.bills = [];
  db.bills.push(bill);
  persist();
  res.status(201).json({ ok: true, bill, balance: op.balance, points: (user.points || 0) });
});

router.get('/p2p/contacts', (req, res) => res.json({ contacts: P2P_CONTACTS }));
router.get('/p2p/chat', (req, res) => {
  const db = load();
  const withId = String(req.query.with || '');
  const msgs = (db.p2pMessages || []).filter((m) => (m.from === req.user.id && m.to === withId) || (m.to === req.user.id && m.from === withId)).sort((a, b) => new Date(a.date) - new Date(b.date));
  res.json({ messages: msgs });
});
router.post('/p2p/message', (req, res) => {
  const db = load();
  const to = String(req.body.to || '');
  const text = sanitizeString(req.body.text, 400);
  if (!to || !text) return res.status(400).json({ error: 'Contact and message required.' });
  if (!P2P_CONTACTS.some((c) => c.id === to)) return res.status(404).json({ error: 'Unknown contact.' });
  const msg = { id: genId('msg'), from: req.user.id, to, text, date: nowIso() };
  if (!Array.isArray(db.p2pMessages)) db.p2pMessages = [];
  db.p2pMessages.push(msg);
  persist();
  res.status(201).json({ ok: true, message: msg });
});
router.post('/p2p/send', paymentLimiter, (req, res) => {
  const db = load();
  const { op, user, limits } = spendContext(req);
  const contact = P2P_CONTACTS.find((c) => c.id === String(req.body.to || ''));
  const amount = Math.round(Number(req.body.amount) * 100) / 100;
  const text = sanitizeString(req.body.note || 'Payment', 200);
  if (!contact) return res.status(404).json({ error: 'Unknown contact.' });
  if (!validPositiveAmount(amount)) return res.status(400).json({ error: 'Enter a valid amount.' });
  const lc = enforceLimits(limits, amount, spentTodayFor(user.id));
  if (!lc.ok) return res.status(400).json({ error: lc.error });
  if (amount > op.balance) return res.status(400).json({ error: 'Insufficient balance.' });
  op.balance = Math.round((op.balance - amount) * 100) / 100;
  const tx = addTx(db, user, op, 'out', 'p2p', `${contact.name} (${contact.upi})`, amount, text);
  const msg = { id: genId('msg'), from: req.user.id, to: contact.id, text: `Paid \u20B9${amount.toLocaleString('en-IN')} — ${text}`, date: nowIso(), kind: 'payment' };
  if (!Array.isArray(db.p2pMessages)) db.p2pMessages = [];
  db.p2pMessages.push(msg);
  persist();
  res.status(201).json({ ok: true, transaction: tx, message: msg, balance: op.balance, points: (user.points || 0) });
});

router.get('/budget', (req, res) => {
  const db = load();
  const u = db.users.find((x) => x.id === req.user.id);
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
  const spent = db.transactions.filter((t) => t.actorId === req.user.id && t.direction === 'out' && t.status === 'completed' && new Date(t.date).toISOString().slice(0, 7) === monthKey).reduce((s, t) => s + t.amount, 0);
  res.json({ limit: u.budgetLimit || 0, spent: Math.round(spent * 100) / 100, month: monthKey });
});
router.post('/budget', (req, res) => {
  const db = load();
  const limit = Number(req.body.limit);
  if (!Number.isFinite(limit) || limit < 0 || limit > 10000000) return res.status(400).json({ error: 'Enter a valid budget limit.' });
  const u = db.users.find((x) => x.id === req.user.id);
  u.budgetLimit = Math.round(limit * 100) / 100;
  persist();
  res.json({ ok: true, limit: u.budgetLimit });
});

router.get('/emi-calc', (req, res) => {
  const p = Number(req.query.amount) || 100000;
  const annual = Number(req.query.rate) || 10.5;
  const n = Number(req.query.months) || 24;
  const r = annual / 12 / 100;
  const emi = r === 0 ? p / n : (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const total = emi * n;
  res.json({ amount: p, rate: annual, months: n, emi: Math.round(emi), totalInterest: Math.round(total - p), totalPayment: Math.round(total) });
});

router.get('/analytics', (req, res) => {
  const db = load();
  const days = Math.min(90, Math.max(7, Number(req.query.days) || 30));
  const start = new Date();
  start.setDate(start.getDate() - days);
  const tx = db.transactions.filter((t) => t.actorId === req.user.id && t.direction === 'out' && t.status === 'completed' && new Date(t.date) >= start);
  const byCategory = {};
  tx.forEach((t) => {
    byCategory[t.type] = (byCategory[t.type] || 0) + t.amount;
  });
  const donut = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value: Math.round(value) }));
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    series.push({ date: key.slice(5), total: Math.round(tx.filter((t) => t.date.slice(0, 10) === key).reduce((s, t) => s + t.amount, 0) * 100) / 100 });
  }
  const exp = db.expenses.filter((e) => e.userId === req.user.id);
  const expCat = {};
  exp.forEach((e) => {
    expCat[e.category] = (expCat[e.category] || 0) + e.amount;
  });
  const expenseDonut = Object.entries(expCat).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value: Math.round(value), color: CATEGORY_COLORS[name] }));
  res.json({ rangeDays: days, donut, series, expenseDonut, totalSpent: Math.round(tx.reduce((s, t) => s + t.amount, 0)) });
});

router.get('/points', (req, res) => {
  const db = load();
  const u = db.users.find((x) => x.id === req.user.id);
  res.json({ points: u.points || 0, log: (u.pointLog || []).slice(0, 30) });
});
router.post('/points/redeem', (req, res) => {
  const db = load();
  const u = db.users.find((x) => x.id === req.user.id);
  const amt = Math.floor(Number(req.body.amount) || 0);
  if (amt < 50 || amt > (u.points || 0)) return res.status(400).json({ error: 'Redeem at least 50 points (₹1 per 50 pts).' });
  u.points = Math.round((u.points - amt) * 100) / 100;
  const cash = amt / 50;
  const op = req.business;
  op.balance = Math.round((op.balance + cash) * 100) / 100;
  const tx = addTx(db, u, op, 'in', 'reward', 'ARTHAM Points Cashback', cash, `Redeemed ${amt} points`);
  if (!Array.isArray(u.pointLog)) u.pointLog = [];
  u.pointLog.unshift({ id: genId('pt'), points: -amt, note: `Redeemed ₹${cash.toLocaleString('en-IN')} cashback`, date: nowIso() });
  persist();
  res.json({ ok: true, points: u.points, cash, balance: op.balance, transaction: tx });
});

router.get('/invest/opportunities', (req, res) => {
  const mk = marketSnapshot();
  res.json({
    stocks: STOCKS.map((s) => ({ ...s, price: (mk.find((m) => m.symbol === s.symbol) || {}).price || PRICE(s.symbol) })),
    forex: FOREX.map((f) => ({ ...f, price: PRICE(f.symbol) + 40 })),
    gold: GOLD.map((g) => ({ ...g, price: PRICE(g.symbol) + 6800 })),
    mutualFunds: MUTUAL_FUNDS.map((m) => ({ ...m, price: 12 + ((m.symbol.charCodeAt(2) * 3) % 200), nav: true })),
    sips: SIPS.map((s) => ({ ...s, price: PRICE(s.symbol) + 120 }))
  });
});
router.get('/invest/market/:type', (req, res) => {
  const type = String(req.params.type || '');
  const symbol = String(req.query.symbol || '');
  const pools = { stocks: STOCKS, forex: FOREX, gold: GOLD, mf: MUTUAL_FUNDS, sip: SIPS };
  const pool = pools[type];
  if (!pool) return res.status(404).json({ error: 'Unknown market type.' });
  const item = pool.find((p) => p.symbol === symbol) || pool[0];
  const candles = candleData(item.symbol, 180);
  const last = candles[candles.length - 1];
  res.json({ type, item: { ...item, price: last ? last.close : PRICE(item.symbol) }, candles });
});

router.post('/ai/franky', (req, res) => {
  const db = load();
  const text = String(req.body.message || '').toLowerCase().slice(0, 300);
  const reply = (FRANKY_RULES.find(([rx]) => rx.test(text)) || [null, FRANKY_FALLBACK])[1];
  const u = db.users.find((x) => x.id === req.user.id);
  if (!Array.isArray(u.frankyChat)) u.frankyChat = [];
  u.frankyChat.push({ id: genId('fk'), role: 'user', text: String(req.body.message || '').slice(0, 300), date: nowIso() });
  u.frankyChat.push({ id: genId('fk'), role: 'assistant', text: reply, date: nowIso() });
  persist();
  res.json({ reply, chat: u.frankyChat.slice(-20) });
});

router.get('/invoices', (req, res) => {
  const db = load();
  const bid = req.business.id;
  res.json({ invoices: (db.invoices || []).filter((i) => i.businessId === bid).sort((a, b) => new Date(b.date) - new Date(a.date)) });
});
router.post('/invoices', (req, res) => {
  const db = load();
  const bid = req.business.id;
  const client = sanitizeString(req.body.client, 80);
  const amount = Math.round(Number(req.body.amount) * 100) / 100;
  const dueDays = Math.max(1, Math.min(365, Number(req.body.dueDays) || 15));
  if (!client || !validPositiveAmount(amount)) return res.status(400).json({ error: 'Client and a valid amount are required.' });
  const num = 'INV-' + (1000 + (db.invoices || []).filter((i) => i.businessId === bid).length + 1);
  const due = new Date(Date.now() + dueDays * 86400000).toISOString();
  const inv = { id: genId('inv'), businessId: bid, client, amount: Math.round(amount * 100) / 100, number: num, status: 'pending', date: nowIso(), due };
  if (!Array.isArray(db.invoices)) db.invoices = [];
  db.invoices.push(inv);
  persist();
  res.status(201).json({ ok: true, invoice: inv });
});
router.post('/invoices/:id/status', (req, res) => {
  const db = load();
  const inv = (db.invoices || []).find((i) => i.id === req.params.id && i.businessId === req.business.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found.' });
  const status = ['paid', 'pending', 'overdue'].includes(req.body.status) ? req.body.status : 'pending';
  inv.status = status;
  if (status === 'paid' && req.body.amount) {
    const op = req.business;
    op.balance = Math.round((op.balance + Number(req.body.amount)) * 100) / 100;
    addTx(db, req.user, op, 'in', 'revenue', inv.client, Number(req.body.amount), `Invoice ${inv.number} paid`);
  }
  persist();
  res.json({ ok: true, invoice: inv, balance: req.business.balance });
});
router.get('/invoices/recurring', (req, res) => {
  const db = load();
  res.json({ recurring: (db.recurringInvoices || []).filter((r) => r.businessId === req.business.id) });
});
router.post('/invoices/recurring', (req, res) => {
  const db = load();
  const client = sanitizeString(req.body.client, 80);
  const amount = Math.round(Number(req.body.amount) * 100) / 100;
  const freq = ['weekly', 'monthly', 'quarterly'].includes(req.body.freq) ? req.body.freq : 'monthly';
  if (!client || !validPositiveAmount(amount)) return res.status(400).json({ error: 'Client and amount required.' });
  const r = { id: genId('rec'), businessId: req.business.id, client, amount, freq, active: true, created: nowIso() };
  if (!Array.isArray(db.recurringInvoices)) db.recurringInvoices = [];
  db.recurringInvoices.push(r);
  persist();
  res.status(201).json({ ok: true, recurring: r });
});

router.get('/vendors', (req, res) => {
  res.json({ vendors: [
    { id: 'v1', name: 'TechNova Supplies', category: 'IT & Software', pending: 24500 },
    { id: 'v2', name: 'Vertex Logistics', category: 'Logistics', pending: 18000 },
    { id: 'v3', name: 'OfficeMart', category: 'Stationery', pending: 6200 },
    { id: 'v4', name: 'AdSphere Media', category: 'Marketing', pending: 31000 },
    { id: 'v5', name: 'Meridian Catering', category: 'Events', pending: 8900 }
  ] });
});
router.post('/vendors/pay', requireOwner, paymentLimiter, (req, res) => {
  const db = load();
  const { op, user, limits } = spendContext(req);
  const vendor = { id: String(req.body.vendorId || ''), name: sanitizeString(req.body.name, 80) };
  const amount = Math.round(Number(req.body.amount) * 100) / 100;
  if (!vendor.name || !validPositiveAmount(amount)) return res.status(400).json({ error: 'Vendor and amount required.' });
  const lc = enforceLimits(limits, amount, spentTodayFor(user.id));
  if (!lc.ok) return res.status(400).json({ error: lc.error });
  if (amount > op.balance) return res.status(400).json({ error: 'Insufficient balance.' });
  op.balance = Math.round((op.balance - amount) * 100) / 100;
  const tx = addTx(db, user, op, 'out', 'vendor', vendor.name, amount, 'Vendor payment');
  persist();
  res.status(201).json({ ok: true, transaction: tx, balance: op.balance });
});

router.get('/cashflow', (req, res) => {
  const db = load();
  const days = Math.min(90, Math.max(7, Number(req.query.days) || 30));
  const bid = req.business.id;
  const start = new Date();
  start.setDate(start.getDate() - days);
  const tx = db.transactions.filter((t) => (t.businessId === bid || t.actorId === bid) && t.status === 'completed' && new Date(t.date) >= start);
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const dayTx = tx.filter((t) => t.date.slice(0, 10) === key);
    series.push({ date: key.slice(5), inflow: Math.round(dayTx.filter((t) => t.direction === 'in').reduce((s, t) => s + t.amount, 0) * 100) / 100, outflow: Math.round(dayTx.filter((t) => t.direction === 'out').reduce((s, t) => s + t.amount, 0) * 100) / 100 });
  }
  const inflow = tx.filter((t) => t.direction === 'in').reduce((s, t) => s + t.amount, 0);
  const outflow = tx.filter((t) => t.direction === 'out').reduce((s, t) => s + t.amount, 0);
  res.json({ rangeDays: days, series, inflow: Math.round(inflow), outflow: Math.round(outflow), net: Math.round(inflow - outflow) });
});

router.get('/gst', (req, res) => {
  const db = load();
  const bid = req.business.id;
  const invs = (db.invoices || []).filter((i) => i.businessId === bid);
  const taxable = invs.reduce((s, i) => s + i.amount, 0);
  const gst = Math.round(taxable * 0.18);
  res.json({ gstin: '29AABCH1234F1Z2', taxable: Math.round(taxable), gst, credit: Math.round(taxable * 0.06), status: invs.some((i) => i.status === 'pending') ? 'pending' : 'filed', periods: [
    { period: 'Q1 2026', taxable: Math.round(taxable * 0.4), gst: Math.round(taxable * 0.4 * 0.18), status: 'filed' },
    { period: 'Q2 2026', taxable: Math.round(taxable * 0.6), gst: Math.round(taxable * 0.6 * 0.18), status: 'pending' }
  ] });
});

router.get('/petty-cash', (req, res) => {
  const db = load();
  res.json({ entries: (db.pettyCash || []).filter((p) => p.businessId === req.business.id).sort((a, b) => new Date(b.date) - new Date(a.date)), fund: 10000 });
});
router.post('/petty-cash', requireOwner, (req, res) => {
  const db = load();
  const desc = sanitizeString(req.body.desc, 120);
  const amount = Math.round(Number(req.body.amount) * 100) / 100;
  if (!desc || !validPositiveAmount(amount)) return res.status(400).json({ error: 'Description and amount required.' });
  const entry = { id: genId('pc'), businessId: req.business.id, desc, amount, date: nowIso(), by: req.user.name };
  if (!Array.isArray(db.pettyCash)) db.pettyCash = [];
  db.pettyCash.push(entry);
  persist();
  res.status(201).json({ ok: true, entry });
});

router.get('/payslips', (req, res) => {
  const db = load();
  const bid = req.business.id;
  res.json({ payslips: (db.payslips || []).filter((p) => p.businessId === bid).sort((a, b) => new Date(b.date) - new Date(a.date)) });
});
router.post('/payslips/generate', requireOwner, (req, res) => {
  const db = load();
  const emp = db.users.find((u) => u.mode === 'business' && u.role === 'employee' && u.ownerId === req.user.id && u.id === String(req.body.employeeId || ''));
  if (!emp) return res.status(404).json({ error: 'Employee not found.' });
  const gross = emp.salary || 40000;
  const basic = Math.round(gross * 0.5);
  const hra = Math.round(gross * 0.25);
  const pf = Math.round(gross * 0.12);
  const tax = Math.round(gross * 0.05);
  const net = gross - pf - tax;
  const ps = { id: genId('ps'), businessId: req.business.id, employeeId: emp.id, employeeName: emp.name, period: 'August 2026', gross, basic, hra, pf, tax, net, date: nowIso() };
  if (!Array.isArray(db.payslips)) db.payslips = [];
  db.payslips.push(ps);
  persist();
  res.status(201).json({ ok: true, payslip: ps });
});
router.post('/salary/run', requireOwner, paymentLimiter, (req, res) => {
  const db = load();
  const op = req.business;
  const emps = db.users.filter((u) => u.mode === 'business' && u.role === 'employee' && u.ownerId === req.user.id && u.active);
  const total = emps.reduce((s, e) => s + (e.salary || 40000), 0);
  if (total > op.balance) return res.status(400).json({ error: `Insufficient business balance to pay salaries (needs ₹${total.toLocaleString('en-IN')}).` });
  op.balance = Math.round((op.balance - total) * 100) / 100;
  const paid = [];
  emps.forEach((e) => {
    const amt = e.salary || 40000;
    e.balance = Math.round((e.balance + amt) * 100) / 100;
    addTx(db, e, op, 'in', 'salary', req.user.name, amt, 'Salary credited');
    paid.push({ name: e.name, amount: amt });
  });
  persist();
  res.json({ ok: true, paid, total, balance: op.balance });
});

router.get('/business-health', (req, res) => {
  const db = load();
  const bid = req.business.id;
  const tx = db.transactions.filter((t) => (t.businessId === bid || t.actorId === bid) && t.status === 'completed');
  const inflow = tx.filter((t) => t.direction === 'in').reduce((s, t) => s + t.amount, 0);
  const outflow = tx.filter((t) => t.direction === 'out').reduce((s, t) => s + t.amount, 0);
  const margin = outflow > 0 ? Math.round(((inflow - outflow) / outflow) * 100) : 0;
  const pending = (db.invoices || []).filter((i) => i.businessId === bid && i.status !== 'paid').length;
  const score = Math.max(0, Math.min(100, 50 + Math.round(margin / 3) - pending * 4));
  const emps = db.users.filter((u) => u.mode === 'business' && u.ownerId === req.user.id && u.active);
  res.json({
    score,
    label: score >= 75 ? 'Healthy' : score >= 50 ? 'Watchful' : 'At risk',
    margin,
    inflow: Math.round(inflow),
    outflow: Math.round(outflow),
    pendingInvoices: pending,
    employeeCount: emps.length,
    cashReserve: req.business.balance
  });
});

module.exports = { router };

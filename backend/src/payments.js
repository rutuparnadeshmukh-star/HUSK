const express = require('express');
const { load, persist, genId, nowIso } = require('./store');
const { authRequired } = require('./middleware');
const { webhookLimiter, paymentLimiter, verifyRazorpaySignature, validPositiveAmount, sanitizeString } = require('./security');

const router = express.Router();

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'husk-dev-webhook-secret';

router.post('/razorpay', webhookLimiter, (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const payload = req.rawBody || JSON.stringify(req.body || {});

  const valid = verifyRazorpaySignature(payload, signature, RAZORPAY_WEBHOOK_SECRET);
  if (!valid) {
    return res.status(400).json({ error: 'Invalid webhook signature.' });
  }

  const event = req.body.event;
  const payment = req.body.payload && req.body.payload.payment && req.body.payload.payment.entity;
  const orderId = payment ? payment.order_id : null;

  if (event === 'payment.captured') {
    const db = load();
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) return res.status(200).json({ received: true, note: 'Order not found, ignored.' });
    if (order.status === 'paid') return res.status(200).json({ received: true, note: 'Already processed.' });

    const amountPaid = Number(payment.amount || 0) / 100;
    const owner = db.users.find((u) => u.id === order.userId);
    if (owner) {
      owner.balance = Math.round((owner.balance + amountPaid) * 100) / 100;
    }
    order.status = 'paid';
    order.paidAt = nowIso();
    order.razorpayPaymentId = payment.id;
    db.transactions.push({
      id: genId('tx'),
      userId: order.userId,
      actorId: order.userId,
      direction: 'in',
      type: 'topup',
      to: 'Razorpay (verified webhook)',
      amount: amountPaid,
      note: 'Money added via verified payment',
      date: nowIso(),
      status: 'completed'
    });
    persist();
    return res.json({ received: true, orderId, status: 'paid' });
  }

  res.json({ received: true });
});

router.post('/order', authRequired, paymentLimiter, (req, res) => {
  const db = load();
  const user = req.user;
  const amount = Number(req.body.amount);
  if (!validPositiveAmount(amount)) return res.status(400).json({ error: 'Enter a valid amount.' });

  const order = {
    id: genId('ord'),
    userId: user.id,
    amount: Math.round(amount * 100) / 100,
    purpose: sanitizeString(req.body.purpose || 'Add money', 60),
    status: 'created',
    createdAt: nowIso()
  };
  db.orders.push(order);
  persist();
  res.status(201).json({ order });
});

router.post('/simulate', authRequired, paymentLimiter, async (req, res) => {
  const db = load();
  const user = req.user;
  const orderId = String(req.body.orderId || '');
  const order = db.orders.find((o) => o.id === orderId && o.userId === user.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (order.status === 'paid') return res.status(400).json({ error: 'Order already processed.' });

  order.status = 'paid';
  order.paidAt = nowIso();
  user.balance = Math.round((user.balance + order.amount) * 100) / 100;
  db.transactions.push({
    id: genId('tx'),
    userId: user.id,
    actorId: user.id,
    direction: 'in',
    type: 'topup',
    to: 'Razorpay (simulated)',
    amount: order.amount,
    note: order.purpose,
    date: nowIso(),
    status: 'completed'
  });
  persist();
  res.json({ ok: true, balance: user.balance, amount: order.amount });
});

module.exports = router;

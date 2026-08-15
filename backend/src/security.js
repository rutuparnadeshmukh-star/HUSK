const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const { load, persist, genId, nowIso } = require('./store');

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function rateLimiter({ windowMs = 15 * 60 * 1000, max = 300, message = 'Too many requests, please try again later.' }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message }
  });
}

const authLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many authentication attempts. Try again in 15 minutes.' });
const paymentLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, max: 30, message: 'Too many payment attempts. Try again in 15 minutes.' });
const webhookLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, max: 100, message: 'Too many webhook requests.' });

function checkAccountLock(user) {
  if (!user.lockUntil || Date.now() > user.lockUntil) {
    return false;
  }
  return true;
}

function lockAccount(user) {
  user.failedAttempts = MAX_FAILED_ATTEMPTS;
  user.lockUntil = Date.now() + LOCK_DURATION_MS;
}

function recordFailure(user, field = 'login') {
  user.failedAttempts = (user.failedAttempts || 0) + 1;
  if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    lockAccount(user);
  }
  persist();
  return user;
}

function resetFailures(user) {
  if (user.failedAttempts || user.lockUntil) {
    user.failedAttempts = 0;
    user.lockUntil = 0;
  }
}

function verifyRazorpaySignature(payload, signature, secret) {
  if (!signature || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const provided = String(signature).trim();
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'));
  } catch (e) {
    return false;
  }
}

function sanitizeString(value, maxLen = 200) {
  if (typeof value !== 'string') return '';
  return value.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c])).slice(0, maxLen);
}

function validPositiveAmount(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

function logAudit(ownerId, userId, action, detail) {
  const db = load();
  db.auditLog.push({
    id: genId('log'),
    ownerId,
    userId: userId || null,
    action,
    detail: detail || '',
    timestamp: nowIso()
  });
  persist();
}

module.exports = {
  MAX_FAILED_ATTEMPTS,
  LOCK_DURATION_MS,
  sha256,
  rateLimiter,
  authLimiter,
  paymentLimiter,
  webhookLimiter,
  checkAccountLock,
  lockAccount,
  recordFailure,
  resetFailures,
  verifyRazorpaySignature,
  sanitizeString,
  validPositiveAmount,
  logAudit
};

const jwt = require('jsonwebtoken');
const { sha256 } = require('./security');
const { findUserById } = require('./user');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'artham-dev-access-secret';

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required.' });

  let payload;
  try {
    payload = jwt.verify(token, ACCESS_SECRET);
  } catch (e) {
    return res.status(401).json({ error: 'Session expired. Please log in again.', code: 'TOKEN_EXPIRED' });
  }

  const user = findUserById(payload.sub);
  if (!user) return res.status(401).json({ error: 'Account not found.' });
  if (user.active === false) return res.status(403).json({ error: 'Your access has been revoked.' });

  req.user = user;
  req.accessPayload = payload;

  const refresh = req.headers['x-refresh-token'];
  if (refresh) req.refreshHash = sha256(refresh);

  if (user.mode === 'business' && user.role === 'employee') {
    const owner = findUserById(user.ownerId);
    if (!owner || owner.active === false) {
      return res.status(403).json({ error: 'Your business access is no longer active.' });
    }
    req.business = owner;
  } else {
    req.business = user;
  }

  next();
}

function requireOwner(req, res, next) {
  if (req.user.mode !== 'business' || req.user.role !== 'owner') {
    return res.status(403).json({ error: 'This action is restricted to the business owner.' });
  }
  next();
}

module.exports = { authRequired, requireOwner };

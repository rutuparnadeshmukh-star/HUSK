const jwt = require('jsonwebtoken');
const { load } = require('./store');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'husk-dev-access-secret';

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    mode: user.mode,
    role: user.role || 'owner',
    ownerId: user.ownerId || null,
    biometricEnabled: !!user.biometricEnabled,
    paymentPinSet: !!user.paymentPinHash,
    balance: Math.round(user.balance * 100) / 100,
    dailyLimit: user.dailyLimit,
    txnLimit: user.txnLimit,
    active: user.active !== false,
    createdAt: user.createdAt
  };
}

function issueAccessToken(userId) {
  return jwt.sign({ sub: userId, type: 'access' }, ACCESS_SECRET, { expiresIn: (Number(process.env.ACCESS_TOKEN_TTL) || 15) * 60 });
}

function findUserById(userId) {
  const db = load();
  return db.users.find((u) => u.id === userId);
}

module.exports = { publicUser, issueAccessToken, findUserById };

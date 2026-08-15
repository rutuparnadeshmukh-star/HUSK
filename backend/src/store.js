const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const defaultDb = {
  users: [],
  sessions: [],
  transactions: [],
  expenses: [],
  auditLog: [],
  orders: [],
  bankLinks: [],
  portfolio: []
};

let db = null;
let saveTimer = null;

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function load() {
  if (db) return db;
  ensureDir();
  if (fs.existsSync(DB_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      for (const key of Object.keys(defaultDb)) {
        if (!Array.isArray(db[key])) db[key] = [];
      }
    } catch (e) {
      db = JSON.parse(JSON.stringify(defaultDb));
    }
  } else {
    db = JSON.parse(JSON.stringify(defaultDb));
  }
  return db;
}

function persist() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    ensureDir();
    const tmp = DB_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
    fs.renameSync(tmp, DB_FILE);
  }, 120);
}

function flushNow() {
  if (saveTimer) clearTimeout(saveTimer);
  ensureDir();
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

function genId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
}

function nowIso() {
  return new Date().toISOString();
}

module.exports = {
  load,
  persist,
  flushNow,
  genId,
  nowIso,
  get db() {
    return load();
  }
};

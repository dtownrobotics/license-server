import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'licenses.json');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
let mongoClient = null;
let mongoColl = null;

/** Normalize for comparison: remove dashes/spaces, uppercase, 16 alphanumeric only. */
function normalizeKey(key) {
  if (!key || typeof key !== 'string') return '';
  const raw = key.replace(/[\s\-]/g, '').toUpperCase();
  return raw.length === 16 ? raw : '';
}

/** Validate format: 16 alphanumeric, optional dashes in form xxxx-xxxx-xxxx-xxxx. */
export function isValidKeyFormat(key) {
  if (!key || typeof key !== 'string') return false;
  const normalized = key.replace(/[\s\-]/g, '');
  if (normalized.length !== 16) return false;
  return /^[A-Za-z0-9]+$/.test(normalized);
}

/** Format key for display/storage: XXXX-XXXX-XXXX-XXXX. */
export function formatKey(key) {
  const n = normalizeKey(key);
  if (n.length !== 16) return '';
  return n.slice(0, 4) + '-' + n.slice(4, 8) + '-' + n.slice(8, 12) + '-' + n.slice(12, 16);
}

/** Generate a new random key (16 alphanumeric, formatted). */
export function generateKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let raw = '';
  for (let i = 0; i < 16; i++) {
    raw += chars[Math.floor(Math.random() * chars.length)];
  }
  return formatKey(raw);
}

// ---------- File-based (default) ----------
function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readDbSync() {
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

function writeDbSync(db) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
}

// ---------- MongoDB (when MONGODB_URI is set) ----------
async function initMongo() {
  const { MongoClient } = await import('mongodb');
  mongoClient = new MongoClient(MONGODB_URI);
  await mongoClient.connect();
  const db = mongoClient.db('licensedb');
  mongoColl = db.collection('licenses');
  await mongoColl.createIndex({ keyNorm: 1 }, { unique: true });
  const count = await mongoColl.countDocuments();
  if (count === 0) {
    await mongoColl.insertMany([
      { key: 'A1B2-C3D4-E5F6-G7H8', keyNorm: 'A1B2C3D4E5F6G7H8', machineId: null, activatedAt: null },
      { key: 'X9Y8-Z7W6-V5U4-T3S2', keyNorm: 'X9Y8Z7W6V5U4T3S2', machineId: null, activatedAt: null }
    ]);
  }
}

async function getLicenseByKeyMongo(key) {
  const n = normalizeKey(key);
  if (!n) return null;
  const doc = await mongoColl.findOne({ keyNorm: n });
  if (!doc) return null;
  return { key: doc.key, machineId: doc.machineId ?? null, activatedAt: doc.activatedAt ?? null };
}

async function activateLicenseMongo(key, machineId) {
  const n = normalizeKey(key);
  if (!n) throw new Error('Invalid key');
  const res = await mongoColl.updateOne(
    { keyNorm: n },
    { $set: { machineId, activatedAt: new Date().toISOString() } }
  );
  if (res.matchedCount === 0) throw new Error('License not found');
}

// ---------- Public API (file or Mongo) ----------
export async function initDb() {
  if (MONGODB_URI) {
    console.log('license-server: MONGODB_URI detected, using MongoDB backend');
    await initMongo();
    return;
  }
  console.log('license-server: MONGODB_URI not set, using local JSON file backend');
  ensureDirExists(DATA_DIR);
  if (!fs.existsSync(DATA_FILE)) {
    const initial = {
      licenses: [
        { key: 'A1B2-C3D4-E5F6-G7H8', machineId: null, activatedAt: null },
        { key: 'X9Y8-Z7W6-V5U4-T3S2', machineId: null, activatedAt: null }
      ]
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf8');
  }
}

export async function getLicenseByKey(key) {
  if (mongoColl) return getLicenseByKeyMongo(key);
  const n = normalizeKey(key);
  if (!n) return null;
  const db = readDbSync();
  return db.licenses.find((lic) => normalizeKey(lic.key) === n) || null;
}

export async function activateLicense(key, machineId) {
  if (mongoColl) return activateLicenseMongo(key, machineId);
  const n = normalizeKey(key);
  if (!n) throw new Error('Invalid key');
  const db = readDbSync();
  const idx = db.licenses.findIndex((lic) => normalizeKey(lic.key) === n);
  if (idx === -1) throw new Error('License not found');
  db.licenses[idx].machineId = machineId;
  db.licenses[idx].activatedAt = new Date().toISOString();
  writeDbSync(db);
}


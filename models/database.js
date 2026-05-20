const Database = require('better-sqlite3');
const path = require('path');

const fs = require('fs');
const path = require('path');
const DATA_DIR = process.env.DATA_DIR || (fs.existsSync('/data') ? '/data' : path.join(__dirname, '..', 'data'));
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, 'nexusai.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initialize() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      providerId TEXT NOT NULL,
      displayName TEXT,
      email TEXT,
      avatar TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      UNIQUE(provider, providerId)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT DEFAULT 'محادثة جديدة',
      model TEXT DEFAULT 'Qwen3-32B',
      messages TEXT DEFAULT '[]',
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_conversations_userId ON conversations(userId)`);
}

function upsertUser(profile) {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE provider = ? AND providerId = ?').get(profile.provider, profile.id);

  if (existing) {
    db.prepare('UPDATE users SET displayName = ?, email = ?, avatar = ? WHERE id = ?')
      .run(profile.displayName, profile.email, profile.avatar, existing.id);
    return existing.id;
  }

  const id = require('uuid').v4();
  db.prepare('INSERT INTO users (id, provider, providerId, displayName, email, avatar) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, profile.provider, profile.id, profile.displayName, profile.email, profile.avatar);
  return id;
}

function getUserById(id) {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id);
}

// ─── Conversations ─────────────────────────────────────

function createConversation(userId, title, model) {
  const id = require('uuid').v4();
  getDb().prepare('INSERT INTO conversations (id, userId, title, model) VALUES (?, ?, ?, ?)')
    .run(id, userId, title || 'محادثة جديدة', model || 'Qwen3-32B');
  return id;
}

function getConversations(userId) {
  return getDb().prepare('SELECT id, title, model, createdAt, updatedAt FROM conversations WHERE userId = ? ORDER BY updatedAt DESC').all(userId);
}

function getConversation(id, userId) {
  return getDb().prepare('SELECT * FROM conversations WHERE id = ? AND userId = ?').get(id, userId);
}

function updateConversation(id, userId, data) {
  if (data.title) {
    getDb().prepare('UPDATE conversations SET title = ?, updatedAt = datetime(\'now\') WHERE id = ? AND userId = ?')
      .run(data.title, id, userId);
  }
  if (data.messages) {
    getDb().prepare('UPDATE conversations SET messages = ?, updatedAt = datetime(\'now\') WHERE id = ? AND userId = ?')
      .run(JSON.stringify(data.messages), id, userId);
  }
  if (data.model) {
    getDb().prepare('UPDATE conversations SET model = ?, updatedAt = datetime(\'now\') WHERE id = ? AND userId = ?')
      .run(data.model, id, userId);
  }
}

function deleteConversation(id, userId) {
  getDb().prepare('DELETE FROM conversations WHERE id = ? AND userId = ?').run(id, userId);
}

module.exports = { initialize, upsertUser, getUserById, createConversation, getConversations, getConversation, updateConversation, deleteConversation };

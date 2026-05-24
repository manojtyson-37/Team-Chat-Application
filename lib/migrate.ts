import { createClient } from '@libsql/client';

let migrated = false;

function getClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

export async function runMigrations() {
  if (migrated) return;
  const db = getClient();

  // Fast-path: if typing_indicators exists, schema is already set up.
  // Just run ALTER TABLE attempts (fail silently) and return.
  const check = await db.execute(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='typing_indicators'`
  );

  if (check.rows.length > 0) {
    // Schema exists — only run additive ALTER TABLE for new columns
    const newCols = [
      'ALTER TABLE messages ADD COLUMN pinned_at TEXT',
      'ALTER TABLE messages ADD COLUMN pinned_by INTEGER',
    ];
    await Promise.all(newCols.map(sql => db.execute(sql).catch(() => {})));
    migrated = true;
    return;
  }

  // First-time setup: create all tables in parallel where possible
  await Promise.all([
    db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        avatar_color TEXT NOT NULL,
        profile_picture_url TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        last_seen_at TEXT DEFAULT (datetime('now'))
      )
    `),
    db.execute(`
      CREATE TABLE IF NOT EXISTS channels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        created_by INTEGER,
        is_dm INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `),
    db.execute(`
      CREATE TABLE IF NOT EXISTS channel_members (
        channel_id INTEGER,
        user_id INTEGER,
        joined_at TEXT DEFAULT (datetime('now')),
        PRIMARY KEY (channel_id, user_id)
      )
    `),
    db.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        is_ai INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        channel_id INTEGER DEFAULT 1,
        user_id INTEGER,
        parent_id INTEGER,
        media_url TEXT,
        media_type TEXT,
        edited_at TEXT,
        pinned_at TEXT,
        pinned_by INTEGER
      )
    `),
    db.execute(`
      CREATE TABLE IF NOT EXISTS reactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        emoji TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(message_id, user_id, emoji)
      )
    `),
    db.execute(`
      CREATE TABLE IF NOT EXISTS read_receipts (
        channel_id INTEGER,
        user_id INTEGER,
        last_read_message_id INTEGER DEFAULT 0,
        read_at TEXT DEFAULT (datetime('now')),
        PRIMARY KEY (channel_id, user_id)
      )
    `),
    db.execute(`
      CREATE TABLE IF NOT EXISTS typing_indicators (
        channel_id INTEGER,
        user_id INTEGER,
        updated_at TEXT DEFAULT (datetime('now')),
        PRIMARY KEY (channel_id, user_id)
      )
    `),
  ]);

  // ALTER TABLE for existing DBs that predate some columns
  const alterCols = [
    'ALTER TABLE messages ADD COLUMN channel_id INTEGER DEFAULT 1',
    'ALTER TABLE messages ADD COLUMN user_id INTEGER',
    'ALTER TABLE messages ADD COLUMN parent_id INTEGER',
    'ALTER TABLE messages ADD COLUMN media_url TEXT',
    'ALTER TABLE messages ADD COLUMN media_type TEXT',
    'ALTER TABLE messages ADD COLUMN edited_at TEXT',
    'ALTER TABLE messages ADD COLUMN pinned_at TEXT',
    'ALTER TABLE messages ADD COLUMN pinned_by INTEGER',
    'ALTER TABLE users ADD COLUMN profile_picture_url TEXT',
  ];
  await Promise.all(alterCols.map(sql => db.execute(sql).catch(() => {})));

  // Seed #general channel
  const existing = await db.execute('SELECT id FROM channels WHERE id = 1');
  if (existing.rows.length === 0) {
    await db.execute("INSERT INTO channels (id, name, description) VALUES (1, 'general', 'General discussion')");
  }

  migrated = true;
}

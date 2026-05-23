import { createClient, type Client } from '@libsql/client';

let client: Client;

function getClient() {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

export async function initDb() {
  const db = getClient();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      content TEXT NOT NULL,
      is_ai INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
}

export interface Message {
  id: number;
  username: string;
  content: string;
  is_ai: number;
  created_at: string;
}

export async function getMessages(after?: number): Promise<Message[]> {
  const db = getClient();
  await initDb();
  if (after) {
    const result = await db.execute({
      sql: 'SELECT * FROM messages WHERE id > ? ORDER BY id ASC',
      args: [after],
    });
    return result.rows as unknown as Message[];
  }
  const result = await db.execute(
    'SELECT * FROM messages ORDER BY id DESC LIMIT 100'
  );
  return (result.rows as unknown as Message[]).reverse();
}

export async function addMessage(username: string, content: string, isAi = false): Promise<Message> {
  const db = getClient();
  await initDb();
  const result = await db.execute({
    sql: 'INSERT INTO messages (username, content, is_ai) VALUES (?, ?, ?)',
    args: [username, content, isAi ? 1 : 0],
  });
  const row = await db.execute({
    sql: 'SELECT * FROM messages WHERE id = ?',
    args: [Number(result.lastInsertRowid)],
  });
  return row.rows[0] as unknown as Message;
}

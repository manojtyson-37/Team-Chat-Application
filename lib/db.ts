import { createClient, type Client } from '@libsql/client';
import { runMigrations } from './migrate';
import type { Message, Channel, User } from './types';

let client: Client;

function getClient() {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const token = process.env.TURSO_AUTH_TOKEN;
    console.log(`[DB] Creating Turso client with URL: ${url?.substring(0, 40)}...`);
    if (!url) throw new Error('TURSO_DATABASE_URL not set');
    if (!token) throw new Error('TURSO_AUTH_TOKEN not set');
    client = createClient({ url, authToken: token });
  }
  return client;
}

async function db() {
  await runMigrations();
  return getClient();
}

// ── Users ──

export async function createUser(username: string, passwordHash: string, avatarColor: string): Promise<User> {
  const d = await db();
  const result = await d.execute({
    sql: 'INSERT INTO users (username, password_hash, avatar_color) VALUES (?, ?, ?)',
    args: [username, passwordHash, avatarColor],
  });
  const row = await d.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [Number(result.lastInsertRowid)] });
  return row.rows[0] as unknown as User;
}

export async function getUserByUsername(username: string): Promise<(User & { password_hash: string }) | null> {
  const d = await db();
  const result = await d.execute({ sql: 'SELECT * FROM users WHERE username = ?', args: [username] });
  return (result.rows[0] as unknown as (User & { password_hash: string })) || null;
}

export async function getUserById(id: number): Promise<User | null> {
  const d = await db();
  const result = await d.execute({
    sql: 'SELECT id, username, avatar_color, created_at, last_seen_at FROM users WHERE id = ?',
    args: [id]
  });
  const row = result.rows[0] as any;
  if (!row) return null;
  // Add profile_picture_url with null default if it doesn't exist in database
  return {
    ...row,
    profile_picture_url: row.profile_picture_url || null
  } as User;
}

export async function getAllUsers(): Promise<User[]> {
  const d = await db();
  const result = await d.execute('SELECT id, username, avatar_color, created_at, last_seen_at FROM users');
  return result.rows.map(row => ({
    ...row,
    profile_picture_url: null
  })) as unknown as User[];
}

export async function updateLastSeen(userId: number) {
  const d = await db();
  await d.execute({ sql: "UPDATE users SET last_seen_at = datetime('now') WHERE id = ?", args: [userId] });
}

export async function updateProfilePicture(userId: number, profilePictureUrl: string): Promise<void> {
  const d = await db();
  await d.execute({
    sql: 'UPDATE users SET profile_picture_url = ? WHERE id = ?',
    args: [profilePictureUrl, userId],
  });
}

// ── Channels ──

export async function getChannelsForUser(userId: number): Promise<Channel[]> {
  const d = await db();
  const result = await d.execute({
    sql: `SELECT c.* FROM channels c
          JOIN channel_members cm ON c.id = cm.channel_id
          WHERE cm.user_id = ?
          ORDER BY c.is_dm ASC, c.name ASC`,
    args: [userId],
  });
  return result.rows as unknown as Channel[];
}

export async function createChannel(name: string, createdBy: number, isDm = false): Promise<Channel> {
  const d = await db();
  const result = await d.execute({
    sql: 'INSERT INTO channels (name, created_by, is_dm) VALUES (?, ?, ?)',
    args: [name, createdBy, isDm ? 1 : 0],
  });
  const channelId = Number(result.lastInsertRowid);
  await d.execute({ sql: 'INSERT INTO channel_members (channel_id, user_id) VALUES (?, ?)', args: [channelId, createdBy] });
  const row = await d.execute({ sql: 'SELECT * FROM channels WHERE id = ?', args: [channelId] });
  return row.rows[0] as unknown as Channel;
}

export async function addChannelMember(channelId: number, userId: number) {
  const d = await db();
  try {
    await d.execute({ sql: 'INSERT INTO channel_members (channel_id, user_id) VALUES (?, ?)', args: [channelId, userId] });
  } catch {}
}

export async function removeChannelMember(channelId: number, userId: number) {
  const d = await db();
  await d.execute({ sql: 'DELETE FROM channel_members WHERE channel_id = ? AND user_id = ?', args: [channelId, userId] });
}

export async function getNonMembers(channelId: number): Promise<User[]> {
  const d = await db();
  const result = await d.execute({
    sql: `SELECT u.id, u.username, u.avatar_color, u.profile_picture_url, u.created_at, u.last_seen_at
          FROM users u
          WHERE u.id NOT IN (SELECT user_id FROM channel_members WHERE channel_id = ?)`,
    args: [channelId],
  });
  return result.rows as unknown as User[];
}

export async function getChannelMembers(channelId: number): Promise<User[]> {
  const d = await db();
  const result = await d.execute({
    sql: `SELECT u.id, u.username, u.avatar_color, u.profile_picture_url, u.created_at, u.last_seen_at
          FROM users u JOIN channel_members cm ON u.id = cm.user_id
          WHERE cm.channel_id = ?`,
    args: [channelId],
  });
  return result.rows as unknown as User[];
}

export async function findDmChannel(userId1: number, userId2: number): Promise<Channel | null> {
  const d = await db();
  const result = await d.execute({
    sql: `SELECT c.* FROM channels c
          JOIN channel_members cm1 ON c.id = cm1.channel_id AND cm1.user_id = ?
          JOIN channel_members cm2 ON c.id = cm2.channel_id AND cm2.user_id = ?
          WHERE c.is_dm = 1`,
    args: [userId1, userId2],
  });
  return (result.rows[0] as unknown as Channel) || null;
}

export async function ensureUserInGeneral(userId: number) {
  const d = await db();
  try {
    await d.execute({ sql: 'INSERT INTO channel_members (channel_id, user_id) VALUES (1, ?)', args: [userId] });
  } catch {}
}

// ── Messages ──

export async function getMessages(channelId: number, after?: number, parentId?: number | null): Promise<Message[]> {
  const d = await db();
  let sql: string;
  const args: (number | null)[] = [channelId];

  if (parentId !== undefined) {
    sql = `SELECT m.*, u.avatar_color, u.profile_picture_url FROM messages m
           LEFT JOIN users u ON m.user_id = u.id
           WHERE m.parent_id = ? ORDER BY m.id ASC`;
    args.length = 0;
    args.push(parentId!);
  } else if (after) {
    sql = `SELECT m.*, u.avatar_color, u.profile_picture_url FROM messages m
           LEFT JOIN users u ON m.user_id = u.id
           WHERE m.channel_id = ? AND m.id > ? AND m.parent_id IS NULL
           ORDER BY m.id ASC`;
    args.push(after);
  } else {
    sql = `SELECT m.*, u.avatar_color, u.profile_picture_url FROM messages m
           LEFT JOIN users u ON m.user_id = u.id
           WHERE m.channel_id = ? AND m.parent_id IS NULL
           ORDER BY m.id DESC LIMIT 100`;
    args.push();
  }

  const result = await d.execute({ sql, args: args.length === 1 ? [args[0]] : args });
  const messages = result.rows as unknown as Message[];

  if (!after && parentId === undefined) messages.reverse();
  return messages;
}

export async function addMessage(
  userId: number, username: string, content: string, channelId: number,
  parentId?: number | null, mediaUrl?: string | null, mediaType?: string | null
): Promise<Message> {
  const d = await db();
  const result = await d.execute({
    sql: `INSERT INTO messages (username, content, channel_id, user_id, parent_id, media_url, media_type)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [username, content, channelId, userId, parentId || null, mediaUrl || null, mediaType || null],
  });
  const row = await d.execute({
    sql: 'SELECT m.*, u.avatar_color, u.profile_picture_url FROM messages m LEFT JOIN users u ON m.user_id = u.id WHERE m.id = ?',
    args: [Number(result.lastInsertRowid)],
  });
  return row.rows[0] as unknown as Message;
}

export async function editMessage(messageId: number, userId: number, content: string): Promise<boolean> {
  const d = await db();
  const result = await d.execute({
    sql: "UPDATE messages SET content = ?, edited_at = datetime('now') WHERE id = ? AND user_id = ?",
    args: [content, messageId, userId],
  });
  return result.rowsAffected > 0;
}

export async function deleteMessage(messageId: number, userId: number): Promise<boolean> {
  const d = await db();
  await d.execute({ sql: 'DELETE FROM reactions WHERE message_id = ?', args: [messageId] });
  await d.execute({ sql: 'DELETE FROM messages WHERE parent_id = ?', args: [messageId] });
  const result = await d.execute({
    sql: 'DELETE FROM messages WHERE id = ? AND user_id = ?',
    args: [messageId, userId],
  });
  return result.rowsAffected > 0;
}

export async function searchMessages(query: string, userId: number): Promise<Message[]> {
  const d = await db();
  const result = await d.execute({
    sql: `SELECT m.*, u.avatar_color, u.profile_picture_url, c.name as channel_name, c.is_dm
          FROM messages m
          LEFT JOIN users u ON m.user_id = u.id
          JOIN channels c ON m.channel_id = c.id
          JOIN channel_members cm ON c.id = cm.channel_id AND cm.user_id = ?
          WHERE m.content LIKE ?
          ORDER BY m.id DESC LIMIT 50`,
    args: [userId, `%${query}%`],
  });
  return result.rows as unknown as Message[];
}

export async function getThreadReplyCount(messageId: number): Promise<number> {
  const d = await db();
  const result = await d.execute({ sql: 'SELECT COUNT(*) as count FROM messages WHERE parent_id = ?', args: [messageId] });
  return Number((result.rows[0] as unknown as { count: number }).count);
}

// ── Reactions ──

export async function addReaction(messageId: number, userId: number, emoji: string) {
  const d = await db();
  try {
    await d.execute({
      sql: 'INSERT INTO reactions (message_id, user_id, emoji) VALUES (?, ?, ?)',
      args: [messageId, userId, emoji],
    });
  } catch {}
}

export async function removeReaction(messageId: number, userId: number, emoji: string) {
  const d = await db();
  await d.execute({
    sql: 'DELETE FROM reactions WHERE message_id = ? AND user_id = ? AND emoji = ?',
    args: [messageId, userId, emoji],
  });
}

export async function getReactionsForMessages(messageIds: number[], currentUserId: number) {
  if (messageIds.length === 0) return {};
  const d = await db();
  const placeholders = messageIds.map(() => '?').join(',');
  const result = await d.execute({
    sql: `SELECT r.message_id, r.emoji, r.user_id, u.username
          FROM reactions r JOIN users u ON r.user_id = u.id
          WHERE r.message_id IN (${placeholders})`,
    args: messageIds,
  });

  const grouped: Record<number, Record<string, { count: number; users: string[]; reacted: boolean }>> = {};
  for (const row of result.rows) {
    const r = row as unknown as { message_id: number; emoji: string; user_id: number; username: string };
    if (!grouped[r.message_id]) grouped[r.message_id] = {};
    if (!grouped[r.message_id][r.emoji]) grouped[r.message_id][r.emoji] = { count: 0, users: [], reacted: false };
    grouped[r.message_id][r.emoji].count++;
    grouped[r.message_id][r.emoji].users.push(r.username);
    if (r.user_id === currentUserId) grouped[r.message_id][r.emoji].reacted = true;
  }
  return grouped;
}

// ── Read Receipts ──

export async function markAsRead(channelId: number, userId: number, messageId: number) {
  const d = await db();
  await d.execute({
    sql: `INSERT INTO read_receipts (channel_id, user_id, last_read_message_id, read_at)
          VALUES (?, ?, ?, datetime('now'))
          ON CONFLICT(channel_id, user_id)
          DO UPDATE SET last_read_message_id = MAX(last_read_message_id, ?), read_at = datetime('now')`,
    args: [channelId, userId, messageId, messageId],
  });
}

export async function getUnreadCounts(userId: number, channelIds: number[]): Promise<Record<number, number>> {
  if (channelIds.length === 0) return {};
  const d = await db();
  const counts: Record<number, number> = {};
  for (const cid of channelIds) {
    const receipt = await d.execute({
      sql: 'SELECT last_read_message_id FROM read_receipts WHERE channel_id = ? AND user_id = ?',
      args: [cid, userId],
    });
    const lastRead = receipt.rows.length > 0 ? Number((receipt.rows[0] as unknown as { last_read_message_id: number }).last_read_message_id) : 0;
    const unread = await d.execute({
      sql: 'SELECT COUNT(*) as count FROM messages WHERE channel_id = ? AND id > ? AND parent_id IS NULL AND user_id != ?',
      args: [cid, lastRead, userId],
    });
    counts[cid] = Number((unread.rows[0] as unknown as { count: number }).count);
  }
  return counts;
}

export async function getReadReceipt(channelId: number, userId: number): Promise<number> {
  const d = await db();
  const result = await d.execute({
    sql: 'SELECT last_read_message_id FROM read_receipts WHERE channel_id = ? AND user_id = ?',
    args: [channelId, userId],
  });
  return result.rows.length > 0 ? Number((result.rows[0] as unknown as { last_read_message_id: number }).last_read_message_id) : 0;
}

// ── Pinning ──

export async function pinMessage(messageId: number, userId: number): Promise<boolean> {
  const d = await db();
  const result = await d.execute({
    sql: "UPDATE messages SET pinned_at = datetime('now'), pinned_by = ? WHERE id = ?",
    args: [userId, messageId],
  });
  return result.rowsAffected > 0;
}

export async function unpinMessage(messageId: number): Promise<boolean> {
  const d = await db();
  const result = await d.execute({
    sql: 'UPDATE messages SET pinned_at = NULL, pinned_by = NULL WHERE id = ?',
    args: [messageId],
  });
  return result.rowsAffected > 0;
}

export async function getPinnedMessages(channelId: number): Promise<Message[]> {
  const d = await db();
  const result = await d.execute({
    sql: `SELECT m.*, u.avatar_color, u.profile_picture_url FROM messages m
          LEFT JOIN users u ON m.user_id = u.id
          WHERE m.channel_id = ? AND m.pinned_at IS NOT NULL
          ORDER BY m.pinned_at DESC`,
    args: [channelId],
  });
  return result.rows as unknown as Message[];
}

// ── Typing ──

export async function setTyping(channelId: number, userId: number) {
  const d = await db();
  await d.execute({
    sql: `INSERT INTO typing_indicators (channel_id, user_id, updated_at)
          VALUES (?, ?, datetime('now'))
          ON CONFLICT(channel_id, user_id)
          DO UPDATE SET updated_at = datetime('now')`,
    args: [channelId, userId],
  });
}

export async function getTypingUsers(channelId: number, excludeUserId: number): Promise<{ username: string; avatar_color: string; profile_picture_url?: string }[]> {
  const d = await db();
  const result = await d.execute({
    sql: `SELECT u.username, u.avatar_color, u.profile_picture_url FROM typing_indicators t
          JOIN users u ON t.user_id = u.id
          WHERE t.channel_id = ? AND t.user_id != ?
          AND t.updated_at > datetime('now', '-4 seconds')`,
    args: [channelId, excludeUserId],
  });
  return result.rows as unknown as { username: string; avatar_color: string; profile_picture_url?: string }[];
}

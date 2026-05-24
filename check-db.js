import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function check() {
  try {
    console.log("=== Checking Database ===\n");
    
    // Check users
    const users = await db.execute("SELECT id, username, email FROM users");
    console.log("Users:", users.rows.length > 0 ? users.rows : "No users");
    
    // Check channels
    const channels = await db.execute("SELECT id, name FROM channels");
    console.log("\nChannels:", channels.rows.length > 0 ? channels.rows : "No channels");
    
    // Check messages count
    const messages = await db.execute("SELECT COUNT(*) as count FROM messages");
    console.log("\nMessages:", messages.rows[0]);
    
    // Check DMs count
    const dms = await db.execute("SELECT COUNT(*) as count FROM dms");
    console.log("DMs:", dms.rows[0]);
  } catch (error) {
    console.error("Error:", error.message);
  }
  process.exit(0);
}

check();

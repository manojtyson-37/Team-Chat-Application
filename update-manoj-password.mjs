import bcrypt from 'bcryptjs';
import { createClient } from '@libsql/client';

const newPassword = 'Manoj@12345';
const hash = await bcrypt.hash(newPassword, 10);

console.log("🔄 Connecting to Turso database...");

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

try {
  console.log("📝 Updating Manoj's password...");
  
  const result = await client.execute({
    sql: 'UPDATE users SET password_hash = ? WHERE username = ?',
    args: [hash, 'Manoj']
  });
  
  console.log("✅ Password updated successfully!");
  console.log("\n📋 Your New Login Credentials:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Username: Manoj");
  console.log("Password: Manoj@12345");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n🌐 Access your app at: http://localhost:3000");
  
} catch (error) {
  console.error("❌ Error:", error.message);
  console.error("Stack:", error.stack);
}

process.exit(0);

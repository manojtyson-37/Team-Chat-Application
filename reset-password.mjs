import bcrypt from 'bcryptjs';
import { createClient } from '@libsql/client';

const password = 'Manoj@12345';
const hash = await bcrypt.hash(password, 10);

console.log("Updating Manoj's password...");

const db = createClient({
  url: 'libsql://team-chat-manojtyson-37.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3Nzk1NzI1ODQsImlkIjoiMDE5ZTU2Y2EtOTEwMS03ZWM5LTg0NjItN2U0MmY4ZmNmNjQyIiwicmlkIjoiYjdlZjQxM2QtZTA0Mi00YmU0LThkYTAtYjVmMGQ1NDFjNjA1In0.v_qALtytGX4oblZcSlGvo4zOnQqvLGxWYaog4rUp3_cokrV7Tu4uACxooxruxYC9MqlAGbfNpNeDuP_5D_aQCA'
});

try {
  await db.execute({
    sql: 'UPDATE users SET password_hash = ? WHERE username = ?',
    args: [hash, 'Manoj']
  });
  console.log("✅ Password updated successfully!");
  console.log(`\nLogin with:\nUsername: Manoj\nPassword: Manoj@12345`);
} catch (e) {
  console.error("❌ Error:", e.message);
}

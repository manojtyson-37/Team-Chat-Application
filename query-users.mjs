import { createClient } from '@libsql/client';

const db = createClient({
  url: 'libsql://team-chat-manojtyson-37.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3Nzk1NzI1ODQsImlkIjoiMDE5ZTU2Y2EtOTEwMS03ZWM5LTg0NjItN2U0MmY4ZmNmNjQyIiwicmlkIjoiYjdlZjQxM2QtZTA0Mi00YmU0LThkYTAtYjVmMGQ1NDFjNjA1In0.v_qALtytGX4oblZcSlGvo4zOnQqvLGxWYaog4rUp3_cokrV7Tu4uACxooxruxYC9MqlAGbfNpNeDuP_5D_aQCA'
});

const result = await db.execute(
  "SELECT id, username, created_at FROM users"
);

console.log("All users in database:");
console.log(JSON.stringify(result.rows, null, 2));

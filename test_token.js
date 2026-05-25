import { createClient } from '@libsql/client';

const url = 'libsql://team-chat-manojtyson-37.aws-ap-south-1.turso.io';
const token = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Nzk3MjcxMzksImlkIjoiMDE5ZTU2Y2EtOTEwMS03ZWM5LTg0NjItN2U0MmY4ZmNmNjQyIiwicmlkIjoiYjdlZjQxM2QtZTA0Mi00YmU0LThkYTAtYjVmMGQ1NDFjNjA1In0._ro3UcAKAmTD6likPgR2POB1-TnxGrF7YoSYJghy1dl2OUDpkkHG0Hg6Xp6miHLEdZAeE-PmDjLfdciQln7UAw';

console.log('Testing Turso connection with token...');
console.log('URL:', url);
console.log('Token payload (decoded):', {
  "a": "rw",
  "iat": 1779727139,
  "id": "019e56ca-9101-7ec9-8462-7e42f8fcf642",
  "rid": "b7ef413d-e042-4be4-8da0-b5f0d541c605"
});

try {
  const client = createClient({ url, authToken: token });
  console.log('Client created successfully');
  
  const result = await client.execute('SELECT 1 as test');
  console.log('Query successful:', result);
} catch (error) {
  console.error('Error:', error.message);
  console.error('Full error:', error);
}

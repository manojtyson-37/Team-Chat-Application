import bcrypt from 'bcryptjs';

const newPassword = 'Manoj@12345';
const hash = await bcrypt.hash(newPassword, 10);

console.log(`\nPassword hash for "Manoj@12345":`);
console.log(hash);
console.log(`\nYou can use this to manually update the database, or...`);
console.log(`Try logging in with: testuser / Test@12345`);
console.log(`Then we can update Manoj's password through the app.`);

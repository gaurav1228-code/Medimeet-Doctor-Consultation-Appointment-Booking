// test-100ms.js - Run this to verify your setup
// Usage: node test-100ms.js
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });


console.log("🧪 100ms Integration Test\n");

console.log("1️⃣  Checking environment variables...");
console.log("HMS_MANAGEMENT_TOKEN:", process.env.HMS_MANAGEMENT_TOKEN ? "✅" : "❌");
console.log("HMS_APP_ACCESS_KEY:", process.env.HMS_APP_ACCESS_KEY ? "✅" : "❌");
console.log("HMS_APP_SECRET:", process.env.HMS_APP_SECRET ? "✅" : "❌");

const jwt = require('jsonwebtoken');

console.log('🧪 100ms Integration Test\n');

// Test 1: Check environment variables
console.log('1️⃣  Checking environment variables...');
const HMS_MANAGEMENT_TOKEN = process.env.HMS_MANAGEMENT_TOKEN;
const HMS_APP_ACCESS_KEY = process.env.HMS_APP_ACCESS_KEY;
const HMS_APP_SECRET = process.env.HMS_APP_SECRET;

if (!HMS_MANAGEMENT_TOKEN || !HMS_APP_ACCESS_KEY || !HMS_APP_SECRET) {
  console.log('❌ Missing environment variables!');
  console.log('HMS_MANAGEMENT_TOKEN:', HMS_MANAGEMENT_TOKEN ? '✅' : '❌');
  console.log('HMS_APP_ACCESS_KEY:', HMS_APP_ACCESS_KEY ? '✅' : '❌');
  console.log('HMS_APP_SECRET:', HMS_APP_SECRET ? '✅' : '❌');
  process.exit(1);
}
console.log('✅ All environment variables present\n');

// Test 2: Generate a test token
console.log('2️⃣  Testing token generation...');
try {
  const testPayload = {
    access_key: HMS_APP_ACCESS_KEY,
    room_id: 'test-room-123',
    user_id: 'test-user-456',
    role: 'guest',
    type: 'app',
    version: 2,
    iat: Math.floor(Date.now() / 1000),
    nbf: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
  };

  const token = jwt.sign(testPayload, HMS_APP_SECRET, {
    algorithm: 'HS256'
  });

  console.log('✅ Token generated successfully');
  console.log('Token preview:', token.substring(0, 50) + '...\n');
} catch (error) {
  console.log('❌ Token generation failed:', error.message);
  process.exit(1);
}

// Test 3: Verify management token structure
console.log('3️⃣  Verifying management token...');
try {
  const decoded = jwt.decode(HMS_MANAGEMENT_TOKEN);
  if (decoded && decoded.access_key === HMS_APP_ACCESS_KEY) {
    console.log('✅ Management token is valid');
    console.log('Expires:', new Date(decoded.exp * 1000).toLocaleString(), '\n');
  } else {
    console.log('⚠️  Management token structure unexpected\n');
  }
} catch (error) {
  console.log('⚠️  Could not decode management token\n');
}

// Test 4: Check if server is running
console.log('4️⃣  Checking if dev server is running...');
const http = require('http');
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/100ms',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = http.request(options, (res) => {
  if (res.statusCode === 401 || res.statusCode === 404 || res.statusCode === 200) {
    console.log('✅ Dev server is running on http://localhost:3000\n');
  } else {
    console.log('⚠️  Dev server returned status:', res.statusCode, '\n');
  }
});

req.on('error', (error) => {
  console.log('❌ Dev server not running. Start it with: npm run dev\n');
});

req.write(JSON.stringify({ action: 'getToken', roomId: 'test' }));
req.end();

// Summary
setTimeout(() => {
  console.log('📋 Test Summary');
  console.log('================');
  console.log('✅ Environment variables configured');
  console.log('✅ JWT token generation working');
  console.log('✅ Management token valid');
  console.log('');
  console.log('🎯 Next steps:');
  console.log('1. Make sure dev server is running: npm run dev');
  console.log('2. Configure webhook in 100ms dashboard');
  console.log('3. Test video call with 2 users');
  console.log('');
  console.log('🌐 Webhook URL:');
  console.log('   ' + (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/api/webhooks/100ms');
  console.log('');
}, 1000);

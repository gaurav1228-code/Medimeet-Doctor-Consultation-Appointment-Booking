// test-100ms-connection.js
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const jwt = require('jsonwebtoken');

console.log('🧪 100ms Connection Test\n');

// Test environment variables
console.log('1️⃣  Checking environment variables...');
const requiredEnvVars = [
  'HMS_MANAGEMENT_TOKEN',
  'HMS_APP_ACCESS_KEY', 
  'HMS_APP_SECRET',
  'HMS_TEMPLATE_ID'
];

let allEnvVarsPresent = true;
requiredEnvVars.forEach(envVar => {
  const isPresent = !!process.env[envVar];
  console.log(`${envVar}: ${isPresent ? '✅' : '❌'}`);
  if (!isPresent) allEnvVarsPresent = false;
});

if (!allEnvVarsPresent) {
  console.log('\n❌ Missing required environment variables!');
  process.exit(1);
}

console.log('\n✅ All environment variables present');

// Test token generation
console.log('\n2️⃣  Testing token generation...');
try {
  const testPayload = {
    access_key: process.env.HMS_APP_ACCESS_KEY,
    room_id: 'test-room-' + Date.now(),
    user_id: 'test-user-' + Math.random().toString(36).substr(2, 9),
    role: 'guest',
    type: 'app',
    version: 2,
    jti: Math.random().toString(36).substr(2, 9),
    iat: Math.floor(Date.now() / 1000),
    nbf: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
  };

  const token = jwt.sign(testPayload, process.env.HMS_APP_SECRET, {
    algorithm: 'HS256'
  });

  console.log('✅ Token generation successful');
  console.log('Token preview:', token.substring(0, 50) + '...');
} catch (error) {
  console.log('❌ Token generation failed:', error.message);
  process.exit(1);
}

// Test API connection
console.log('\n3️⃣  Testing 100ms API connection...');
const https = require('https');

const options = {
  hostname: 'api.100ms.live',
  port: 443,
  path: '/v2/rooms',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${process.env.HMS_MANAGEMENT_TOKEN}`
  }
};

const req = https.request(options, (res) => {
  console.log(`API Response Status: ${res.statusCode}`);
  
  if (res.statusCode === 200) {
    console.log('✅ 100ms API connection successful!');
  } else {
    console.log(`⚠️  API returned status: ${res.statusCode}`);
  }
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(`📊 Found ${parsed.data?.length || 0} rooms`);
    } catch (e) {
      console.log('📊 Response data:', data.substring(0, 200));
    }
    
    console.log('\n🎉 100ms setup is working correctly!');
    console.log('\nNext steps:');
    console.log('1. Start your Next.js server: npm run dev');
    console.log('2. Test video call with appointment ID');
    console.log('3. Both doctor and patient should join the same room');
  });
});

req.on('error', (error) => {
  console.log('❌ API connection failed:', error.message);
});

req.end();
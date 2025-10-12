// test-100ms-complete.js - COMPLETE VERIFICATION
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const jwt = require('jsonwebtoken');

console.log('🧪 COMPLETE 100ms Verification Test\n');

// Test 1: Environment Variables
console.log('1️⃣  Environment Variables Check');
const requiredEnvVars = [
  'HMS_MANAGEMENT_TOKEN',
  'HMS_APP_ACCESS_KEY', 
  'HMS_APP_SECRET',
  'HMS_TEMPLATE_ID'
];

let allEnvVarsPresent = true;
requiredEnvVars.forEach(envVar => {
  const isPresent = !!process.env[envVar];
  console.log(`   ${envVar}: ${isPresent ? '✅' : '❌'}`);
  if (!isPresent) allEnvVarsPresent = false;
});

if (!allEnvVarsPresent) {
  console.log('\n❌ Missing environment variables!');
  process.exit(1);
}
console.log('✅ All environment variables present\n');

// Test 2: Token Generation
console.log('2️⃣  Token Generation Test');
try {
  const testRoomId = `test-room-${Date.now()}`;
  const testPayload = {
    access_key: process.env.HMS_APP_ACCESS_KEY,
    room_id: testRoomId,
    user_id: 'test-user-' + Math.random().toString(36).substr(2, 9),
    role: 'host',
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

  console.log('   ✅ Token generation successful');
  console.log(`   Room ID in token: ${testRoomId}`);
  console.log(`   Token preview: ${token.substring(0, 50)}...\n`);
} catch (error) {
  console.log('   ❌ Token generation failed:', error.message);
  process.exit(1);
}

// Test 3: API Connection
console.log('3️⃣  API Connection Test');
const https = require('https');

const testApiConnection = () => {
  return new Promise((resolve, reject) => {
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
      console.log(`   API Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            console.log(`   ✅ Found ${parsed.data?.length || 0} rooms`);
            resolve(true);
          } catch (e) {
            console.log('   ✅ API connection successful (non-JSON response)');
            resolve(true);
          }
        } else {
          console.log(`   ⚠️ API returned status: ${res.statusCode}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log('   ❌ API connection failed:', error.message);
      resolve(false);
    });

    req.end();
  });
};

// Test 4: Room Creation
console.log('4️⃣  Room Creation Test');
const testRoomCreation = () => {
  return new Promise((resolve, reject) => {
    const testRoomId = `verify-room-${Date.now()}`;
    const roomData = JSON.stringify({
      name: "Verification Test Room",
      description: "Test room for verification",
      template_id: process.env.HMS_TEMPLATE_ID,
      region: 'in'
    });

    const options = {
      hostname: 'api.100ms.live',
      port: 443,
      path: '/v2/rooms',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HMS_MANAGEMENT_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(roomData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('   ✅ Room creation successful');
          try {
            const room = JSON.parse(data);
            console.log(`   Created room ID: ${room.id}`);
          } catch (e) {
            console.log('   Room created (response parsing failed)');
          }
          resolve(true);
        } else {
          console.log(`   ❌ Room creation failed: ${res.statusCode}`);
          console.log(`   Response: ${data}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log('   ❌ Room creation request failed:', error.message);
      resolve(false);
    });

    req.write(roomData);
    req.end();
  });
};

// Run all tests
async function runAllTests() {
  const apiResult = await testApiConnection();
  const roomResult = await testRoomCreation();
  
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`Environment Variables: ✅`);
  console.log(`Token Generation: ✅`);
  console.log(`API Connection: ${apiResult ? '✅' : '❌'}`);
  console.log(`Room Creation: ${roomResult ? '✅' : '❌'}`);
  
  if (apiResult && roomResult) {
    console.log('\n🎉 ALL TESTS PASSED! Your 100ms setup is working correctly.');
    console.log('\n🚀 Next steps:');
    console.log('1. Start your Next.js server: npm run dev');
    console.log('2. Visit: http://localhost:3000/api/100ms/test');
    console.log('3. Create an appointment and test video call');
    console.log('4. Both doctor and patient should join successfully');
  } else {
    console.log('\n❌ Some tests failed. Please check your 100ms configuration.');
    console.log('   - Verify your Management Token is valid');
    console.log('   - Check your Template ID is correct');
    console.log('   - Ensure your App Access Key and Secret are correct');
  }
}

runAllTests();
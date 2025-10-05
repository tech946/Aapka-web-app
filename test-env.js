// Test environment variables
// Run with: node test-env.js

require('dotenv').config();

console.log('🔍 Checking environment variables...\n');

const requiredVars = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

let allPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
    allPresent = false;
  }
});

console.log('\n📋 Environment Summary:');
console.log(
  `- Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}`
);
console.log(
  `- Service Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET'}`
);

if (allPresent) {
  console.log('\n🎉 All environment variables are present!');
} else {
  console.log('\n⚠️  Some environment variables are missing!');
  console.log('\n📝 Make sure your .env.local file contains:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
}

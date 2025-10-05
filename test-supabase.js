// Test Supabase connection
// Run with: node test-supabase.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase connection...\n');

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Missing environment variables!');
  console.log('Make sure .env.local contains:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_url');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testConnection() {
  try {
    console.log('📡 Testing database connection...');

    // Test a simple query
    const { data, error } = await supabase
      .from('countries')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Database connection failed:');
      console.log('   Error:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
      return;
    }

    console.log('✅ Database connection successful!');
    console.log('📊 Sample data:', data);

    // Test storage connection
    console.log('\n📁 Testing storage connection...');
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.log('❌ Storage connection failed:');
      console.log('   Error:', bucketsError.message);
      return;
    }

    console.log('✅ Storage connection successful!');
    console.log('📦 Available buckets:', buckets?.map(b => b.name) || []);
  } catch (error) {
    console.log('❌ Connection test failed:');
    console.log('   Error:', error.message);
  }
}

testConnection();

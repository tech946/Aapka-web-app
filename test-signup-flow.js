// Test script to debug Supabase signup flow
// Run with: node test-signup-flow.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://ghsgnjzkgygiqmhjvtpi.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdoc2duanprZ3lnaXFtaGp2dHBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMjE2OTksImV4cCI6MjA2NTY5NzY5OX0.IFqbyxmYzCDZZEZpV0MIpPQWVxBplygWlnap1q97hcg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignup() {
  console.log('🧪 Testing Supabase Signup Flow...\n');

  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'testpassword123';

  console.log(`📧 Test email: ${testEmail}`);
  console.log(`🔑 Test password: ${testPassword}\n`);

  try {
    console.log('1️⃣ Attempting signup...');
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: 'http://localhost:3000/signup-callback',
      },
    });

    if (error) {
      console.error('❌ Signup error:', error);
      return;
    }

    console.log('✅ Signup response received');
    console.log('👤 User data:', {
      id: data.user?.id,
      email: data.user?.email,
      email_confirmed_at: data.user?.email_confirmed_at,
      created_at: data.user?.created_at,
    });

    console.log('🔐 Session data:', {
      hasSession: !!data.session,
      sessionUser: data.session?.user?.id,
    });

    if (data.user && !data.session) {
      console.log('\n📬 Email confirmation required');
      console.log('🔍 Check your email for confirmation link');
      console.log('📧 User should receive email at:', testEmail);
    } else if (data.user && data.session) {
      console.log('\n✅ User auto-confirmed (no email confirmation needed)');
    }

    // Test resend functionality
    console.log('\n2️⃣ Testing resend confirmation...');
    const { data: resendData, error: resendError } = await supabase.auth.resend(
      {
        type: 'signup',
        email: testEmail,
        options: {
          emailRedirectTo: 'http://localhost:3000/signup-callback',
        },
      }
    );

    if (resendError) {
      console.error('❌ Resend error:', resendError);
    } else {
      console.log('✅ Resend confirmation sent');
    }
  } catch (err) {
    console.error('💥 Unexpected error:', err);
  }
}

// Run the test
testSignup().then(() => {
  console.log('\n🏁 Test completed');
  console.log('\n📋 Next steps:');
  console.log('1. Check your Supabase dashboard for the user');
  console.log('2. Check your email for confirmation link');
  console.log('3. Verify email confirmation settings in Supabase');
  console.log('4. Check Supabase Auth logs for any issues');
});

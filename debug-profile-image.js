/**
 * Debug script for profile image upload API
 * This will help identify the specific 500 error
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

console.log('🔍 Debug Environment Variables:');
console.log('SUPABASE_URL:', SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log(
  'SUPABASE_SERVICE_KEY:',
  SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing'
);
console.log('API_BASE_URL:', API_BASE_URL);
console.log('');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugProfileImageUpload() {
  try {
    console.log('🚀 Starting Profile Image Upload Debug...\n');

    // Step 1: Test authentication
    console.log('1️⃣ Testing authentication...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp(
      {
        email: 'debug@example.com',
        password: 'debugpassword123',
      }
    );

    if (signupError) {
      console.error('❌ Signup error:', signupError.message);
      return;
    }

    const accessToken = signupData.session?.access_token;
    if (!accessToken) {
      console.log(
        '⚠️  No access token received. User might need email confirmation.'
      );
      return;
    }

    console.log('✅ Authentication successful');

    // Step 2: Test bucket access
    console.log('\n2️⃣ Testing bucket access...');
    const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: buckets, error: bucketError } =
      await adminSupabase.storage.listBuckets();
    if (bucketError) {
      console.error('❌ Error accessing buckets:', bucketError);
    } else {
      console.log('✅ Buckets accessible');
      const profileImagesBucket = buckets.find(
        b => b.name === 'profile-images'
      );
      if (profileImagesBucket) {
        console.log('✅ profile-images bucket exists');
      } else {
        console.log('❌ profile-images bucket not found');
        console.log(
          'Available buckets:',
          buckets.map(b => b.name)
        );
      }
    }

    // Step 3: Test profile table access
    console.log('\n3️⃣ Testing profile table access...');
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', signupData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Error accessing profile:', profileError);
    } else {
      console.log('✅ Profile table accessible');
      console.log('Profile data:', profile);
    }

    // Step 4: Test image upload with detailed error logging
    console.log('\n4️⃣ Testing image upload...');

    // Create a test image
    const testImagePath = path.join(__dirname, 'debug-test-image.jpg');
    if (!fs.existsSync(testImagePath)) {
      console.log('📝 Creating test image...');
      const jpegData = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
        0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
        0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
        0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
        0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
        0xff, 0xc4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xff, 0xc4,
        0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xda, 0x00, 0x0c, 0x03,
        0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3f, 0x00, 0x80, 0xff, 0xd9,
      ]);
      fs.writeFileSync(testImagePath, jpegData);
    }

    const formData = new FormData();
    const imageBuffer = fs.readFileSync(testImagePath);
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('image', blob, 'debug-test-image.jpg');

    console.log('📤 Uploading image...');
    const uploadResponse = await fetch(
      `${API_BASE_URL}/api/mobile/update-profile-image`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      }
    );

    console.log('📊 Response status:', uploadResponse.status);
    console.log(
      '📊 Response headers:',
      Object.fromEntries(uploadResponse.headers.entries())
    );

    const uploadData = await uploadResponse.json();
    console.log('📊 Response data:', JSON.stringify(uploadData, null, 2));

    if (uploadData.success) {
      console.log('✅ Image upload successful');
    } else {
      console.log('❌ Image upload failed:', uploadData.error);
      if (uploadData.details) {
        console.log('📋 Error details:', uploadData.details);
      }
    }

    // Cleanup
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  } catch (error) {
    console.error('❌ Debug error:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the debug
debugProfileImageUpload();

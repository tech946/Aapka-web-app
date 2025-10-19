/**
 * Test script for Mobile Profile Management APIs
 * This script tests the profile update and image upload functionality
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test user credentials
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword123';

async function testProfileAPIs() {
  try {
    console.log('🚀 Starting Mobile Profile APIs Test...\n');

    // Step 1: Sign up a test user
    console.log('1️⃣ Creating test user...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp(
      {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }
    );

    if (signupError) {
      console.error('❌ Signup error:', signupError.message);
      return;
    }

    console.log('✅ Test user created successfully');
    const accessToken = signupData.session?.access_token;

    if (!accessToken) {
      console.log(
        '⚠️  No access token received. User might need email confirmation.'
      );
      return;
    }

    // Step 2: Test GET user details
    console.log('\n2️⃣ Testing GET user details...');
    const getUserDetailsResponse = await fetch(
      `${API_BASE_URL}/api/mobile/user-details`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const getUserDetailsData = await getUserDetailsResponse.json();
    console.log(
      'GET User Details Response:',
      JSON.stringify(getUserDetailsData, null, 2)
    );

    if (getUserDetailsData.success) {
      console.log('✅ GET user details successful');
    } else {
      console.log('❌ GET user details failed:', getUserDetailsData.error);
    }

    // Step 2.5: Test GET profile
    console.log('\n2.5️⃣ Testing GET profile...');
    const getProfileResponse = await fetch(
      `${API_BASE_URL}/api/mobile/update-profile`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const getProfileData = await getProfileResponse.json();
    console.log(
      'GET Profile Response:',
      JSON.stringify(getProfileData, null, 2)
    );

    if (getProfileData.success) {
      console.log('✅ GET profile successful');
    } else {
      console.log('❌ GET profile failed:', getProfileData.error);
    }

    // Step 3: Test PUT profile update
    console.log('\n3️⃣ Testing PUT profile update...');
    const updateProfileResponse = await fetch(
      `${API_BASE_URL}/api/mobile/update-profile`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: 'Test User',
          profile_image_url: 'https://example.com/test-image.jpg',
        }),
      }
    );

    const updateProfileData = await updateProfileResponse.json();
    console.log(
      'PUT Profile Response:',
      JSON.stringify(updateProfileData, null, 2)
    );

    if (updateProfileData.success) {
      console.log('✅ PUT profile update successful');
    } else {
      console.log('❌ PUT profile update failed:', updateProfileData.error);
    }

    // Test with empty profile_image_url
    console.log('\n3.5️⃣ Testing PUT profile update with empty image URL...');
    const updateProfileEmptyResponse = await fetch(
      `${API_BASE_URL}/api/mobile/update-profile`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: 'Test User Updated',
          profile_image_url: '',
        }),
      }
    );

    const updateProfileEmptyData = await updateProfileEmptyResponse.json();
    console.log(
      'PUT Profile Empty Response:',
      JSON.stringify(updateProfileEmptyData, null, 2)
    );

    if (updateProfileEmptyData.success) {
      console.log('✅ PUT profile update with empty image URL successful');
    } else {
      console.log(
        '❌ PUT profile update with empty image URL failed:',
        updateProfileEmptyData.error
      );
    }

    // Test validation - missing full_name
    console.log('\n3.6️⃣ Testing validation - missing full_name...');
    const updateProfileInvalidResponse = await fetch(
      `${API_BASE_URL}/api/mobile/update-profile`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile_image_url: 'https://example.com/test-image.jpg',
        }),
      }
    );

    const updateProfileInvalidData = await updateProfileInvalidResponse.json();
    console.log(
      'PUT Profile Invalid Response:',
      JSON.stringify(updateProfileInvalidData, null, 2)
    );

    if (
      updateProfileInvalidData.error &&
      updateProfileInvalidData.error.includes('full_name is required')
    ) {
      console.log('✅ Validation working correctly - full_name is required');
    } else {
      console.log('❌ Validation failed - should have required full_name');
    }

    // Test user metadata update
    console.log('\n3.7️⃣ Testing user metadata update...');
    const updateMetadataResponse = await fetch(
      `${API_BASE_URL}/api/mobile/user-details`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_metadata: {
            preferences: {
              theme: 'dark',
              notifications: true,
            },
            last_updated: new Date().toISOString(),
          },
        }),
      }
    );

    const updateMetadataData = await updateMetadataResponse.json();
    console.log(
      'Update Metadata Response:',
      JSON.stringify(updateMetadataData, null, 2)
    );

    if (updateMetadataData.success) {
      console.log('✅ User metadata update successful');
    } else {
      console.log('❌ User metadata update failed:', updateMetadataData.error);
    }

    // Test bank details update
    console.log('\n3.8️⃣ Testing bank details update...');
    const updateBankDetailsResponse = await fetch(
      `${API_BASE_URL}/api/mobile/update-bank-details`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bank_name: 'State Bank of India',
          account_number: '1234567890123456',
          confirm_account_number: '1234567890123456',
          ifsc_code: 'SBIN0001234',
        }),
      }
    );

    const updateBankDetailsData = await updateBankDetailsResponse.json();
    console.log(
      'Update Bank Details Response:',
      JSON.stringify(updateBankDetailsData, null, 2)
    );

    if (updateBankDetailsData.success) {
      console.log('✅ Bank details update successful');
    } else {
      console.log(
        '❌ Bank details update failed:',
        updateBankDetailsData.error
      );
    }

    // Test get bank details
    console.log('\n3.9️⃣ Testing get bank details...');
    const getBankDetailsResponse = await fetch(
      `${API_BASE_URL}/api/mobile/update-bank-details`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const getBankDetailsData = await getBankDetailsResponse.json();
    console.log(
      'Get Bank Details Response:',
      JSON.stringify(getBankDetailsData, null, 2)
    );

    if (getBankDetailsData.success) {
      console.log('✅ Get bank details successful');
    } else {
      console.log('❌ Get bank details failed:', getBankDetailsData.error);
    }

    // Step 4: Test image upload (if we have a test image)
    console.log('\n4️⃣ Testing image upload...');
    const testImagePath = path.join(__dirname, 'test-image.jpg');

    if (fs.existsSync(testImagePath)) {
      const formData = new FormData();
      const imageBuffer = fs.readFileSync(testImagePath);
      const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
      formData.append('image', blob, 'test-image.jpg');

      const uploadImageResponse = await fetch(
        `${API_BASE_URL}/api/mobile/update-profile-image`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      const uploadImageData = await uploadImageResponse.json();
      console.log(
        'Upload Image Response:',
        JSON.stringify(uploadImageData, null, 2)
      );

      if (uploadImageData.success) {
        console.log('✅ Image upload successful');
        console.log('📸 Image URL:', uploadImageData.image_url);
      } else {
        console.log('❌ Image upload failed:', uploadImageData.error);
      }
    } else {
      console.log(
        '⚠️  No test image found at test-image.jpg, skipping image upload test'
      );
    }

    // Step 5: Test final profile retrieval
    console.log('\n5️⃣ Testing final profile retrieval...');
    const finalProfileResponse = await fetch(
      `${API_BASE_URL}/api/mobile/update-profile`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const finalProfileData = await finalProfileResponse.json();
    console.log('Final Profile:', JSON.stringify(finalProfileData, null, 2));

    if (finalProfileData.success) {
      console.log('✅ Final profile retrieval successful');
    } else {
      console.log('❌ Final profile retrieval failed:', finalProfileData.error);
    }

    console.log('\n🎉 Mobile Profile APIs test completed!');
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Helper function to create a test image
function createTestImage() {
  const testImagePath = path.join(__dirname, 'test-image.jpg');

  if (!fs.existsSync(testImagePath)) {
    console.log('📝 Creating test image...');
    // Create a simple 1x1 pixel JPEG image
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
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xda, 0x00, 0x0c,
      0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3f, 0x00, 0x80, 0xff,
      0xd9,
    ]);

    fs.writeFileSync(testImagePath, jpegData);
    console.log('✅ Test image created at test-image.jpg');
  }
}

// Run the test
console.log('🔧 Setting up test environment...');
createTestImage();
testProfileAPIs();

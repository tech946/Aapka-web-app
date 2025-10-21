/**
 * Test script to debug developer image upload functionality
 * This script will help identify why developer images are not saving
 */

const { createClient } = require('@supabase/supabase-js');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDeveloperImageUpload() {
  console.log('🔍 Testing Developer Image Upload Functionality\n');

  // Step 1: Check if developer-images bucket exists
  console.log('1️⃣ Checking developer-images bucket...');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('❌ Error listing buckets:', error.message);
      return;
    }

    const developerBucket = buckets.find(b => b.name === 'developer-images');

    if (developerBucket) {
      console.log('✅ developer-images bucket exists');
      console.log(`   Public: ${developerBucket.public}`);
      console.log(`   Created: ${developerBucket.created_at}`);
    } else {
      console.error('❌ developer-images bucket does NOT exist');
      console.log('   Creating bucket...');

      const { data, error: createError } = await supabase.storage.createBucket(
        'developer-images',
        {
          public: true,
          allowedMimeTypes: [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
          ],
          fileSizeLimit: 5242880, // 5MB
        }
      );

      if (createError) {
        console.error('❌ Error creating bucket:', createError.message);
        return;
      }

      console.log('✅ developer-images bucket created successfully');
    }
  } catch (err) {
    console.error('❌ Error checking bucket:', err.message);
    return;
  }

  // Step 2: Test direct storage upload
  console.log('\n2️⃣ Testing direct storage upload...');
  try {
    // Create a test image file (1x1 pixel PNG)
    const testImageData = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    const fileName = `test-${Date.now()}.png`;
    const filePath = `developer-images/${fileName}`;

    console.log(`   Uploading test file: ${fileName}`);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('developer-images')
      .upload(filePath, testImageData, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError.message);
      console.error('   Error details:', uploadError);
      return;
    }

    console.log('✅ Direct upload successful');
    console.log(`   Path: ${uploadData.path}`);

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('developer-images').getPublicUrl(filePath);

    console.log(`   Public URL: ${publicUrl}`);

    // Test if URL is accessible
    try {
      const response = await fetch(publicUrl);
      if (response.ok) {
        console.log('✅ Public URL is accessible');
      } else {
        console.log(`⚠️  Public URL returned status: ${response.status}`);
      }
    } catch (fetchError) {
      console.log(`⚠️  Could not fetch public URL: ${fetchError.message}`);
    }

    // Clean up test file
    await supabase.storage.from('developer-images').remove([filePath]);
    console.log('   Test file cleaned up');
  } catch (err) {
    console.error('❌ Error testing direct upload:', err.message);
  }

  // Step 3: Test API endpoint
  console.log('\n3️⃣ Testing API endpoint...');
  try {
    // Create test form data
    const formData = new FormData();
    formData.append('name', 'Test Developer');
    formData.append('description', 'Test developer for image upload');
    formData.append('is_active', 'true');

    // Create a test image file
    const testImageData = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    // Create a temporary file
    const tempFilePath = path.join(__dirname, 'temp-test-image.png');
    fs.writeFileSync(tempFilePath, testImageData);

    formData.append('image_file', fs.createReadStream(tempFilePath), {
      filename: 'test-image.png',
      contentType: 'image/png',
    });

    console.log('   Sending POST request to /api/developers...');

    const response = await fetch('http://localhost:3000/api/developers', {
      method: 'POST',
      body: formData,
      headers: {
        ...formData.getHeaders(),
      },
    });

    const responseData = await response.json();

    if (response.ok) {
      console.log('✅ API request successful');
      console.log('   Response data:', JSON.stringify(responseData, null, 2));

      if (responseData.image_url) {
        console.log(`✅ Image URL returned: ${responseData.image_url}`);

        // Test if the returned URL is accessible
        try {
          const imageResponse = await fetch(responseData.image_url);
          if (imageResponse.ok) {
            console.log('✅ Returned image URL is accessible');
          } else {
            console.log(
              `⚠️  Returned image URL returned status: ${imageResponse.status}`
            );
          }
        } catch (fetchError) {
          console.log(
            `⚠️  Could not fetch returned image URL: ${fetchError.message}`
          );
        }
      } else {
        console.log('❌ No image_url in response - this is the problem!');
      }
    } else {
      console.error('❌ API request failed');
      console.error('   Status:', response.status);
      console.error('   Response:', responseData);
    }

    // Clean up temp file
    fs.unlinkSync(tempFilePath);
  } catch (err) {
    console.error('❌ Error testing API endpoint:', err.message);
  }

  // Step 4: Check existing developers
  console.log('\n4️⃣ Checking existing developers...');
  try {
    const { data: developers, error } = await supabase
      .from('developers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error fetching developers:', error.message);
    } else {
      console.log(`✅ Found ${developers.length} developers`);
      developers.forEach((dev, index) => {
        console.log(`   ${index + 1}. ${dev.name}`);
        console.log(`      Image URL: ${dev.image_url || 'NULL'}`);
        console.log(`      Created: ${dev.created_at}`);
        console.log('');
      });
    }
  } catch (err) {
    console.error('❌ Error checking developers:', err.message);
  }

  console.log('✨ Test complete!');
}

// Run the test
testDeveloperImageUpload().catch(console.error);

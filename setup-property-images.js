// Setup script for property images feature
// This script helps verify your setup is correct

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error(
    'Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSetup() {
  console.log('🔍 Checking Property Images Setup...\n');

  // Check 1: Database column
  console.log('1️⃣ Checking database column...');
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('property_images')
      .limit(1);

    if (error) {
      console.error('❌ Database check failed:', error.message);
      console.log(
        '   Please run the SQL migration: database/properties_add_images_column.sql\n'
      );
    } else {
      console.log('✅ Database column exists\n');
    }
  } catch (err) {
    console.error('❌ Error checking database:', err.message, '\n');
  }

  // Check 2: Storage bucket
  console.log('2️⃣ Checking storage bucket...');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('❌ Could not list buckets:', error.message, '\n');
    } else {
      const propertiesBucket = buckets.find(b => b.name === 'properties');

      if (propertiesBucket) {
        console.log('✅ "properties" bucket exists');
        console.log(`   Public: ${propertiesBucket.public}`);

        if (!propertiesBucket.public) {
          console.log(
            '   ⚠️  Warning: Bucket should be public for images to display\n'
          );
        } else {
          console.log('');
        }
      } else {
        console.error('❌ "properties" bucket does NOT exist');
        console.log('   Please create it in Supabase Dashboard:');
        console.log('   1. Go to Storage section');
        console.log('   2. Click "New bucket"');
        console.log('   3. Name: properties');
        console.log('   4. Public: YES');
        console.log('   5. Click "Create bucket"\n');
      }
    }
  } catch (err) {
    console.error('❌ Error checking storage:', err.message, '\n');
  }

  // Check 3: Test upload (optional)
  console.log('3️⃣ Testing storage upload...');
  try {
    const testFile = Buffer.from('test-image-data');
    const testFileName = `test-${Date.now()}.txt`;

    const { data, error } = await supabase.storage
      .from('properties')
      .upload(`test/${testFileName}`, testFile);

    if (error) {
      console.error('❌ Upload test failed:', error.message);
      console.log('   Please check bucket permissions\n');
    } else {
      console.log('✅ Upload test successful');

      // Clean up test file
      await supabase.storage
        .from('properties')
        .remove([`test/${testFileName}`]);
      console.log('   Test file cleaned up\n');
    }
  } catch (err) {
    console.error('❌ Error testing upload:', err.message, '\n');
  }

  console.log('✨ Setup check complete!\n');
  console.log(
    "If all checks passed, you're ready to use the property images feature."
  );
  console.log('If any checks failed, please follow the instructions above.\n');
}

checkSetup().catch(console.error);

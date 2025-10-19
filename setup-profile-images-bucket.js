/**
 * Setup script to create the profile-images bucket in Supabase Storage
 * Run this script to set up the storage bucket for profile images
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupProfileImagesBucket() {
  try {
    console.log('🚀 Setting up profile-images bucket...');

    // Check if bucket already exists
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }

    const bucketExists = buckets.some(
      bucket => bucket.name === 'profile-images'
    );

    if (bucketExists) {
      console.log('✅ profile-images bucket already exists');
    } else {
      // Create the bucket
      const { data, error } = await supabase.storage.createBucket(
        'profile-images',
        {
          public: true, // Make bucket public so images can be accessed via URL
          allowedMimeTypes: [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
          ],
          fileSizeLimit: 5242880, // 5MB limit
        }
      );

      if (error) {
        console.error('❌ Error creating bucket:', error);
        return;
      }

      console.log('✅ profile-images bucket created successfully');
    }

    // Set up RLS policies for the bucket
    console.log('🔐 Setting up RLS policies...');

    // Policy to allow authenticated users to upload their own profile images
    const { error: uploadPolicyError } = await supabase.rpc(
      'create_storage_policy',
      {
        policy_name: 'Users can upload their own profile images',
        bucket_name: 'profile-images',
        policy_definition: 'auth.uid()::text = (storage.foldername(name))[1]',
      }
    );

    if (uploadPolicyError) {
      console.log('⚠️  Upload policy might already exist or need manual setup');
    } else {
      console.log('✅ Upload policy created');
    }

    // Policy to allow public read access to profile images
    const { error: readPolicyError } = await supabase.rpc(
      'create_storage_policy',
      {
        policy_name: 'Public can view profile images',
        bucket_name: 'profile-images',
        policy_definition: 'true',
      }
    );

    if (readPolicyError) {
      console.log('⚠️  Read policy might already exist or need manual setup');
    } else {
      console.log('✅ Read policy created');
    }

    // Policy to allow users to delete their own profile images
    const { error: deletePolicyError } = await supabase.rpc(
      'create_storage_policy',
      {
        policy_name: 'Users can delete their own profile images',
        bucket_name: 'profile-images',
        policy_definition: 'auth.uid()::text = (storage.foldername(name))[1]',
      }
    );

    if (deletePolicyError) {
      console.log('⚠️  Delete policy might already exist or need manual setup');
    } else {
      console.log('✅ Delete policy created');
    }

    console.log('🎉 Profile images bucket setup completed!');
    console.log('');
    console.log('📋 Manual RLS Policy Setup (if needed):');
    console.log(
      "If the policies weren't created automatically, set them up manually in Supabase Dashboard:"
    );
    console.log('');
    console.log('1. Go to Storage > profile-images > Policies');
    console.log('2. Create the following policies:');
    console.log('');
    console.log('   Policy 1 - Upload:');
    console.log('   Name: Users can upload their own profile images');
    console.log('   Operation: INSERT');
    console.log('   Target roles: authenticated');
    console.log(
      '   Policy definition: auth.uid()::text = (storage.foldername(name))[1]'
    );
    console.log('');
    console.log('   Policy 2 - Read:');
    console.log('   Name: Public can view profile images');
    console.log('   Operation: SELECT');
    console.log('   Target roles: public');
    console.log('   Policy definition: true');
    console.log('');
    console.log('   Policy 3 - Delete:');
    console.log('   Name: Users can delete their own profile images');
    console.log('   Operation: DELETE');
    console.log('   Target roles: authenticated');
    console.log(
      '   Policy definition: auth.uid()::text = (storage.foldername(name))[1]'
    );
  } catch (error) {
    console.error('❌ Error setting up profile images bucket:', error);
  }
}

// Run the setup
setupProfileImagesBucket();

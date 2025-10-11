// Setup script for mobile home data storage buckets
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupMobileBuckets() {
  console.log('Setting up mobile home data storage buckets...\n');

  try {
    // 1. Create 'videos' bucket for featured videos
    console.log('Creating "videos" bucket...');
    const { data: videosBucket, error: videosError } =
      await supabase.storage.createBucket('videos', {
        public: true,
        fileSizeLimit: 20971520, // 20MB
        allowedMimeTypes: [
          'video/mp4',
          'video/quicktime',
          'video/x-msvideo',
          'video/webm',
        ],
      });

    if (videosError) {
      if (videosError.message.includes('already exists')) {
        console.log('✓ "videos" bucket already exists');
      } else {
        console.error('✗ Error creating videos bucket:', videosError.message);
      }
    } else {
      console.log('✓ "videos" bucket created successfully');
    }

    // 2. Create 'mobile-stories' bucket for story images
    console.log('\nCreating "mobile-stories" bucket...');
    const { data: storiesBucket, error: storiesError } =
      await supabase.storage.createBucket('mobile-stories', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'image/gif',
        ],
      });

    if (storiesError) {
      if (storiesError.message.includes('already exists')) {
        console.log('✓ "mobile-stories" bucket already exists');
      } else {
        console.error(
          '✗ Error creating mobile-stories bucket:',
          storiesError.message
        );
      }
    } else {
      console.log('✓ "mobile-stories" bucket created successfully');
    }

    console.log('\n=================================');
    console.log('Bucket setup completed!');
    console.log('=================================');
    console.log('\nBuckets created:');
    console.log('  1. videos (Max size: 20MB, Types: mp4, mov, avi, webm)');
    console.log(
      '  2. mobile-stories (Max size: 5MB, Types: jpg, png, webp, gif)'
    );
    console.log('\n');
  } catch (error) {
    console.error('Unexpected error during bucket setup:', error);
    process.exit(1);
  }
}

// Run the setup
setupMobileBuckets()
  .then(() => {
    console.log('Setup completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });

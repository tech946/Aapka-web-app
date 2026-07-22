'use client';

// This page is not used anymore since Platform Fee is now a modal
// But keeping it for backward compatibility
export default function PlatformFeePage() {
  return (
    <div className='dashboard-page'>
      <div className='dashboard-header'>
        <h1>Platform Fee</h1>
        <p className='dashboard-subtitle'>
          Click "Platform Fee" in the sidebar to open the platform fee settings.
        </p>
      </div>
    </div>
  );
}

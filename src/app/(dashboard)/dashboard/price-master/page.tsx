'use client';

// This page is not used anymore since Price Master is now a modal
// But keeping it for backward compatibility
export default function PriceMasterPage() {
  return (
    <div className='dashboard-page'>
      <div className='dashboard-header'>
        <h1>Price Master</h1>
        <p className='dashboard-subtitle'>
          Click "Price Master" in the sidebar to open the currency converter.
        </p>
      </div>
    </div>
  );
}


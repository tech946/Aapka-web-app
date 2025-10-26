'use client';

import React from 'react';

export default function BannerSection() {
  return (
    <div className='banner-container'>
      {/* Fixed Logo */}
      <div className='banner-logo'>
        <img src='/proptz logo.png' alt='Proptz Logo' />
      </div>

      {/* Video Background */}
      <div className='banner-video-container'>
        <video autoPlay loop muted playsInline className='banner-video'>
          {/* Add your video source here - replace with actual video URL */}
          <source src='/hero-desktop.mp4' type='video/mp4' />
          {/* Fallback gradient background if video doesn't load */}
          <div className='banner-video-fallback' />
        </video>
        {/* Dark overlay for better text readability */}
        <div className='banner-overlay' />
      </div>

      {/* Content */}
      <div className='banner-content'>
        {/* Main Title - PROPTZ */}
        <h1 className='banner-title'>PROPTZ</h1>

        {/* Subtitles */}
        <div className='banner-subtitle-container'>
          <p className='banner-subtitle'>No 1 Real Estate</p>
          <p className='banner-subtitle'>Referral Program App</p>
        </div>

        {/* Description */}
        <p className='banner-description'>
          You don&apos;t need to be a broker to earn money from real estate –
          you just need Proptz app
        </p>

        {/* Download Buttons */}
        <div className='banner-buttons-container'>
          <button className='banner-button'>
            <img
              src='/images/android.avif'
              alt='Google Play'
              className='banner-button-image'
            />
          </button>

          <button className='banner-button'>
            <img
              src='/images/ios.avif'
              alt='Apple Store'
              className='banner-button-image'
            />
          </button>
        </div>
      </div>
    </div>
  );
}

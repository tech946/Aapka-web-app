'use client';

import { useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { WhatsAppIcon } from '@/components/site/WhatsAppIcon';

export function ShareButtons({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);

  const url = () => `${window.location.origin}${path}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className='bl-share'>
      <a
        className='bl-share__link'
        href={`https://wa.me/?text=${encodeURIComponent(title)}`}
        onClick={(e) => {
          e.currentTarget.href = `https://wa.me/?text=${encodeURIComponent(`${title} ${url()}`)}`;
        }}
        target='_blank'
        rel='noopener noreferrer'
      >
        <WhatsAppIcon className='bl-share__wa' />
        Share
      </a>
      <button type='button' className='bl-share__link' onClick={copy}>
        {copied ? <Check size={15} aria-hidden /> : <Link2 size={15} aria-hidden />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  );
}

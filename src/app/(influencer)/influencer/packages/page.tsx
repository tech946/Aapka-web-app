'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Link2, Copy } from 'lucide-react';

type PackageItem = {
  package_id: string;
  package_name: string;
  thumbnail_image: string | null;
  commission_percent: number;
  referral_code: string | null;
  clicks: number;
};

export default function InfluencerPackagesPage() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await fetch('/api/influencer-portal/packages');
      const json = await res.json();
      if (res.ok && json.data) setPackages(json.data);
    } finally {
      setLoading(false);
    }
  };

  const getLink = async (pkg: PackageItem) => {
    setGenerating(pkg.package_id);
    try {
      const res = await fetch('/api/influencer-portal/referral-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: pkg.package_id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed');
      const url = json.data?.referral_url;
      if (url) {
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
        fetchPackages();
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to get link');
    } finally {
      setGenerating(null);
    }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied');
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='w-8 h-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-semibold tracking-tight'>Packages</h1>
        <p className='text-muted-foreground mt-1'>
          Get your unique referral link for each package. Share with your
          audience to earn commission.
        </p>
      </div>

      {packages.length === 0 ? (
        <div className='rounded-xl border bg-card p-12 text-center card-accent'>
          <p className='text-muted-foreground'>
            No packages with commission available.
          </p>
          <p className='text-sm text-muted-foreground mt-1'>
            Check back later.
          </p>
        </div>
      ) : (
        <div className='grid gap-6 sm:grid-cols-1'>
          {packages.map(pkg => (
            <div
              key={pkg.package_id}
              className='pkg-card flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6 p-5 sm:p-6'
            >
              {pkg.thumbnail_image ? (
                <img
                  src={pkg.thumbnail_image}
                  alt={pkg.package_name}
                  className='pkg-card-thumb shrink-0'
                />
              ) : null}

              <div className='flex-1 min-w-0'>
                <h3 className='pkg-card-title line-clamp-2'>
                  {pkg.package_name}
                </h3>
                <div className='pkg-card-meta'>
                  <span>Commission {pkg.commission_percent}%</span>
                  <span className='pkg-card-meta-dot' aria-hidden />
                  <span>{pkg.clicks} clicks</span>
                </div>
                {pkg.referral_code && (
                  <span className='pkg-card-code'>{pkg.referral_code}</span>
                )}
              </div>
              <div className='flex gap-2 shrink-0'>
                <button
                  onClick={() => getLink(pkg)}
                  disabled={!!generating}
                  className='pkg-card-copy-btn btn-accent disabled:opacity-50'
                >
                  {generating === pkg.package_id ? (
                    <Loader2 className='w-4 h-4 animate-spin' />
                  ) : (
                    <Link2 className='w-4 h-4' />
                  )}
                  {pkg.referral_code ? 'Copy Link' : 'Get Referral Link'}
                </button>
                {pkg.referral_code && (
                  <button
                    onClick={() =>
                      copyLink(
                        `${typeof window !== 'undefined' ? window.location.origin : ''}/ref/${pkg.referral_code}`
                      )
                    }
                    className='pkg-card-copy-icon'
                    title='Copy link'
                  >
                    <Copy className='w-4 h-4' />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

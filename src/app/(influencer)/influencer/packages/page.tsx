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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Packages</h1>
      <p className="text-muted-foreground mb-6">
        Get your unique referral link for each package. Share with your audience to earn commission.
      </p>

      {packages.length === 0 ? (
        <p className="text-muted-foreground">No packages with commission available. Check back later.</p>
      ) : (
        <div className="space-y-4">
          {packages.map(pkg => (
            <div
              key={pkg.package_id}
              className="rounded-lg border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1">
                <h3 className="font-medium">{pkg.package_name}</h3>
                <p className="text-sm text-muted-foreground">
                  Commission: {pkg.commission_percent}% • Clicks: {pkg.clicks}
                </p>
                {pkg.referral_code && (
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    Code: {pkg.referral_code}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => getLink(pkg)}
                  disabled={!!generating}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
                >
                  {generating === pkg.package_id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Link2 className="w-4 h-4" />
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
                    className="p-2 rounded border hover:bg-muted"
                    title="Copy"
                  >
                    <Copy className="w-4 h-4" />
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

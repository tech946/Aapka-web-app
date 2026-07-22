'use client';

import { useEffect, useState } from 'react';
import { Loader2, TrendingUp, MousePointer, Wallet, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

type DashboardData = {
  total_earned: number;
  total_withdrawn: number;
  available_balance: number;
  total_clicks: number;
  total_conversions: number;
  recent_activity: Array<{
    id: string;
    amount: number;
    status: string;
    created_at: string;
  }>;
};

export default function InfluencerDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/influencer-portal/dashboard')
      .then(res => res.json())
      .then(json => {
        if (json.data) setData(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your referral performance at a glance</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Card
          title="Available Balance"
          value={`₹${(data?.available_balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          icon={<Wallet className="w-5 h-5" />}
          highlight
        />
        <Card
          title="Total Earned"
          value={`₹${(data?.total_earned ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <Card
          title="Total Clicks"
          value={String(data?.total_clicks ?? 0)}
          icon={<MousePointer className="w-5 h-5" />}
        />
        <Card
          title="Total Conversions"
          value={String(data?.total_conversions ?? 0)}
          icon={<Sparkles className="w-5 h-5" />}
        />
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden card-accent">
        <div className="px-6 py-4 border-b bg-muted/30">
          <h2 className="font-semibold text-lg">Recent Activity</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Latest conversion updates</p>
        </div>
        <div className="p-6">
          {!data?.recent_activity?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No conversions yet</p>
              <p className="text-sm text-muted-foreground mt-1">Share your referral links to start earning</p>
            </div>
          ) : (
            <ul className="divide-y">
              {data.recent_activity.map(item => (
                <li
                  key={item.id}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#ff4c00]/10 flex items-center justify-center">
                      <span className="font-semibold text-[#ff4c00]">₹</span>
                    </div>
                    <div>
                      <span className="font-semibold">₹{item.amount.toFixed(2)}</span>
                      <span className="text-muted-foreground text-sm ml-2">
                        {format(new Date(item.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                      item.status === 'paid' ? 'badge-paid' :
                      item.status === 'approved' ? 'badge-approved' : 'badge-pending'
                    }`}
                  >
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  icon,
  highlight,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border bg-card p-5 flex items-start gap-4 card-accent transition-all duration-200 hover:shadow-md ${highlight ? 'border-[#ff4c00]/30 bg-gradient-to-br from-[#ff4c00]/5 to-transparent' : ''}`}>
      <div className={`p-2.5 rounded-xl ${highlight ? 'bg-[#ff4c00]/20 text-[#ff4c00]' : 'bg-[#ff4c00]/10 text-[#ff4c00]'}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-xl font-bold mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}

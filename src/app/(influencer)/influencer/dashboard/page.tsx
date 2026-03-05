'use client';

import { useEffect, useState } from 'react';
import { Loader2, TrendingUp, MousePointer, Wallet } from 'lucide-react';
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
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card
          title="Available Balance"
          value={`₹${(data?.available_balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          icon={<Wallet className="w-5 h-5" />}
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
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h2 className="font-medium mb-4">Recent Activity</h2>
        {!data?.recent_activity?.length ? (
          <p className="text-muted-foreground text-sm">No conversions yet</p>
        ) : (
          <ul className="space-y-2">
            {data.recent_activity.map(item => (
              <li
                key={item.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <span className="font-medium">₹{item.amount.toFixed(2)}</span>
                  <span className="text-muted-foreground text-sm ml-2">
                    {format(new Date(item.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    item.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : item.status === 'approved'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
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
  );
}

function Card({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 flex items-center gap-4">
      <div className="p-2 rounded bg-primary/10 text-primary">{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-xl font-semibold">{value}</p>
      </div>
    </div>
  );
}

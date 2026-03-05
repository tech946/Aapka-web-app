'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

type Earning = {
  id: string;
  package_name: string;
  payment_amount: number;
  commission_percent: number;
  commission_amount: number;
  status: string;
  created_at: string;
};

export default function InfluencerEarningsPage() {
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/influencer-portal/earnings')
      .then(res => res.json())
      .then(json => {
        if (json.data) setEarnings(json.data);
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
      <h1 className="text-2xl font-semibold mb-2">Earnings</h1>
      <p className="text-muted-foreground mb-6">
        All your referral conversions and commissions
      </p>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Package</th>
              <th className="text-right p-3 font-medium">Customer Paid</th>
              <th className="text-right p-3 font-medium">Commission</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {earnings.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  No earnings yet. Share your referral links to get started!
                </td>
              </tr>
            ) : (
              earnings.map(row => (
                <tr key={row.id} className="border-t">
                  <td className="p-3">{row.package_name}</td>
                  <td className="p-3 text-right">
                    ₹{row.payment_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right">
                    ₹{row.commission_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}{' '}
                    <span className="text-muted-foreground text-xs">({row.commission_percent}%)</span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        row.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : row.status === 'approved'
                            ? 'bg-blue-100 text-blue-800'
                            : row.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {format(new Date(row.created_at), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

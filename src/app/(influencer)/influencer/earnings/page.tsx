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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Earnings</h1>
        <p className="text-muted-foreground mt-1">
          All your referral conversions and commissions
        </p>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden shadow-sm card-accent">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left p-4 font-medium text-sm">Package</th>
                <th className="text-right p-4 font-medium text-sm">Customer Paid</th>
                <th className="text-right p-4 font-medium text-sm">Commission</th>
                <th className="text-left p-4 font-medium text-sm">Status</th>
                <th className="text-left p-4 font-medium text-sm">Date</th>
              </tr>
            </thead>
            <tbody>
              {earnings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-muted-foreground">No earnings yet</p>
                      <p className="text-sm text-muted-foreground">Share your referral links to get started!</p>
                    </div>
                  </td>
                </tr>
              ) : (
                earnings.map(row => (
                  <tr key={row.id} className="border-t hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-medium">{row.package_name}</td>
                    <td className="p-4 text-right">
                      ₹{row.payment_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-semibold text-[#ff4c00]">₹{row.commission_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      <span className="text-muted-foreground text-xs ml-1">({row.commission_percent}%)</span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                          row.status === 'paid' ? 'badge-paid' :
                          row.status === 'approved' ? 'badge-approved' :
                          row.status === 'rejected' ? 'badge-rejected' : 'badge-pending'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {format(new Date(row.created_at), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

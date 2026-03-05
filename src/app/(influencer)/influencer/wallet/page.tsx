'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Wallet } from 'lucide-react';
import { format } from 'date-fns';

const MIN_WITHDRAWAL = 500;

type WalletData = {
  available_balance: number;
  total_earned: number;
  total_withdrawn: number;
  min_withdrawal: number;
  withdrawals: Array<{
    id: string;
    amount: number;
    status: string;
    payment_method: string;
    requested_at: string;
    processed_at: string | null;
  }>;
};

export default function InfluencerWalletPage() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState<'upi' | 'bank_transfer'>('upi');
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankNumber, setBankNumber] = useState('');
  const [ifsc, setIfsc] = useState('');

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const res = await fetch('/api/influencer-portal/wallet');
      const json = await res.json();
      if (res.ok && json.data) setData(json.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (Number.isNaN(amt) || amt < MIN_WITHDRAWAL) {
      toast.error(`Minimum withdrawal is ₹${MIN_WITHDRAWAL}`);
      return;
    }
    if (amt > (data?.available_balance ?? 0)) {
      toast.error('Insufficient balance');
      return;
    }
    if (method === 'upi' && !upiId.trim()) {
      toast.error('Enter UPI ID');
      return;
    }
    if (method === 'bank_transfer' && (!bankName.trim() || !bankNumber.trim() || !ifsc.trim())) {
      toast.error('Enter all bank details');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/influencer-portal/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          payment_method: method,
          upi_id: method === 'upi' ? upiId.trim() : undefined,
          bank_account_name: method === 'bank_transfer' ? bankName.trim() : undefined,
          bank_account_number: method === 'bank_transfer' ? bankNumber.trim() : undefined,
          ifsc_code: method === 'bank_transfer' ? ifsc.trim() : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed');
      toast.success('Withdrawal request submitted');
      setShowForm(false);
      setAmount('');
      setUpiId('');
      setBankName('');
      setBankNumber('');
      setIfsc('');
      fetchWallet();
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed');
    } finally {
      setSubmitting(false);
    }
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
      <h1 className="text-2xl font-semibold mb-2">Wallet</h1>
      <p className="text-muted-foreground mb-6">
        Request withdrawals to your bank account or UPI
      </p>

      <div className="rounded-lg border bg-card p-6 mb-6 flex items-center gap-4">
        <div className="p-3 rounded-full bg-primary/10 text-primary">
          <Wallet className="w-8 h-8" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Available Balance</p>
          <p className="text-2xl font-bold">
            ₹{(data?.available_balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Min withdrawal: ₹{MIN_WITHDRAWAL}
          </p>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => setShowForm(!showForm)}
            disabled={(data?.available_balance ?? 0) < MIN_WITHDRAWAL}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            Request Withdrawal
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-6 mb-6 space-y-4">
          <h3 className="font-medium">Withdrawal Request</h3>
          <div>
            <label className="block text-sm font-medium mb-1">Amount (₹)</label>
            <input
              type="number"
              min={MIN_WITHDRAWAL}
              max={data?.available_balance ?? 0}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full max-w-xs rounded border px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Payment Method</label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value as 'upi' | 'bank_transfer')}
              className="rounded border px-3 py-2"
            >
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>
          {method === 'upi' && (
            <div>
              <label className="block text-sm font-medium mb-1">UPI ID</label>
              <input
                type="text"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                placeholder="yourname@upi"
                className="w-full max-w-xs rounded border px-3 py-2"
              />
            </div>
          )}
          {method === 'bank_transfer' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Account Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  className="w-full max-w-xs rounded border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Account Number</label>
                <input
                  type="text"
                  value={bankNumber}
                  onChange={e => setBankNumber(e.target.value)}
                  className="w-full max-w-xs rounded border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={ifsc}
                  onChange={e => setIfsc(e.target.value)}
                  placeholder="SBIN0001234"
                  className="w-full max-w-xs rounded border px-3 py-2"
                />
              </div>
            </>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded border text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="rounded-lg border overflow-hidden">
        <h3 className="p-3 font-medium bg-muted/50">Withdrawal History</h3>
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr>
              <th className="text-left p-3 font-medium">Amount</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Requested</th>
            </tr>
          </thead>
          <tbody>
            {!data?.withdrawals?.length ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-muted-foreground">
                  No withdrawals yet
                </td>
              </tr>
            ) : (
              data.withdrawals.map(w => (
                <tr key={w.id} className="border-t">
                  <td className="p-3">₹{parseFloat(String(w.amount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        w.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : w.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {w.status}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {format(new Date(w.requested_at), 'MMM d, yyyy')}
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

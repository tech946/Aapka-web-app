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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Wallet</h1>
        <p className="text-muted-foreground mt-1">
          Request withdrawals to your bank account or UPI
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm card-accent flex flex-col sm:flex-row items-start sm:items-center gap-6 border-[#ff4c00]/20 bg-gradient-to-br from-[#ff4c00]/5 to-transparent">
        <div className="p-4 rounded-xl bg-[#ff4c00]/15 text-[#ff4c00]">
          <Wallet className="w-10 h-10" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground">Available Balance</p>
          <p className="text-3xl font-bold mt-1">
            ₹{(data?.available_balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Min withdrawal: ₹{MIN_WITHDRAWAL}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={(data?.available_balance ?? 0) < MIN_WITHDRAWAL}
          className="btn-accent px-6 py-3 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          Request Withdrawal
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-6 shadow-sm card-accent space-y-5">
          <h3 className="font-semibold text-lg">Withdrawal Request</h3>
          <div>
            <label className="block text-sm font-medium mb-2">Amount (₹)</label>
            <input
              type="number"
              min={MIN_WITHDRAWAL}
              max={data?.available_balance ?? 0}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="input-focus w-full max-w-xs rounded-xl border border-input bg-background px-4 py-3 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value as 'upi' | 'bank_transfer')}
              className="input-focus rounded-xl border border-input bg-background px-4 py-3 text-sm max-w-xs"
            >
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>
          {method === 'upi' && (
            <div>
              <label className="block text-sm font-medium mb-2">UPI ID</label>
              <input
                type="text"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                placeholder="yourname@upi"
                className="input-focus w-full max-w-xs rounded-xl border border-input bg-background px-4 py-3 text-sm"
              />
            </div>
          )}
          {method === 'bank_transfer' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Account Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  className="input-focus w-full max-w-xs rounded-xl border border-input bg-background px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Account Number</label>
                <input
                  type="text"
                  value={bankNumber}
                  onChange={e => setBankNumber(e.target.value)}
                  className="input-focus w-full max-w-xs rounded-xl border border-input bg-background px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">IFSC Code</label>
                <input
                  type="text"
                  value={ifsc}
                  onChange={e => setIfsc(e.target.value)}
                  placeholder="SBIN0001234"
                  className="input-focus w-full max-w-xs rounded-xl border border-input bg-background px-4 py-3 text-sm"
                />
              </div>
            </>
          )}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="btn-accent px-6 py-3 rounded-xl text-sm font-medium disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-3 rounded-xl border border-input text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border bg-card overflow-hidden shadow-sm card-accent">
        <div className="px-6 py-4 border-b bg-muted/30">
          <h3 className="font-semibold">Withdrawal History</h3>
        </div>
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr>
              <th className="text-left p-4 font-medium text-sm">Amount</th>
              <th className="text-left p-4 font-medium text-sm">Status</th>
              <th className="text-left p-4 font-medium text-sm">Requested</th>
            </tr>
          </thead>
          <tbody>
            {!data?.withdrawals?.length ? (
              <tr>
                <td colSpan={3} className="p-12 text-center text-muted-foreground">
                  No withdrawals yet
                </td>
              </tr>
            ) : (
              data.withdrawals.map(w => (
                <tr key={w.id} className="border-t hover:bg-muted/20 transition-colors">
                  <td className="p-4 font-medium">₹{parseFloat(String(w.amount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        w.status === 'paid' ? 'badge-paid' :
                        w.status === 'rejected' ? 'badge-rejected' : 'badge-pending'
                      }`}
                    >
                      {w.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
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

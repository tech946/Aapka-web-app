'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function InfluencerProfilePage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankNumber, setBankNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/influencer-portal/profile')
      .then(res => res.json())
      .then(json => {
        if (json.data) {
          setName(json.data.name || '');
          setPhone(json.data.phone || '');
          setBankName(json.data.bank_account_name || '');
          setBankNumber(json.data.bank_account_number || '');
          setIfsc(json.data.ifsc_code || '');
          setUpiId(json.data.upi_id || '');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/influencer-portal/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          bank_account_name: bankName.trim() || null,
          bank_account_number: bankNumber.trim() || null,
          ifsc_code: ifsc.trim() || null,
          upi_id: upiId.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed');
      toast.success('Profile updated');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to update');
    } finally {
      setSaving(false);
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
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Update your details and payment information for withdrawals
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl">
        <div className="rounded-xl border bg-card p-6 shadow-sm card-accent space-y-5">
          <h3 className="font-semibold text-lg">Personal Info</h3>
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input-focus w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="input-focus w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors"
              placeholder="+91 98765 43210"
            />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm card-accent mt-6">
          <h3 className="font-semibold text-lg mb-5">Withdrawal Details</h3>
          <p className="text-sm text-muted-foreground mb-5">Add UPI or bank details to receive payouts</p>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">UPI ID</label>
              <input
                type="text"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                className="input-focus w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors"
                placeholder="yourname@upi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Bank Account Name</label>
              <input
                type="text"
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="input-focus w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors"
                placeholder="Account holder name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Account Number</label>
              <input
                type="text"
                value={bankNumber}
                onChange={e => setBankNumber(e.target.value)}
                className="input-focus w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors"
                placeholder="Bank account number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">IFSC Code</label>
              <input
                type="text"
                value={ifsc}
                onChange={e => setIfsc(e.target.value)}
                className="input-focus w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors"
                placeholder="SBIN0001234"
              />
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="btn-accent mt-6 px-6 py-3 rounded-xl text-sm font-medium disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

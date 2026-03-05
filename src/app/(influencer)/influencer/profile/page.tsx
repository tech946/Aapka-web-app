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
    <div>
      <h1 className="text-2xl font-semibold mb-2">Profile</h1>
      <p className="text-muted-foreground mb-6">
        Update your details and payment information for withdrawals
      </p>

      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded border px-3 py-2"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full rounded border px-3 py-2"
            placeholder="+91 98765 43210"
          />
        </div>
        <div className="pt-4 border-t">
          <h3 className="font-medium mb-3">Withdrawal Details</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">UPI ID</label>
              <input
                type="text"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                className="w-full rounded border px-3 py-2"
                placeholder="yourname@upi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bank Account Name</label>
              <input
                type="text"
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="w-full rounded border px-3 py-2"
                placeholder="Account holder name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Account Number</label>
              <input
                type="text"
                value={bankNumber}
                onChange={e => setBankNumber(e.target.value)}
                className="w-full rounded border px-3 py-2"
                placeholder="Bank account number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">IFSC Code</label>
              <input
                type="text"
                value={ifsc}
                onChange={e => setIfsc(e.target.value)}
                className="w-full rounded border px-3 py-2"
                placeholder="SBIN0001234"
              />
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

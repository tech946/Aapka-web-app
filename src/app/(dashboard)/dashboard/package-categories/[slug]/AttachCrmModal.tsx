'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CRMPackageSelector, type CRMPackageOption } from '@/components/crm/CRMPackageSelector';

interface AttachCrmModalProps {
  packageName: string;
  initialCrmPackageId: string | null;
  onClose: () => void;
  onSave: (selected: CRMPackageOption | null) => Promise<void>;
  saving: boolean;
}

export function AttachCrmModal({
  packageName,
  initialCrmPackageId,
  onClose,
  onSave,
  saving,
}: AttachCrmModalProps) {
  const [selected, setSelected] = useState<CRMPackageOption | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);

  useEffect(() => {
    if (!initialCrmPackageId || initialLoaded) return;
    fetch('/api/website/crm/packages?limit=500')
      .then((r) => r.json())
      .then((d) => {
        if (d.packages && Array.isArray(d.packages)) {
          const match = d.packages.find((p: any) => (p.id ?? p.package_id) === initialCrmPackageId);
          if (match) {
            setSelected({
              id: match.id ?? match.package_id,
              package_id: match.id ?? match.package_id,
              name: match.name ?? match.package_number ?? '',
              package_number: match.package_number ?? null,
              adult_amount: match.adult_amount ?? 0,
              child_amount: match.child_amount ?? 0,
              infant_amount: match.infant_amount ?? 0,
            });
          }
        }
        setInitialLoaded(true);
      })
      .catch(() => setInitialLoaded(true));
  }, [initialCrmPackageId, initialLoaded]);

  const handleSave = () => {
    onSave(selected).catch(() => {});
  };

  return (
    <div className='modal_overlay' onClick={onClose}>
      <div className='modal' onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className='modal_header'>
          <h4>Attach CRM Package</h4>
          <button className='modal_close' onClick={onClose} type='button'>
            <X size={20} />
          </button>
        </div>
        <div className='modal_body'>
          <p style={{ marginBottom: 16, fontSize: 14, color: 'var(--text-muted, #6b7280)' }}>
            Link a CRM package to <strong>{packageName}</strong>. When customers select this package on Customize Your
            Package, the itinerary from the linked CRM package will be shown.
          </p>
          <CRMPackageSelector value={selected} onChange={setSelected} />
        </div>
        <div className='modal_footer'>
          <button type='button' onClick={onClose} className='btn_secondary'>
            Cancel
          </button>
          <button
            type='button'
            className='btn_primary'
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

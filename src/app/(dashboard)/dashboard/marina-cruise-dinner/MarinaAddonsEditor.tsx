'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export type MarinaAddon = {
  id: string;
  name: string;
  adult_price: number | null;
  child_price: number | null;
};

type Props = {
  addons: MarinaAddon[];
  onChange: (addons: MarinaAddon[]) => void;
};

function numericInput(val: string) {
  return val === '' || /^\d*\.?\d*$/.test(val);
}

export default function MarinaAddonsEditor({ addons, onChange }: Props) {
  const [addonName, setAddonName] = useState('');
  const [addonAdult, setAddonAdult] = useState('');
  const [addonChild, setAddonChild] = useState('');

  const addAddon = () => {
    if (!addonName.trim()) {
      toast.error('Add-on name is required');
      return;
    }
    const adult = addonAdult !== '' ? Number(addonAdult) : null;
    const child = addonChild !== '' ? Number(addonChild) : null;
    if (addonAdult !== '' && (Number.isNaN(adult) || adult! < 0)) {
      toast.error('Enter a valid adult price');
      return;
    }
    onChange([
      ...addons,
      {
        id: crypto.randomUUID?.() || String(Date.now()),
        name: addonName.trim(),
        adult_price: adult,
        child_price: child,
      },
    ]);
    setAddonName('');
    setAddonAdult('');
    setAddonChild('');
  };

  const removeAddon = (id: string) => {
    onChange(addons.filter(a => a.id !== id));
  };

  const updateAddon = (id: string, field: keyof MarinaAddon, value: string) => {
    onChange(
      addons.map(a => {
        if (a.id !== id) return a;
        if (field === 'name') return { ...a, name: value };
        const num = value === '' ? null : Number(value);
        return { ...a, [field]: num };
      })
    );
  };

  return (
    <div className='form_row full_width marina_addons_editor'>
      <p className='tour-booking-days-hint'>
        Optional extras customers can choose (e.g. Welcome Drink, Private Table).
        Each add-on has its own adult &amp; child price per person.
      </p>

      {addons.length > 0 && (
        <div className='marina_addons_list'>
          {addons.map((addon, idx) => (
            <div key={addon.id} className='marina_addon_row'>
              <span className='marina_addon_num'>{idx + 1}</span>
              <div className='marina_addon_fields'>
                <div className='marina_addon_field marina_addon_field_name'>
                  <span className='marina_addon_field_label'>Name</span>
                  <input
                    value={addon.name}
                    onChange={e => updateAddon(addon.id, 'name', e.target.value)}
                    placeholder='Add-on name'
                  />
                </div>
                <div className='marina_addon_field marina_addon_field_price'>
                  <span className='marina_addon_field_label'>Adult (AED)</span>
                  <input
                    type='text'
                    inputMode='numeric'
                    value={addon.adult_price ?? ''}
                    onChange={e => {
                      if (numericInput(e.target.value))
                        updateAddon(addon.id, 'adult_price', e.target.value);
                    }}
                    placeholder='0'
                  />
                </div>
                <div className='marina_addon_field marina_addon_field_price'>
                  <span className='marina_addon_field_label'>Child (AED)</span>
                  <input
                    type='text'
                    inputMode='numeric'
                    value={addon.child_price ?? ''}
                    onChange={e => {
                      if (numericInput(e.target.value))
                        updateAddon(addon.id, 'child_price', e.target.value);
                    }}
                    placeholder='0'
                  />
                </div>
              </div>
              <button
                type='button'
                className='marina_addon_remove'
                onClick={() => removeAddon(addon.id)}
                title='Remove add-on'
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className='marina_addon_new_row'>
        <div className='marina_addon_fields'>
          <div className='marina_addon_field marina_addon_field_name'>
            <span className='marina_addon_field_label'>Name</span>
            <input
              value={addonName}
              onChange={e => setAddonName(e.target.value)}
              placeholder='e.g. Welcome Drink'
            />
          </div>
          <div className='marina_addon_field marina_addon_field_price'>
            <span className='marina_addon_field_label'>Adult (AED)</span>
            <input
              type='text'
              inputMode='numeric'
              value={addonAdult}
              onChange={e => {
                if (numericInput(e.target.value)) setAddonAdult(e.target.value);
              }}
              placeholder='0'
            />
          </div>
          <div className='marina_addon_field marina_addon_field_price'>
            <span className='marina_addon_field_label'>Child (AED)</span>
            <input
              type='text'
              inputMode='numeric'
              value={addonChild}
              onChange={e => {
                if (numericInput(e.target.value)) setAddonChild(e.target.value);
              }}
              placeholder='0'
            />
          </div>
        </div>
        <button type='button' className='marina_addon_add_btn' onClick={addAddon}>
          + Add
        </button>
      </div>
    </div>
  );
}

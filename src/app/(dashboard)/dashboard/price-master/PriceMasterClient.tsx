'use client';

import { useState, useEffect, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { ArrowDownUp, X } from 'lucide-react';

interface PriceMaster {
  id: string;
  name: string;
  equivalent: number;
  created_at: string;
  updated_at: string;
}

interface PriceMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PriceMasterModal({ isOpen, onClose }: PriceMasterModalProps) {
  const [inrPrice, setInrPrice] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen) {
      fetchPriceMaster();
    }
  }, [isOpen]);

  const fetchPriceMaster = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/price-master');
      const result = await response.json();

      if (result.data && Array.isArray(result.data)) {
        const inrEntry = result.data.find(
          (item: PriceMaster) => item.name === 'INR'
        );
        if (inrEntry) {
          setInrPrice(String(inrEntry.equivalent));
        } else {
          // If no INR entry exists, set default
          setInrPrice('22.5');
        }
      }
    } catch (error) {
      console.error('Error fetching price master:', error);
      toast.error('Failed to load price master data');
      // Set default value on error
      setInrPrice('22.5');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!inrPrice || Number.isNaN(Number(inrPrice)) || Number(inrPrice) <= 0) {
      toast.error('Please enter a valid INR equivalent (greater than 0)');
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/price-master', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'INR',
            equivalent: Number(inrPrice),
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.error ?? 'Failed to save price master');
        }

        toast.success('Price master updated successfully');
        onClose();
      } catch (error) {
        console.error('Error saving price master:', error);
        toast.error(
          error instanceof Error ? error.message : 'Failed to save price master'
        );
      }
    });
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className='modal_overlay' onClick={onClose}>
      <div
        className='modal price_master_modal'
        onClick={e => e.stopPropagation()}
      >
        <div className='modal_header'>
          <h4>Price Master</h4>
          <button className='modal_close' onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className='modal_body'>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              Loading...
            </div>
          ) : (
            <>
              <p
                style={{
                  color: '#666',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                Set INR conversion rate for 1 AED
              </p>

              <div className='price_converter_container'>
                {/* AED Field - Top */}
                <div className='price_converter_field'>
                  <label className='price_converter_label'>Base Currency</label>
                  <div className='price_converter_input_wrapper'>
                    <div className='price_converter_flag_prefix'>
                      <img
                        src='https://flagcdn.com/w40/ae.png'
                        alt='UAE Flag'
                        className='price_converter_flag_image'
                      />
                    </div>
                    <input
                      type='text'
                      value='1'
                      disabled
                      className='price_converter_input disabled'
                    />
                    <span className='price_converter_currency'>AED</span>
                  </div>
                </div>

                {/* Converter Icon */}
                <div className='price_converter_arrow'>
                  <ArrowDownUp size={24} />
                </div>

                {/* INR Field - Bottom */}
                <div className='price_converter_field'>
                  <label className='price_converter_label'>
                    Equivalent in INR
                  </label>
                  <div className='price_converter_input_wrapper'>
                    <div className='price_converter_flag_prefix'>
                      <img
                        src='https://flagcdn.com/w40/in.png'
                        alt='India Flag'
                        className='price_converter_flag_image'
                      />
                    </div>
                    <input
                      type='number'
                      value={inrPrice}
                      onChange={e => setInrPrice(e.target.value)}
                      placeholder='e.g. 22.5'
                      step='0.01'
                      min='0.01'
                      className='price_converter_input'
                    />
                    <span className='price_converter_currency'>INR</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <div className='modal_footer'>
          <button onClick={onClose} disabled={isPending}>
            Cancel
          </button>
          <button
            className='btn_primary'
            onClick={handleSave}
            disabled={
              isPending || loading || !inrPrice || Number(inrPrice) <= 0
            }
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );

  // Render modal in a portal at document body level to avoid z-index issues
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}

export default function PriceMasterClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        className='btn_primary'
        onClick={() => setIsModalOpen(true)}
        style={{ marginBottom: '20px' }}
      >
        Open Price Master
      </button>
      <PriceMasterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

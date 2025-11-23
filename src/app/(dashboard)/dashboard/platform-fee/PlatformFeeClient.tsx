'use client';

import { useState, useEffect, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { X, Percent } from 'lucide-react';

interface PlatformFee {
  id: string;
  fee_percentage: number;
  created_at: string;
  updated_at: string;
}

interface PlatformFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PlatformFeeModal({ isOpen, onClose }: PlatformFeeModalProps) {
  const [feePercentage, setFeePercentage] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen) {
      fetchPlatformFee();
    }
  }, [isOpen]);

  const fetchPlatformFee = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/platform-fee');
      const result = await response.json();

      if (result.data) {
        setFeePercentage(String(result.data.fee_percentage || 0));
      } else {
        setFeePercentage('0');
      }
    } catch (error) {
      console.error('Error fetching platform fee:', error);
      toast.error('Failed to load platform fee data');
      setFeePercentage('0');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    const feeValue = Number(feePercentage);

    if (Number.isNaN(feeValue) || feeValue < 0 || feeValue > 10) {
      toast.error('Platform fee must be between 0 and 10 percent');
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/platform-fee', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fee_percentage: feeValue,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.error ?? 'Failed to save platform fee');
        }

        toast.success('Platform fee updated successfully');
        onClose();
      } catch (error) {
        console.error('Error saving platform fee:', error);
        toast.error(
          error instanceof Error ? error.message : 'Failed to save platform fee'
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
          <h4>Platform Fee</h4>
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
                Set platform fee percentage (maximum 10%)
              </p>

              <div className='price_converter_container'>
                <div className='price_converter_field'>
                  <label className='price_converter_label'>
                    Platform Fee Percentage
                  </label>
                  <div className='price_converter_input_wrapper'>
                    <input
                      type='number'
                      value={feePercentage}
                      onChange={e => setFeePercentage(e.target.value)}
                      placeholder='e.g. 3.5'
                      step='0.01'
                      min='0'
                      max='10'
                      className='price_converter_input'
                    />
                    <span className='price_converter_currency'>%</span>
                  </div>
                  <p
                    style={{
                      color: '#999',
                      fontSize: '12px',
                      marginTop: '8px',
                    }}
                  >
                    This fee will be added to the transaction amount during
                    checkout
                  </p>
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
              isPending ||
              loading ||
              !feePercentage ||
              Number(feePercentage) < 0 ||
              Number(feePercentage) > 10
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

export default function PlatformFeeClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        className='btn_primary'
        onClick={() => setIsModalOpen(true)}
        style={{ marginBottom: '20px' }}
      >
        Open Platform Fee
      </button>
      <PlatformFeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

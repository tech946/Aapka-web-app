'use client';

type Props = {
  enabled: boolean;
  adultPrice: string;
  childPrice: string;
  onEnabledChange: (enabled: boolean) => void;
  onAdultPriceChange: (value: string) => void;
  onChildPriceChange: (value: string) => void;
};

function numericInput(val: string) {
  return val === '' || /^\d*\.?\d*$/.test(val);
}

export default function MarinaRegistrationPricing({
  enabled,
  adultPrice,
  childPrice,
  onEnabledChange,
  onAdultPriceChange,
  onChildPriceChange,
}: Props) {
  return (
    <div className='marina_registration_block'>
      <label className='marina_registration_checkbox'>
        <input
          type='checkbox'
          checked={enabled}
          onChange={e => onEnabledChange(e.target.checked)}
        />
        Registration Only
      </label>

      {enabled && (
        <div className='marina_registration_prices'>
          <div className='form_row'>
            <label>Registration Adult Price (AED)</label>
            <input
              type='text'
              inputMode='numeric'
              value={adultPrice}
              onChange={e => {
                if (numericInput(e.target.value)) onAdultPriceChange(e.target.value);
              }}
              placeholder='0'
            />
          </div>
          <div className='form_row'>
            <label>Registration Child Price (AED)</label>
            <input
              type='text'
              inputMode='numeric'
              value={childPrice}
              onChange={e => {
                if (numericInput(e.target.value)) onChildPriceChange(e.target.value);
              }}
              placeholder='0'
            />
          </div>
        </div>
      )}
    </div>
  );
}

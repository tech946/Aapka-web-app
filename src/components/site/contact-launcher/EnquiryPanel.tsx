'use client';

import { useState, type FormEvent } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { CONTACT } from '@/components/site/site-config';
import type { PhoneCountryId } from '@/config/phone-countries';
import { Consent, PhoneField, TextField } from './LeadFields';
import { PanelFrame } from './PanelFrame';
import { submitLead, validateLead, type LeadErrors } from './lead';

const PLANNING_OPTIONS = ['Dubai', 'Abu Dhabi', 'Oman', 'Customised', 'Not sure'];

interface EnquiryPanelProps {
  hidden: boolean;
  onMinimize: () => void;
  onClose: () => void;
}

export function EnquiryPanel({ hidden, onMinimize, onClose }: EnquiryPanelProps) {
  const [name, setName] = useState('');
  const [countryId, setCountryId] = useState<PhoneCountryId>('in');
  const [phone, setPhone] = useState('');
  const [planning, setPlanning] = useState('');
  const [errors, setErrors] = useState<LeadErrors>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  const clear = (field: keyof LeadErrors) => setErrors(({ [field]: _, ...rest }) => rest);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validateLead({ name, phone });
    setErrors(found);
    if (Object.keys(found).length) return;

    setStatus('sending');
    try {
      await submitLead({
        name,
        countryId,
        phone,
        message: `Quick enquiry from the website${planning ? ` · Planning for: ${planning}` : ''}`,
      });
      setStatus('sent');
    } catch {
      setStatus('failed');
    }
  };

  const firstName = name.trim().split(/\s+/)[0];
  const whatsappHref = `${CONTACT.whatsappHref}?text=${encodeURIComponent(
    `Hi Aapka Tourism, I'm ${name.trim() || 'interested in a holiday'}${planning ? ` and planning a trip to ${planning}` : ''}.`,
  )}`;

  return (
    <PanelFrame title='Quick Enquiry' hidden={hidden} onMinimize={onMinimize} onClose={onClose}>
      {status === 'sent' ? (
        <div className='cl-success'>
          <CheckCircle2 size={44} aria-hidden />
          <h3>Thank you{firstName ? `, ${firstName}` : ''}!</h3>
          <p>A travel expert will call you shortly. Want to talk now? Message us on WhatsApp.</p>
          <div className='cl-success__actions'>
            <a href={whatsappHref} target='_blank' rel='noopener noreferrer' className='cl-btn cl-btn--whatsapp'>
              Continue on WhatsApp
            </a>
            <button type='button' className='cl-btn cl-btn--ghost' onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          <div className='cl-panel__lead'>
            <h3 className='cl-panel__heading'>Plan your trip with us</h3>
            <p className='cl-panel__intro'>Tell us a bit about you and a travel expert will call you back.</p>
          </div>

          <TextField
            label='Name*'
            value={name}
            onChange={(v) => {
              setName(v);
              clear('name');
            }}
            error={errors.name}
            autoComplete='name'
          />
          <PhoneField
            countryId={countryId}
            onCountryChange={setCountryId}
            value={phone}
            onChange={(v) => {
              setPhone(v);
              clear('phone');
            }}
            error={errors.phone}
          />

          <fieldset className='cl-chips'>
            <legend>
              Planning for <em>(optional)</em>
            </legend>
            <div>
              {PLANNING_OPTIONS.map((option) => (
                <button
                  key={option}
                  type='button'
                  className={planning === option ? 'is-on' : ''}
                  aria-pressed={planning === option}
                  onClick={() => setPlanning(planning === option ? '' : option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </fieldset>

          {status === 'failed' && <p className='cl-error'>Could not send right now. Please try again or call {CONTACT.uaePhone}.</p>}

          <button type='submit' className='cl-btn cl-btn--primary' disabled={status === 'sending'}>
            {status === 'sending' && <Loader2 size={16} className='cl-spin' aria-hidden />}
            Request call back
          </button>
          <Consent />
        </form>
      )}
    </PanelFrame>
  );
}

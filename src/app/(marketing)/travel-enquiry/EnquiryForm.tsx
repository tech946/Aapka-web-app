'use client';

import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CalendarDays, Check, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import Select from '@/components/site/ui/Select';
import { addDaysIso, isoToday } from '@/components/site/ui/Calendar';
import { CONTACT } from '@/components/site/site-config';
import TrustBadge from '@/components/site/TrustBadge';
import { COUNTRIES } from '@/lib/countries';
import AttractionPicker from './AttractionPicker';
import type { Attraction } from './use-attractions';
import { ChoiceChips, DateField, Field, FlagChips, Step, Stepper, Toggle } from './fields';
import {
  BED_TYPES,
  CURRENCIES,
  ERROR_STEP,
  FOOD_PREFERENCES,
  HOTEL_CATEGORIES,
  INITIAL_FORM,
  MEAL_PLANS,
  OCCASIONS,
  PAYMENT_MODES,
  REQUIRED,
  STEPS,
  dayLabel,
  isFilled,
  nightsBetween,
  toPayload,
  validate,
  type FormErrors,
  type LeadField,
  type LeadFormData,
  type StepId,
} from './enquiry-config';

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ value: c.value, label: c.label }));

const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;
const labelOf = (list: { value: string; label: string }[], value: string) => list.find((o) => o.value === value)?.label;
const money = (n: number, currency: string) => `${currency ? currency + ' ' : ''}${n.toLocaleString('en-US')}`;

/** "a, b and c" */
function listJoin(items: string[]): string {
  return items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

const stepDomId = (id: StepId) => `te-${id}`;

/* /travel-enquiry: the trip as a short run of collapsible steps — what to
   do first, contact details last — beside a summary that fills in as you
   answer. Only a name, WhatsApp number and one activity are required.
   Fields, rules and the /api/website/leads call: enquiry-config.ts. */
export default function EnquiryForm() {
  const router = useRouter();
  const [form, setForm] = useState<LeadFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [sending, setSending] = useState(false);
  const [openStep, setOpenStep] = useState<StepId | null>(STEPS[0].id);
  const [tours, setTours] = useState<Attraction[]>([]);

  function set<K extends LeadField>(field: K, value: LeadFormData[K]) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) {
      setErrors((cur) => {
        const next = { ...cur };
        delete next[field];
        return next;
      });
    }
  }

  /** open a step and bring its head to the top of the screen */
  function goTo(id: StepId) {
    setOpenStep(id);
    requestAnimationFrame(() => document.getElementById(stepDomId(id))?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  const nights = nightsBetween(form.check_in_date, form.check_out_date);

  // what each step says when closed (and in the summary card)
  const summaries = useMemo<Record<StepId, string>>(() => {
    const names = tours.map((a) => a.name);
    const cur = form.currency;
    return {
      tours: names.length ? names.slice(0, 2).join(', ') + (names.length > 2 ? ` +${names.length - 2} more` : '') : '',
      dates: [
        form.check_in_date ? dayLabel(form.check_in_date) + (form.check_out_date ? ` – ${dayLabel(form.check_out_date)}` : '') : '',
        nights ? plural(nights, 'night') : '',
        form.flexible_dates ? 'flexible' : '',
      ]
        .filter(Boolean)
        .join(' · '),
      travellers: [
        form.adults ? plural(form.adults, 'adult') : '',
        form.children_count ? plural(form.children_count, 'child', 'children') : '',
        form.infant_count ? plural(form.infant_count, 'infant') : '',
        form.senior_travelers ? 'seniors' : '',
        form.need_dubai_visa ? 'needs visa' : '',
      ]
        .filter(Boolean)
        .join(' · '),
      hotel: [
        labelOf(HOTEL_CATEGORIES, form.hotel_category),
        labelOf(MEAL_PLANS, form.meal_plan),
        form.bed_type ? `${form.bed_type} bed` : '',
        form.room_type.trim(),
        form.preferred_location.trim(),
      ]
        .filter(Boolean)
        .join(' · '),
      budget: [
        form.food_preference_id ? labelOf(FOOD_PREFERENCES, String(form.food_preference_id)) : '',
        form.per_person_budget ? `${money(form.per_person_budget, cur)} pp` : '',
        form.full_package_budget ? `${money(form.full_package_budget, cur)} total` : '',
        labelOf(PAYMENT_MODES, form.payment_mode),
      ]
        .filter(Boolean)
        .join(' · '),
      occasions: OCCASIONS.filter((o) => form[o.field])
        .map((o) => o.label)
        .join(', '),
      details: [form.full_name_as_per_passport.trim(), form.whatsapp_number.trim()].filter(Boolean).join(' · '),
    };
  }, [form, nights, tours]);

  const done: Record<StepId, boolean> = {
    tours: form.tours_and_activities.length > 0,
    dates: !!form.check_in_date,
    travellers: form.adults + form.children_count + form.infant_count > 0,
    hotel: !!summaries.hotel,
    budget: !!summaries.budget,
    occasions: !!summaries.occasions,
    details: isFilled(form, 'full_name_as_per_passport') && isFilled(form, 'whatsapp_number'),
  };
  const doneCount = STEPS.filter((s) => done[s.id]).length;
  const missing = REQUIRED.filter((r) => !isFilled(form, r.field)).map((r) => r.label);
  const firstName = form.full_name_as_per_passport.trim().split(/\s+/)[0];

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    const first = (Object.keys(found) as LeadField[])[0];
    if (first) {
      toast.error('Please fill in all required fields');
      const step = ERROR_STEP[first];
      if (step) goTo(step);
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/website/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(form)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit lead');
      toast.success('Enquiry sent! We will contact you soon.');
      setTimeout(() => router.push('/travel-enquiry/thank-you'), 1000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit lead. Please try again.');
    } finally {
      setSending(false);
    }
  }

  const submitButton = (
    <button type="submit" className="ui-btn ui-btn--primary ui-btn--lg te-send" disabled={sending}>
      {sending ? <Loader2 className="te-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
      {sending ? 'Sending…' : 'Send enquiry'}
    </button>
  );

  const checkOutMin = form.check_in_date ? addDaysIso(form.check_in_date, 1) : addDaysIso(isoToday(), 1);

  const content: Record<StepId, ReactNode> = {
    tours: (
      <>
        <AttractionPicker
          value={tours}
          onChange={(next) => {
            setTours(next);
            set('tours_and_activities', next.map((a) => a.id));
          }}
          invalid={!!errors.tours_and_activities}
        />
        {errors.tours_and_activities ? <p className="ui-error">{errors.tours_and_activities}</p> : null}
      </>
    ),

    dates: (
      <>
        <div className="ui-grid">
          <Field label="Check-in" htmlFor="te-in">
            <DateField
              id="te-in"
              value={form.check_in_date}
              min={isoToday()}
              placeholder="Choose check-in"
              onChange={(iso) => {
                set('check_in_date', iso);
                // keep check-out after check-in
                if (form.check_out_date && form.check_out_date <= iso) set('check_out_date', '');
              }}
            />
          </Field>
          <Field label="Check-out" htmlFor="te-out">
            <DateField id="te-out" value={form.check_out_date} min={checkOutMin} placeholder="Choose check-out" onChange={(iso) => set('check_out_date', iso)} />
          </Field>
        </div>
        {nights > 0 && (
          <p className="te-note">
            <CalendarDays aria-hidden="true" />
            {plural(nights, 'night')} in Dubai
          </p>
        )}
        <Toggle label="My dates are flexible" hint="We’ll look for better prices around them" checked={form.flexible_dates} onChange={(v) => set('flexible_dates', v)} />
      </>
    ),

    travellers: (
      <>
        <div className="te-panel">
          <Stepper label="Adults" hint="8 years and above" value={form.adults} onChange={(v) => set('adults', v)} />
          <Stepper label="Children" hint="2 – 8 years" value={form.children_count} onChange={(v) => set('children_count', v)} />
          <Stepper label="Infants" hint="Under 2 years" value={form.infant_count} onChange={(v) => set('infant_count', v)} />
        </div>
        {form.children_count > 0 && (
          <Field label="Children’s ages" htmlFor="te-ages">
            <input id="te-ages" className="ui-input" placeholder="e.g. 5, 7" value={form.children_ages} onChange={(e) => set('children_ages', e.target.value)} />
          </Field>
        )}
        <div className="te-toggles">
          <Toggle label="Senior travellers" hint="Anyone 60 or older" checked={form.senior_travelers} onChange={(v) => set('senior_travelers', v)} />
          {form.senior_travelers && (
            <input
              className="ui-input te-toggles__detail"
              aria-label="Senior travellers’ ages"
              placeholder="Their ages, e.g. 64, 68"
              value={form.senior_travelers_age_detail}
              onChange={(e) => set('senior_travelers_age_detail', e.target.value)}
            />
          )}
          <Toggle label="Need a Dubai visa?" hint="We can arrange the UAE tourist visa" checked={form.need_dubai_visa} onChange={(v) => set('need_dubai_visa', v)} />
        </div>
        <Field label="Special needs" htmlFor="te-needs" optional>
          <textarea
            id="te-needs"
            className="ui-input"
            rows={3}
            placeholder="Wheelchair access, dietary needs, anything we should know"
            value={form.special_needs}
            onChange={(e) => set('special_needs', e.target.value)}
          />
        </Field>
      </>
    ),

    hotel: (
      <>
        <Field label="Hotel category">
          <ChoiceChips label="Hotel category" options={HOTEL_CATEGORIES} value={form.hotel_category} onChange={(v) => set('hotel_category', v)} />
        </Field>
        <Field label="Meal plan">
          <ChoiceChips label="Meal plan" options={MEAL_PLANS} value={form.meal_plan} onChange={(v) => set('meal_plan', v)} />
        </Field>
        <Field label="Bed type">
          <ChoiceChips label="Bed type" options={BED_TYPES} value={form.bed_type} onChange={(v) => set('bed_type', v)} />
        </Field>
        <div className="ui-grid">
          <Field label="Room type" htmlFor="te-room" optional>
            <input id="te-room" className="ui-input" placeholder="e.g. Deluxe, Family suite" value={form.room_type} onChange={(e) => set('room_type', e.target.value)} />
          </Field>
          <Field label="Preferred area" htmlFor="te-area" optional>
            <input
              id="te-area"
              className="ui-input"
              placeholder="Deira, Downtown, Marina, JBR, Palm…"
              value={form.preferred_location}
              onChange={(e) => set('preferred_location', e.target.value)}
            />
          </Field>
        </div>
        <Toggle label="Smoking room" checked={form.smoking_room_required} onChange={(v) => set('smoking_room_required', v)} />
      </>
    ),

    budget: (
      <>
        <Field label="Food preference">
          <ChoiceChips
            label="Food preference"
            options={FOOD_PREFERENCES}
            value={form.food_preference_id ? String(form.food_preference_id) : ''}
            onChange={(v) => set('food_preference_id', v ? parseInt(v, 10) : null)}
          />
        </Field>
        <Field label="Currency">
          <ChoiceChips label="Currency" options={CURRENCIES} value={form.currency} onChange={(v) => set('currency', v)} />
        </Field>
        <div className="ui-grid">
          <Field label="Budget per person" htmlFor="te-pp" optional>
            <input
              id="te-pp"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              className="ui-input"
              placeholder={form.currency ? `Amount in ${form.currency}` : 'Amount'}
              value={form.per_person_budget || ''}
              onChange={(e) => set('per_person_budget', parseFloat(e.target.value) || 0)}
            />
          </Field>
          <Field label="Full package budget" htmlFor="te-full" optional>
            <input
              id="te-full"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              className="ui-input"
              placeholder={form.currency ? `Amount in ${form.currency}` : 'Amount'}
              value={form.full_package_budget || ''}
              onChange={(e) => set('full_package_budget', parseFloat(e.target.value) || 0)}
            />
          </Field>
        </div>
        <Toggle label="My budget is flexible" checked={form.flexible_budget} onChange={(v) => set('flexible_budget', v)} />
        <Field label="How would you like to pay?">
          <ChoiceChips label="Payment mode" options={PAYMENT_MODES} value={form.payment_mode} onChange={(v) => set('payment_mode', v)} />
        </Field>
      </>
    ),

    occasions: (
      <FlagChips
        label="Special occasions"
        items={OCCASIONS.map((o) => ({ key: o.field, label: o.label, on: !!form[o.field], toggle: () => set(o.field, !form[o.field]) }))}
      />
    ),

    details: (
      <div className="ui-grid">
        <Field label="Full name (as per passport)" htmlFor="te-name" required error={errors.full_name_as_per_passport}>
          <input
            id="te-name"
            className="ui-input"
            autoComplete="name"
            placeholder="e.g. Ananya Verma"
            value={form.full_name_as_per_passport}
            onChange={(e) => set('full_name_as_per_passport', e.target.value)}
          />
        </Field>
        <Field label="WhatsApp number" htmlFor="te-whatsapp" required error={errors.whatsapp_number}>
          <input
            id="te-whatsapp"
            type="tel"
            className="ui-input"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+971 50 123 4567"
            value={form.whatsapp_number}
            onChange={(e) => set('whatsapp_number', e.target.value)}
          />
        </Field>
        <Field label="Email" htmlFor="te-email" optional error={errors.email_id}>
          <input id="te-email" type="email" className="ui-input" autoComplete="email" placeholder="you@example.com" value={form.email_id} onChange={(e) => set('email_id', e.target.value)} />
        </Field>
        <Field label="Nationality">
          <Select value={form.nationality} onChange={(v) => set('nationality', v)} options={COUNTRY_OPTIONS} searchable placeholder="Select nationality" aria-label="Nationality" />
        </Field>
        <Field label="Travelling from" wide>
          <Select
            value={form.city_country_of_departure}
            onChange={(v) => set('city_country_of_departure', v)}
            options={COUNTRY_OPTIONS}
            searchable
            placeholder="Select country of departure"
            aria-label="Country of departure"
          />
        </Field>
      </div>
    ),
  };

  return (
    <div className="at-site desert-ember">
      <div className="te-page">
        <div className="te-band" aria-hidden="true">
          <video className="te-band__video" src="/videos/hero-desert-sunset.mp4" autoPlay muted loop playsInline preload="auto" />
        </div>
        <div className="container">
          <header className="te-hero">
            <TrustBadge />
            <h1>
              Let’s plan your <span className="te-hero__accent">Dubai trip</span>
            </h1>
            <p className="te-hero__sub">Tell us what you’d love to do — we’ll reply on WhatsApp within 24 hours.</p>
          </header>

          <form className="te-layout" onSubmit={onSubmit} noValidate>
            <div className="te-main">
              {STEPS.map((step, i) => {
                const required = 'required' in step && step.required;
                const last = i === STEPS.length - 1;
                const next = STEPS[i + 1];
                return (
                  <Step
                    key={step.id}
                    id={stepDomId(step.id)}
                    index={i + 1}
                    title={step.title}
                    hint={step.hint}
                    summary={summaries[step.id]}
                    done={done[step.id]}
                    required={required}
                    open={openStep === step.id}
                    onToggle={() => setOpenStep(openStep === step.id ? null : step.id)}
                    actions={
                      last ? (
                        submitButton
                      ) : (
                        <>
                          {!required && !done[step.id] ? (
                            <button type="button" className="te-skip" onClick={() => goTo(next.id)}>
                              Skip
                            </button>
                          ) : null}
                          <button type="button" className="ui-btn ui-btn--dark ui-btn--lg" onClick={() => goTo(next.id)}>
                            Continue
                            <ArrowRight aria-hidden="true" />
                          </button>
                        </>
                      )
                    }
                  >
                    {content[step.id]}
                  </Step>
                );
              })}
            </div>

            {/* summary: sticky beside the steps on desktop, after them on phones */}
            <aside className="te-aside" aria-label="Your trip so far">
              <div className="ui-card te-summary">
                <p className="te-summary__kicker">Trip summary</p>
                <div className="te-summary__head">
                  <h2>{firstName ? `${firstName}’s trip` : 'Your trip'}</h2>
                  <span className="te-summary__count">
                    {doneCount}/{STEPS.length}
                  </span>
                </div>
                <div
                  className="te-progress"
                  role="progressbar"
                  aria-label="Steps answered"
                  aria-valuemin={0}
                  aria-valuemax={STEPS.length}
                  aria-valuenow={doneCount}
                >
                  <span style={{ width: `${(doneCount / STEPS.length) * 100}%` }} />
                </div>

                {doneCount > 0 && (
                  <ul className="te-recap">
                    {STEPS.filter((s) => summaries[s.id]).map((s) => (
                      <li key={s.id}>
                        <button type="button" onClick={() => goTo(s.id)} title={summaries[s.id]}>
                          <span className="te-recap__label">{s.short}</span>
                          <span className="te-recap__value">{summaries[s.id]}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {missing.length ? (
                  <p className="te-summary__need">Still needed: {listJoin(missing)}</p>
                ) : (
                  <p className="te-summary__ready">
                    <Check aria-hidden="true" />
                    Ready to send
                  </p>
                )}
                {submitButton}
              </div>

              <p className="te-help">
                Prefer to talk? <a href={CONTACT.uaePhoneHref}>Call</a> or{' '}
                <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>{' '}
                us
              </p>
            </aside>
          </form>
        </div>
      </div>
    </div>
  );
}

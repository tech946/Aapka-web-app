'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Cake,
  Car,
  Check,
  Clock,
  Gift,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  Search,
  Send,
  Stamp,
  Wallet,
  X,
} from 'lucide-react';
import DeferredVideo from '@/components/site/DeferredVideo';
import { afterLoad } from '@/lib/after-load';
import { CONTACT } from '@/components/site/site-config';
import {
  AREAS,
  ATTRACTIONS,
  ATTRACTION_TABS,
  BAND_NOTES,
  BUDGET_BANDS,
  COUPLE_EXTRAS,
  CURRENCIES,
  EXTRAS,
  FOODS,
  HOTEL_CLASSES,
  INITIAL_PLAN,
  MEALS,
  NOT_SURE,
  PARTY_EXTRAS,
  QUESTION_COUNT,
  STAGES,
  STEPS,
  TRIP_TYPES,
  VIDEO,
  VIDEO_POSTER,
  nextMonths,
  nightsBetween,
  plural,
  shortDate,
  type Extra,
  type Plan,
  type StepId,
} from './data';
import { Chip, Counter, Group, OptionCard, QuestionHead, RangeCalendar, Segmented, Stars, SwitchRow } from './ui';

type ListKey = 'acts' | 'areas' | 'extras';
type PickKey = 'tripType' | 'month' | 'hotel' | 'meal' | 'food' | 'band';

const EXTRA_ICONS: Record<Extra['icon'], ReactNode> = {
  car: <Car aria-hidden="true" />,
  visa: <Stamp aria-hidden="true" />,
  cake: <Cake aria-hidden="true" />,
  heart: <Heart aria-hidden="true" />,
  gift: <Gift aria-hidden="true" />,
};

const MEDIA = Array.from(new Set(STEPS.map((s) => s.media).filter((m): m is string => !!m)));
const indexOf = (id: StepId) => STEPS.findIndex((s) => s.id === id);
const CHILD_AGES = [2, 3, 4, 5, 6, 7, 8];

interface Row {
  label: string;
  value: string;
  step: StepId;
}

export default function PlanFlow() {
  const [plan, setPlan] = useState<Plan>(INITIAL_PLAN);
  const [index, setIndex] = useState(0);
  const [mediaReady, setMediaReady] = useState(false);
  useEffect(() => afterLoad(() => setMediaReady(true)), []);
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState('All');
  const [query, setQuery] = useState('');
  const [sheet, setSheet] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const months = useMemo(() => nextMonths(12), []);

  const step = STEPS[index];
  const questionNo = step.stage >= 0 && step.stage <= 3 && step.id !== 'review' ? index : 0;

  useEffect(() => {
    const top = rootRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [index]);

  function set<K extends keyof Plan>(key: K, value: Plan[K]) {
    setPlan((p) => ({ ...p, [key]: value }));
  }

  function pick(key: PickKey, value: string) {
    setPlan((p) => ({ ...p, [key]: p[key] === value ? '' : value }));
  }

  function toggle(key: ListKey, value: string) {
    setPlan((p) => ({ ...p, [key]: p[key].includes(value) ? p[key].filter((v) => v !== value) : [...p[key], value] }));
  }

  function setChildren(n: number) {
    setPlan((p) => ({ ...p, children: n, childAges: Array.from({ length: n }, (_, i) => p.childAges[i] ?? 0) }));
  }

  const nights = plan.dateMode === 'exact' ? nightsBetween(plan.checkIn, plan.checkOut) : plan.nights;
  const couple = plan.tripType === 'Honeymoon' || plan.tripType === 'Couple getaway';
  const extraOptions = [...EXTRAS, ...(couple ? COUPLE_EXTRAS : PARTY_EXTRAS)];

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    if (plan.tripType) out.push({ label: 'Trip', value: plan.tripType, step: 'type' });
    const when =
      plan.dateMode === 'exact'
        ? plan.checkIn
          ? `${shortDate(plan.checkIn)}${plan.checkOut ? ' – ' + shortDate(plan.checkOut) : ''}`
          : ''
        : plan.month;
    if (when) out.push({ label: 'When', value: [when, nights ? plural(nights, 'night') : '', plan.flexibleDates ? 'flexible' : ''].filter(Boolean).join(' · '), step: 'when' });
    out.push({
      label: 'Travellers',
      value: [plural(plan.adults, 'adult'), plan.children ? plural(plan.children, 'child', 'children') : '', plan.infants ? plural(plan.infants, 'infant') : '', plan.seniors ? 'seniors' : '']
        .filter(Boolean)
        .join(', '),
      step: 'who',
    });
    if (plan.acts.length) {
      const names = plan.acts.map((id) => ATTRACTIONS.find((a) => a.id === id)?.name ?? id);
      out.push({ label: 'Experiences', value: names.join(', '), step: 'acts' });
    }
    const stay = [plan.hotel, plan.areas.join(', '), plan.meal].filter(Boolean).join(' · ');
    if (stay) out.push({ label: 'Stay', value: stay, step: 'hotel' });
    const extras = [...plan.extras, plan.food].filter(Boolean).join(', ');
    if (extras) out.push({ label: 'Extras', value: extras, step: 'extras' });
    if (plan.band) out.push({ label: 'Budget', value: plan.band + (plan.band !== NOT_SURE ? ' per person' : '') + (plan.flexibleBudget ? ' · flexible' : ''), step: 'budget' });
    const contact = [plan.name.trim(), plan.phone.trim()].filter(Boolean).join(' · ');
    if (contact) out.push({ label: 'Contact', value: contact, step: 'details' });
    return out;
  }, [plan, nights]);

  const answered = rows.length - 1;

  function missing(id: StepId): boolean {
    if (id === 'acts') return plan.acts.length === 0;
    if (id === 'details') return !plan.name.trim() || !plan.phone.trim();
    return false;
  }

  function go(id: StepId) {
    setTried(false);
    setSheet(false);
    setIndex(indexOf(id));
  }

  function next() {
    if (missing(step.id)) {
      setTried(true);
      return;
    }
    if (step.id === 'review') {
      const gap = (['acts', 'details'] as StepId[]).find(missing);
      if (gap) {
        setIndex(indexOf(gap));
        setTried(true);
        return;
      }
      setSending(true);
      window.setTimeout(() => {
        setSending(false);
        go('done');
      }, 900);
      return;
    }
    setTried(false);
    setIndex((n) => Math.min(n + 1, STEPS.length - 1));
  }

  function back() {
    setTried(false);
    setIndex((n) => Math.max(n - 1, 0));
  }

  function restart() {
    setPlan(INITIAL_PLAN);
    setQuery('');
    setTab('All');
    go('start');
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!sending) next();
  }

  const visibleActs = ATTRACTIONS.filter((a) => (tab === 'All' || a.category === tab) && a.name.toLowerCase().includes(query.trim().toLowerCase()));

  const views: Record<StepId, ReactNode> = {
    start: (
      <>
        <QuestionHead title="How would you like to start?" sub="Answer eight quick questions. A Dubai travel expert then sends you a tailored plan and price." />
        <div className="pt-cards pt-cards--two">
          <OptionCard title="Start from scratch" note="Tell us what you love and we build it around you" icon={<MapPin aria-hidden="true" />} on multi onClick={next} />
          <Link href="/holidays" className="pt-card pt-card--link">
            <span className="pt-card__icon">
              <BadgeCheck aria-hidden="true" />
            </span>
            <span className="pt-card__body">
              <b>Start from a package</b>
              <small>Pick one of our holidays and change anything</small>
            </span>
            <ArrowRight className="pt-card__go" aria-hidden="true" />
          </Link>
        </div>
        <ul className="pt-promises">
          <li>
            <Clock aria-hidden="true" />
            <span>
              <b>About 2 minutes</b>
              Only three answers are required
            </span>
          </li>
          <li>
            <Wallet aria-hidden="true" />
            <span>
              <b>No payment now</b>
              Planning is free, pay only when you book
            </span>
          </li>
          <li>
            <MessageCircle aria-hidden="true" />
            <span>
              <b>Reply within 24 hours</b>
              Your plan arrives on WhatsApp
            </span>
          </li>
        </ul>
      </>
    ),

    type: (
      <>
        <QuestionHead title="What kind of trip is this?" sub="It helps us pick the right hotels, pace and experiences." />
        <div className="pt-cards pt-cards--three" role="radiogroup" aria-label="Kind of trip">
          {TRIP_TYPES.map((t) => (
            <OptionCard key={t.value} title={t.value} note={t.note} image={t.image} on={plan.tripType === t.value} onClick={() => pick('tripType', t.value)} />
          ))}
        </div>
      </>
    ),

    when: (
      <>
        <QuestionHead title="When are you coming?" sub="Rough dates are fine. You can change them later with your expert." />
        <Segmented
          label="How to choose dates"
          value={plan.dateMode}
          onChange={(v) => set('dateMode', v as Plan['dateMode'])}
          options={[
            { value: 'month', label: 'Pick a month' },
            { value: 'exact', label: 'Exact dates' },
          ]}
        />
        {plan.dateMode === 'month' ? (
          <>
            <div className="pt-months" role="radiogroup" aria-label="Month of travel">
              {months.map((m) => (
                <button key={m.value} type="button" role="radio" aria-checked={plan.month === m.value} className={'pt-month' + (plan.month === m.value ? ' is-on' : '')} onClick={() => pick('month', m.value)}>
                  <b>{m.month}</b>
                  <small>{m.year}</small>
                </button>
              ))}
            </div>
            <div className="pt-box">
              <Counter label="Nights" hint="How long you would like to stay" value={plan.nights} min={1} max={30} onChange={(v) => set('nights', v)} />
            </div>
          </>
        ) : (
          <>
            <RangeCalendar
              checkIn={plan.checkIn}
              checkOut={plan.checkOut}
              onChange={(a, b) => setPlan((p) => ({ ...p, checkIn: a, checkOut: b }))}
            />
            <p className="pt-dates" aria-live="polite">
              <CalendarDays aria-hidden="true" />
              {plan.checkIn
                ? plan.checkOut
                  ? `${shortDate(plan.checkIn)} – ${shortDate(plan.checkOut)} · ${plural(nights, 'night')}`
                  : `Check-in ${shortDate(plan.checkIn)} · now pick your check-out`
                : 'Pick your check-in day'}
            </p>
          </>
        )}
        <SwitchRow label="My dates are flexible" hint="We look for better prices a few days either side" checked={plan.flexibleDates} onChange={(v) => set('flexibleDates', v)} />
      </>
    ),

    who: (
      <>
        <QuestionHead title="Who is coming along?" sub="Count everyone travelling, including you." />
        <div className="pt-box">
          <Counter label="Adults" hint="8 years and above" value={plan.adults} min={1} onChange={(v) => set('adults', v)} />
          <Counter label="Children" hint="2 to 8 years" value={plan.children} max={8} onChange={setChildren} />
          <Counter label="Infants" hint="Under 2 years" value={plan.infants} max={6} onChange={(v) => set('infants', v)} />
        </div>
        {plan.children > 0 ? (
          <Group label="Children’s ages" hint="So we book the right tickets and beds">
            <div className="pt-ages">
              {plan.childAges.map((age, i) => (
                <label key={i} className="pt-select">
                  <span>Child {i + 1}</span>
                  <select
                    value={age}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setPlan((p) => ({ ...p, childAges: p.childAges.map((a, k) => (k === i ? v : a)) }));
                    }}
                  >
                    <option value={0}>Age</option>
                    {CHILD_AGES.map((a) => (
                      <option key={a} value={a}>
                        {a} years
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </Group>
        ) : null}
        <SwitchRow label="Senior travellers" hint="Anyone 60 or older, so we keep the pace easy" checked={plan.seniors} onChange={(v) => set('seniors', v)} />
      </>
    ),

    acts: (
      <>
        <QuestionHead title="What would you love to do?" sub="Pick as many as you like. Your expert fits them into the days." required />
        <div className="pt-search">
          <Search aria-hidden="true" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tours, places or activities" aria-label="Search experiences" enterKeyHint="search" />
          {plan.acts.length ? <span className="pt-search__count">{plan.acts.length} picked</span> : null}
        </div>
        <div className="pt-tabs" role="tablist" aria-label="Experience type">
          {ATTRACTION_TABS.map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? 'is-on' : ''} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
        {visibleActs.length ? (
          <div className="pt-cards pt-cards--three">
            {visibleActs.map((a) => (
              <OptionCard
                key={a.id}
                multi
                title={a.name}
                image={a.image}
                meta={
                  <span className="pt-card__meta">
                    {a.category} · {a.duration}
                  </span>
                }
                on={plan.acts.includes(a.id)}
                onClick={() => toggle('acts', a.id)}
              />
            ))}
          </div>
        ) : (
          <p className="pt-empty">No experiences match “{query}”. Try another word, or tell your expert later.</p>
        )}
        {tried && missing('acts') ? <p className="pt-error">Pick at least one experience to continue</p> : null}
      </>
    ),

    hotel: (
      <>
        <QuestionHead title="Where would you like to stay?" sub="Pick a hotel class and the parts of Dubai you like." />
        <div className="pt-cards pt-cards--four" role="radiogroup" aria-label="Hotel class">
          {HOTEL_CLASSES.map((h) => (
            <OptionCard key={h.value} title={h.value} note={h.note} meta={<Stars count={h.stars} />} on={plan.hotel === h.value} onClick={() => pick('hotel', h.value)} />
          ))}
        </div>
        <Group label="Areas" hint="Choose any">
          <div className="pt-chips">
            {AREAS.map((a) => (
              <Chip key={a} multi label={a} on={plan.areas.includes(a)} onClick={() => toggle('areas', a)} />
            ))}
          </div>
        </Group>
        <Group label="Meals">
          <div className="pt-chips" role="radiogroup" aria-label="Meals">
            {MEALS.map((m) => (
              <Chip key={m} label={m} on={plan.meal === m} onClick={() => pick('meal', m)} />
            ))}
          </div>
        </Group>
      </>
    ),

    extras: (
      <>
        <QuestionHead title="Anything to add?" sub="Optional. Tick what would make the trip easier or more special." />
        <div className="pt-cards pt-cards--two">
          {extraOptions.map((x) => (
            <OptionCard key={x.value} multi title={x.value} note={x.note} icon={EXTRA_ICONS[x.icon]} on={plan.extras.includes(x.value)} onClick={() => toggle('extras', x.value)} />
          ))}
        </div>
        <Group label="Food preference">
          <div className="pt-chips" role="radiogroup" aria-label="Food preference">
            {FOODS.map((f) => (
              <Chip key={f} label={f} on={plan.food === f} onClick={() => pick('food', f)} />
            ))}
          </div>
        </Group>
        <Group label="Anything else we should know?" hint="Optional">
          <textarea className="pt-input pt-input--area" rows={3} value={plan.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Wheelchair access, a special date, a hotel you love…" aria-label="Anything else we should know" />
        </Group>
      </>
    ),

    budget: (
      <>
        <QuestionHead title="What budget feels right?" sub="Per person, without flights. A rough range is enough." />
        <Segmented
          label="Currency"
          value={plan.currency}
          onChange={(v) => setPlan((p) => ({ ...p, currency: v, band: '' }))}
          options={CURRENCIES.map((c) => ({ value: c, label: c }))}
        />
        <div className="pt-cards pt-cards--two" role="radiogroup" aria-label="Budget per person">
          {BUDGET_BANDS[plan.currency].map((b, i) => (
            <OptionCard key={b} title={b} note={BAND_NOTES[i]} on={plan.band === b} onClick={() => pick('band', b)} />
          ))}
        </div>
        <div className="pt-chips">
          <Chip label={NOT_SURE} on={plan.band === NOT_SURE} onClick={() => pick('band', NOT_SURE)} />
        </div>
        <SwitchRow label="My budget is flexible" hint="Show me a few options just above it too" checked={plan.flexibleBudget} onChange={(v) => set('flexibleBudget', v)} />
      </>
    ),

    details: (
      <>
        <QuestionHead title="Where should we send your plan?" sub="A travel expert replies on WhatsApp within 24 hours." />
        <div className="pt-fields">
          <label className={'pt-field' + (tried && !plan.name.trim() ? ' has-error' : '')}>
            <span>
              Full name <i>as on passport</i>
            </span>
            <input className="pt-input" autoComplete="name" value={plan.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Ananya Verma" />
            {tried && !plan.name.trim() ? <em>Please add your name</em> : null}
          </label>
          <label className={'pt-field' + (tried && !plan.phone.trim() ? ' has-error' : '')}>
            <span>WhatsApp number</span>
            <input className="pt-input" type="tel" inputMode="tel" autoComplete="tel" value={plan.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+971 50 123 4567" />
            {tried && !plan.phone.trim() ? <em>Please add a WhatsApp number</em> : null}
          </label>
          <label className="pt-field">
            <span>
              Email <i>optional</i>
            </span>
            <input className="pt-input" type="email" autoComplete="email" value={plan.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" />
          </label>
          <label className="pt-field">
            <span>
              Flying from <i>optional</i>
            </span>
            <input className="pt-input" autoComplete="address-level2" value={plan.from} onChange={(e) => set('from', e.target.value)} placeholder="e.g. Mumbai, India" />
          </label>
        </div>
        <p className="pt-fine">We only use these details to send your trip plan. No spam, ever.</p>
      </>
    ),

    review: (
      <>
        <QuestionHead title="Your trip at a glance" sub="Check everything, then send it to our experts." />
        <dl className="pt-review">
          {rows.map((r) => (
            <div key={r.label} className="pt-review__row">
              <dt>{r.label}</dt>
              <dd>{r.value}</dd>
              <button type="button" onClick={() => go(r.step)}>
                Edit
              </button>
            </div>
          ))}
        </dl>
        <p className="pt-assure">
          <Check aria-hidden="true" />
          Free planning. You only pay when you decide to book.
        </p>
      </>
    ),

    done: (
      <div className="pt-done">
        <span className="pt-done__mark" aria-hidden="true">
          <Check />
        </span>
        <QuestionHead title={`Thank you${plan.name.trim() ? ', ' + plan.name.trim().split(/\s+/)[0] : ''}!`} sub="Your trip is in good hands. Here is what happens next." />
        <ol className="pt-next">
          <li>
            <b>We read your plan</b>
            <span>A Dubai expert goes through your dates, group and wishes.</span>
          </li>
          <li>
            <b>You get a tailored quote</b>
            <span>Itinerary and price on WhatsApp within 24 hours.</span>
          </li>
          <li>
            <b>You decide</b>
            <span>Change anything you like, then book when it feels right.</span>
          </li>
        </ol>
        <div className="pt-done__actions">
          <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="pt-btn pt-btn--wa">
            <MessageCircle aria-hidden="true" />
            Chat on WhatsApp
          </a>
          <Link href="/holidays" className="pt-btn pt-btn--line">
            Explore holidays
          </Link>
          <button type="button" className="pt-link" onClick={restart}>
            Plan another trip
          </button>
        </div>
      </div>
    ),
  };

  const showProgress = step.stage >= 0 && step.stage <= 3;
  const showBar = step.id !== 'done';
  const nextLabel = step.id === 'start' ? 'Start planning' : step.id === 'review' ? 'Send enquiry' : 'Continue';
  const optional = !['start', 'acts', 'details', 'review'].includes(step.id);

  const summaryList = (
    <ul className="pt-sum">
      {rows.map((r) => (
        <li key={r.label}>
          <span>{r.label}</span>
          <span>{r.value}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="pt" ref={rootRef}>
      <aside className="pt-media" aria-label="Trip overview">
        <div className="pt-media__stack" aria-hidden="true">
          <DeferredVideo className={'pt-media__item' + (step.media ? '' : ' is-on')} src={VIDEO} poster={VIDEO_POSTER} priority autoPlay muted loop playsInline />
          {MEDIA.filter((src) => mediaReady || step.media === src).map((src) => (
            <img key={src} className={'pt-media__item' + (step.media === src ? ' is-on' : '')} src={src} alt="" decoding="async" />
          ))}
        </div>
        <div className="pt-media__content">
          <div className="pt-media__top" key={step.id}>
            <span className="pt-pill">{step.kicker}</span>
            <h1 className="pt-media__title">{step.title}</h1>
            <p className="pt-media__line">{step.line}</p>
          </div>
          <div className="pt-media__bottom">
            {index > 0 && step.id !== 'done' ? (
              <div className="pt-trip">
                <p className="pt-trip__head">
                  <span>Your trip</span>
                  <small>{answered > 0 ? plural(answered, 'answer') : 'Just started'}</small>
                </p>
                {summaryList}
              </div>
            ) : null}
            <p className="pt-media__caption">
              <MapPin aria-hidden="true" />
              {step.caption}
            </p>
          </div>
        </div>
      </aside>

      <section className="pt-panel">
        {showProgress ? (
          <ol className="pt-stages" aria-label="Progress">
            {STAGES.map((s, n) => {
              const at = s.steps.indexOf(step.id);
              const pct = n < step.stage ? 100 : n > step.stage ? 0 : Math.round(((at + 1) / s.steps.length) * 100);
              return (
                <li key={s.label} className={(n === step.stage ? 'is-on' : '') + (n < step.stage ? ' is-done' : '')} aria-current={n === step.stage ? 'step' : undefined}>
                  <span className="pt-stages__bar">
                    <span style={{ width: `${pct}%` }} />
                  </span>
                  <span className="pt-stages__label">{s.label}</span>
                </li>
              );
            })}
          </ol>
        ) : null}

        <form className="pt-form" onSubmit={onSubmit} noValidate>
          <div className="pt-q" key={step.id}>
            {views[step.id]}
          </div>

          {showBar ? (
            <div className="pt-bar">
              <div className="pt-bar__inner">
                {index > 0 ? (
                  <button type="button" className="pt-btn pt-btn--ghost" onClick={back}>
                    <ArrowLeft aria-hidden="true" />
                    <span>Back</span>
                  </button>
                ) : (
                  <span />
                )}
                <div className="pt-bar__mid">
                  {questionNo ? <span className="pt-bar__count">Question {questionNo} of {QUESTION_COUNT}</span> : null}
                  {index > 0 ? (
                    <button type="button" className="pt-bar__trip" onClick={() => setSheet(true)}>
                      Your trip
                      <span>{Math.max(answered, 0)}</span>
                    </button>
                  ) : null}
                </div>
                <div className="pt-bar__end">
                  {optional ? (
                    <button type="button" className="pt-link pt-bar__skip" onClick={next}>
                      Skip
                    </button>
                  ) : null}
                  <button type="submit" className="pt-btn pt-btn--brand" disabled={sending}>
                    {sending ? <Loader2 className="pt-spin" aria-hidden="true" /> : null}
                    {sending ? 'Sending…' : nextLabel}
                    {!sending && step.id === 'review' ? <Send aria-hidden="true" /> : null}
                    {!sending && step.id !== 'review' ? <ArrowRight aria-hidden="true" /> : null}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </form>
      </section>

      {sheet ? (
        <div className="pt-sheet" role="dialog" aria-modal="true" aria-label="Your trip so far">
          <div className="pt-sheet__scrim" aria-hidden="true" />
          <div className="pt-sheet__card">
            <div className="pt-sheet__head">
              <b>Your trip so far</b>
              <button type="button" aria-label="Close" onClick={() => setSheet(false)}>
                <X aria-hidden="true" />
              </button>
            </div>
            {summaryList}
          </div>
        </div>
      ) : null}
    </div>
  );
}

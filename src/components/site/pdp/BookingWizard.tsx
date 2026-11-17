"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { addMonths, format, isSameDay, startOfDay, startOfMonth } from "date-fns";
import { CalendarDays, CalendarX2, Check, Lock, Minus, Pencil, Plus, Sparkles, Users, X } from "lucide-react";
import { money } from "./pdp-data";
import type { PaxId } from "./booking";
import { useTripSummary } from "./ex/trip-summary";
import { usePdpPlace } from "./PdpRelated";
import { EX_FONTS } from "@/app/(marketing)/Home/ex/fonts";
import "@/app/(marketing)/Home/ex/ex.css";
import "./booking-wizard.css";
import { responsiveImage } from "@/lib/image-url";

const OPEN_EVENT = "at:open-booking";

export function openBookingWizard() {
  const handled = !window.dispatchEvent(new Event(OPEN_EVENT, { cancelable: true }));
  if (!handled) document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export interface WizardPaxRow {
  id: PaxId;
  label: string;
  hint?: string;
  value: number;
  min: number;
  max?: number;
}

export interface WizardDates {
  fromMonth: Date;
  toMonth: Date;
  isDisabled: (date: Date) => boolean;
  selected?: Date;
  onSelect: (date: Date) => void;
  loading?: boolean;
}

export interface WizardReview {
  travellers: string[];
  extras: string[];
  lines: { label: string; amount: number }[];
}

interface Props {
  pax: { rows: WizardPaxRow[]; onStep: (id: PaxId, delta: number) => void; locked?: string | null } | null;
  options?: ReactNode;
  stepIssue?: string | null;
  note?: ReactNode;
  closed?: ReactNode;
  dates: WizardDates;
  total: number;
  travellers: number;
  issue: string | null;
  onBook: () => void;
  bookLabel?: string;
  dateTitle?: string;
  review?: WizardReview;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function Month({ month, dates, today }: { month: Date; dates: WizardDates; today: Date }) {
  const first = startOfMonth(month);
  const lead = first.getDay();
  const count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells = [...Array.from({ length: lead }, () => null), ...Array.from({ length: count }, (_, i) => new Date(first.getFullYear(), first.getMonth(), i + 1))];

  return (
    <div className="bw-month">
      <p className="bw-month__title">{format(first, "MMMM yyyy")}</p>
      <div className="bw-grid" role="grid" aria-label={format(first, "MMMM yyyy")}>
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="bw-grid__wd" role="columnheader">
            {d}
          </span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={"x" + i} aria-hidden="true" />;
          const off = d < today || dates.isDisabled(d);
          const on = !!dates.selected && isSameDay(d, dates.selected);
          return (
            <button
              key={d.getDate()}
              type="button"
              role="gridcell"
              className={"bw-day" + (on ? " is-on" : "") + (isSameDay(d, today) ? " is-today" : "")}
              disabled={off}
              aria-selected={on}
              aria-label={format(d, "EEEE, d MMMM yyyy")}
              onClick={() => dates.onSelect(d)}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Steps({ labels, step }: { labels: string[]; step: number }) {
  return (
    <ol className="bw-steps">
      {labels.map((label, i) => (
        <li key={label} className={i === step ? "is-current" : i < step ? "is-done" : ""}>
          <span className="bw-steps__num">{i < step ? <Check aria-hidden="true" /> : i + 1}</span>
          <span className="bw-steps__label">{label}</span>
        </li>
      ))}
    </ol>
  );
}

function EditButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="bw-review__edit" onClick={onClick} aria-label={label}>
      <Pencil aria-hidden="true" />
      Edit
    </button>
  );
}

export default function BookingWizard({ pax, options, stepIssue, note, closed, dates, total, travellers, issue, onBook, bookLabel = "Book now", dateTitle = "Choose your travel date", review }: Props) {
  const trip = useTripSummary();
  const place = usePdpPlace();
  const [open, setOpen] = useState(false);
  const hasFirst = !!pax || !!options;
  const dateStep = hasFirst ? 1 : 0;
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onOpen = (e: Event) => {
      e.preventDefault();
      setStep(0);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prevRoot = root.style.overflow;
    const prev = document.body.style.overflow;
    root.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      root.style.overflow = prevRoot;
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [step]);

  const today = useMemo(() => startOfDay(new Date()), []);
  const months = useMemo(() => {
    const out: Date[] = [];
    let m = startOfMonth(dates.fromMonth < today ? today : dates.fromMonth);
    const last = startOfMonth(dates.toMonth);
    while (m <= last && out.length < 18) {
      out.push(m);
      m = addMonths(m, 1);
    }
    return out;
  }, [dates.fromMonth, dates.toMonth, today]);

  const hasOpenDate = useMemo(() => {
    if (!open || dates.loading) return true;
    for (const m of months) {
      const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= days; i++) {
        const d = new Date(m.getFullYear(), m.getMonth(), i);
        if (d >= today && !dates.isDisabled(d)) return true;
      }
    }
    return false;
  }, [open, dates, months, today]);

  if (!mounted || !open) return null;

  const onDateStep = !closed && step === dateStep;
  const onReview = !closed && step === dateStep + 1;
  const noDates = onDateStep && !dates.loading && !hasOpenDate;
  const stepLabels = closed ? ["Prices"] : [...(hasFirst ? ["Travellers"] : []), "Travel date", "Review"];
  const title = closed
    ? "Prices coming soon"
    : noDates
      ? "No dates available right now"
      : onReview
        ? "Review your booking"
        : onDateStep
          ? dateTitle
          : "Who's travelling?";
  const subtitle = closed
    ? ""
    : noDates
      ? "This holiday has no open travel dates at the moment. Please check our other packages."
      : onReview
        ? "Check your details before checkout. Tap Edit to change anything."
        : onDateStep
          ? "Pick the day your holiday starts. Unavailable dates are greyed out."
          : "Tell us who's coming and choose any extras for your trip.";
  const travellerLines = review?.travellers.length ? review.travellers : [`${travellers} traveller${travellers === 1 ? "" : "s"}`];
  const close = () => setOpen(false);
  const finish = () => {
    if (issue && hasFirst) setStep(0);
    else {
      close();
      onBook();
    }
  };

  const primary = closed ? (
    <button type="button" className="ex-btn ex-btn--dark bw-go" onClick={close}>
      Close
    </button>
  ) : onReview ? (
    <button type="button" className="ex-btn ex-btn--dark bw-go" disabled={!dates.selected} onClick={finish}>
      {issue && hasFirst ? "Review travellers" : bookLabel}
    </button>
  ) : onDateStep ? (
    <button type="button" className="ex-btn ex-btn--dark bw-go" disabled={!dates.selected || noDates} onClick={() => setStep(step + 1)}>
      Continue
    </button>
  ) : (
    <button type="button" className="ex-btn ex-btn--dark bw-go" disabled={!!stepIssue} onClick={() => setStep(step + 1)}>
      Continue
    </button>
  );

  const back =
    step > 0 ? (
      <button type="button" className="bw-back" onClick={() => setStep(step - 1)}>
        Go back
      </button>
    ) : null;

  return createPortal(
    <div className={"desert-ember ex bw-root " + EX_FONTS}>
      <div className="bw-overlay">
        <div className="bw" role="dialog" aria-modal="true" aria-labelledby="bw-title" onClick={(e) => e.stopPropagation()}>
          <div className="bw-main">
            <div className="bw-top">
              <Steps labels={stepLabels} step={closed ? 0 : step} />
              {back ? <div className="bw-top__actions">{back}</div> : null}
            </div>

            <div className="bw-body" ref={body}>
              <h2 className="bw-title" id="bw-title">
                {title}
              </h2>
              {subtitle ? <p className="bw-sub">{subtitle}</p> : null}

              {closed ? (
                <div className="bw-closed">{closed}</div>
              ) : onReview ? (
                <div className="bw-review">
                  {hasFirst ? (
                    <section className="bw-review__card">
                      <div className="bw-review__head">
                        <h3>Travellers</h3>
                        <EditButton label="Edit travellers" onClick={() => setStep(0)} />
                      </div>
                      <ul className="bw-review__list">
                        {travellerLines.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                      {review?.extras.length ? (
                        <ul className="bw-review__list bw-review__list--soft">
                          {review.extras.map((x) => (
                            <li key={x}>{x}</li>
                          ))}
                        </ul>
                      ) : null}
                    </section>
                  ) : null}
                  <section className="bw-review__card">
                    <div className="bw-review__head">
                      <h3>Travel date</h3>
                      <EditButton label="Edit travel date" onClick={() => setStep(dateStep)} />
                    </div>
                    <p className="bw-review__value">{dates.selected ? format(dates.selected, "EEEE, d MMMM yyyy") : "Date not chosen yet"}</p>
                  </section>
                  {review?.lines.length ? (
                    <section className="bw-review__card">
                      <div className="bw-review__head">
                        <h3>Price</h3>
                      </div>
                      <dl className="bw-review__price">
                        {review.lines.map((l) => (
                          <div key={l.label}>
                            <dt>{l.label}</dt>
                            <dd>{money(l.amount)}</dd>
                          </div>
                        ))}
                        <div className="bw-review__total">
                          <dt>Total</dt>
                          <dd>{total > 0 ? money(total) : "—"}</dd>
                        </div>
                      </dl>
                    </section>
                  ) : null}
                  {issue ? <p className="bw-issue">{issue}</p> : null}
                </div>
              ) : !onDateStep ? (
                <>
                  {pax ? (
                    <div className="bw-pax">
                      {pax.locked ? <p className="bw-note-box">{pax.locked}</p> : null}
                      {pax.rows.map((r) => {
                        const [age, price] = (r.hint ?? "").split(" · ");
                        return (
                          <div className={"bw-pax__row" + (r.value > 0 ? " is-on" : "")} key={r.id}>
                            <div className="bw-pax__label">
                              <b>{r.label}</b>
                              <small>{[age, price ? `${price} each` : ""].filter(Boolean).join(" · ")}</small>
                            </div>
                            <div className="bw-counter">
                              <button type="button" disabled={!!pax.locked || r.value <= r.min} onClick={() => pax.onStep(r.id, -1)} aria-label={`Fewer ${r.label.toLowerCase()}s`}>
                                <Minus aria-hidden="true" />
                              </button>
                              <span aria-live="polite">{r.value}</span>
                              <button type="button" disabled={!!pax.locked || (r.max != null && r.value >= r.max)} onClick={() => pax.onStep(r.id, 1)} aria-label={`More ${r.label.toLowerCase()}s`}>
                                <Plus aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                  {options ? (
                    <div className="bw-options">
                      <h3 className="bw-options__title">Personalise your trip</h3>
                      <div className="at-site desert-ember">{options}</div>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="bw-cal">
                  {dates.loading ? (
                    <p className="bw-loading">Loading dates…</p>
                  ) : noDates ? (
                    <div className="bw-empty">
                      <span className="bw-empty__icon" aria-hidden="true">
                        <CalendarX2 />
                      </span>
                      <p>New dates are added often, so do check back soon.</p>
                      <div className="bw-empty__actions">
                        <Link href={place.typeHref} className="ex-btn ex-btn--dark bw-go" onClick={close}>
                          See other {place.typeLabel}
                        </Link>
                        <Link href="/holidays" className="bw-back" onClick={close}>
                          All holidays
                        </Link>
                      </div>
                    </div>
                  ) : (
                    months.map((m) => <Month key={m.getTime()} month={m} dates={dates} today={today} />)
                  )}
                </div>
              )}
            </div>

            <div className="bw-phonebar">
              <div className="bw-phonebar__total">
                <small>Total</small>
                <b>{total > 0 ? money(total) : "—"}</b>
              </div>
              <div className="bw-phonebar__actions">
                {back}
                {primary}
              </div>
            </div>
          </div>

          <button type="button" className="bw-close" onClick={close} aria-label="Close">
            <X aria-hidden="true" />
          </button>

          <aside className="bw-aside">
            {trip ? (
              <div className="bw-trip">
                {trip.image ? <img className="bw-trip__img" {...responsiveImage(trip.image, "(max-width: 767px) 100vw, 420px", 828)} alt="" /> : null}
                <span className="bw-trip__shade" aria-hidden="true" />
                <div className="bw-trip__body">
                  <span className="ex-badge ex-badge--peach">
                    <Sparkles aria-hidden="true" />
                    <span>
                      Aapka <em>{trip.badge || "Holiday"}</em>
                    </span>
                  </span>
                  <div>
                    <p className="bw-trip__name">{trip.name}</p>
                    <p className="bw-trip__sub">{trip.sub}</p>
                  </div>
                  <div className="bw-trip__facts">
                    <p>
                      <CalendarDays aria-hidden="true" />
                      {dates.selected ? format(dates.selected, "EEE, d MMM yyyy") : "Date not chosen yet"}
                    </p>
                    <p>
                      <Users aria-hidden="true" />
                      {travellers} traveller{travellers === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="bw-sum">
              {trip?.from?.now != null ? (
                <div className="bw-sum__row">
                  <span>Price per {trip.from.basis.replace(/^.*per\s*/i, "") || "person"}</span>
                  <span>
                    {trip.from.strike && trip.from.strike > trip.from.now ? <s>{money(trip.from.strike)}</s> : null} {money(trip.from.now)}
                  </span>
                </div>
              ) : null}
              <div className="bw-sum__row">
                <span>Travellers</span>
                <span>{travellers}</span>
              </div>
              <div className="bw-sum__total">
                <span>Total</span>
                <b>{total > 0 ? money(total) : "—"}</b>
              </div>
              {issue && dates.selected ? <p className="bw-issue">{issue}</p> : stepIssue && !onDateStep && !onReview ? <p className="bw-issue">{stepIssue}</p> : note ? <div className="bw-note">{note}</div> : null}
              <p className="bw-lock">
                <Lock aria-hidden="true" />
                Secure payment at checkout
              </p>
            </div>
            <div className="bw-aside__cta">{primary}</div>
          </aside>
        </div>
      </div>
    </div>,
    document.body,
  );
}

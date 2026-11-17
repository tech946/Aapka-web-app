'use client';

import { useState, type InputHTMLAttributes, type ReactNode } from 'react';
import Image from 'next/image';
import { AlertCircle, Eye, EyeOff, Loader2, type LucideIcon } from 'lucide-react';
import { EX_FONTS } from '@/app/(marketing)/Home/ex/fonts';
import '@/app/(marketing)/Home/ex/ex.css';
import './auth-shell.css';

export type AuthPerk = {
  icon: LucideIcon;
  title: string;
  text: string;
};

export function AuthShell({
  kicker,
  title,
  text,
  image,
  perksTitle,
  perks,
  cardTitle,
  cardText,
  children,
}: {
  kicker: string;
  title: string;
  text: string;
  image: string;
  perksTitle: string;
  perks: AuthPerk[];
  cardTitle: string;
  cardText?: string;
  children: ReactNode;
}) {
  return (
    <div className={'desert-ember ex ' + EX_FONTS}>
      <main className="xa">
        <div className="xa-band" aria-hidden="true">
          <Image className="xa-band__img" src={image} alt="" fill priority sizes="100vw" />
        </div>
        <div className="xa-wrap">
          <div className="xa-grid">
            <div className="xa-main">
              <div className="xa-intro">
                <p className="xa-kicker">{kicker}</p>
                <h1>{title}</h1>
                <p className="xa-lead">{text}</p>
              </div>
              <section className="xa-perks" aria-labelledby="xa-perks-title">
                <h2 id="xa-perks-title">{perksTitle}</h2>
                <ul>
                  {perks.map((p) => (
                    <li key={p.title}>
                      <span className="xa-perks__icon">
                        <p.icon aria-hidden="true" />
                      </span>
                      <span>
                        <b>{p.title}</b>
                        {p.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
            <section className="xa-card" aria-labelledby="xa-card-title">
              <h2 id="xa-card-title">{cardTitle}</h2>
              {cardText ? <p className="xa-card__sub">{cardText}</p> : null}
              {children}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export function AuthField({ label, ...input }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="xa-field">
      <span>{label}</span>
      <input {...input} />
    </label>
  );
}

export function AuthPassword({ label, ...input }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <label className="xa-field">
      <span>{label}</span>
      <span className="xa-field__pw">
        <input {...input} type={show ? 'text' : 'password'} />
        <button
          type="button"
          className="xa-field__eye"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Hide password' : 'Show password'}
          disabled={input.disabled}
        >
          {show ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </span>
    </label>
  );
}

export function AuthError({ children }: { children: ReactNode }) {
  return (
    <p className="xa-error" role="alert">
      <AlertCircle aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export function AuthSubmit({ busy, label, busyLabel }: { busy: boolean; label: string; busyLabel: string }) {
  return (
    <button type="submit" className="xa-btn" disabled={busy}>
      {busy ? <Loader2 className="xa-spin" aria-hidden="true" /> : null}
      {busy ? busyLabel : label}
    </button>
  );
}

import posthog from 'posthog-js';
import { isWebsitePath } from '@/lib/posthog-paths';

let started = false;
let paused = false;

function uiHostFor(apiHost: string): string {
  return apiHost.replace(/\/$/, '').replace('.i.posthog.com', '.posthog.com');
}

export function startPostHog(key: string, apiHost: string): void {
  if (started || typeof window === 'undefined' || !key) return;
  started = true;

  posthog.init(key, {
    api_host: '/ingest',
    ui_host: uiHostFor(apiHost),
    defaults: '2026-08-30',
    person_profiles: 'identified_only',
    capture_pageview: 'history_change',
    capture_pageleave: true,
    before_send: (event) => (event && isWebsitePath(window.location.pathname) ? event : null),
    session_recording: {
      maskAllInputs: false,
      maskInputOptions: { password: true },
    },
  });
}

export function pausePostHog(): void {
  if (!started || paused) return;
  paused = true;
  posthog.stopSessionRecording();
}

export function resumePostHog(): void {
  if (!started || !paused) return;
  paused = false;
  posthog.startSessionRecording();
}

export function capturePostHogEvent(event: string, properties?: Record<string, unknown>): void {
  if (!started) return;
  posthog.capture(event, properties);
}

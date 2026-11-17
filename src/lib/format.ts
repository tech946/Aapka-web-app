const dateFormat = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(value: string | null | undefined, fallback = '—'): string {
  return value ? dateFormat.format(new Date(value)) : fallback;
}

export function formatDateTime(value: string | null | undefined, fallback = '—'): string {
  return value ? dateTimeFormat.format(new Date(value)) : fallback;
}

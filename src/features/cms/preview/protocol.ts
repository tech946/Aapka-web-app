export const CMS_STUDIO_PATH = '/dashboard/cms';

export const CMS_ATTR = {
  section: 'data-cms-section',
  label: 'data-cms-label',
  field: 'data-cms-field',
  html: 'data-cms-html',
  listClass: 'data-cms-list-class',
} as const;

const SOURCE = 'aapka-cms';

export type FrameMessage =
  | { type: 'ready'; path: string; sections: string[]; fields: string[] }
  | { type: 'select'; section: string };

export type StudioMessage =
  | { type: 'patch'; patches: { field: string; value: string }[] }
  | { type: 'highlight'; section: string | null }
  | { type: 'inspect'; on: boolean };

type Message = FrameMessage | StudioMessage;

export function post<T extends Message>(target: Window, message: T): void {
  target.postMessage({ ...message, source: SOURCE }, window.location.origin);
}

export function readMessage<T extends Message>(event: MessageEvent): T | null {
  if (event.origin !== window.location.origin) return null;
  const data: unknown = event.data;
  if (!data || typeof data !== 'object') return null;
  const { source, type } = data as { source?: unknown; type?: unknown };
  return source === SOURCE && typeof type === 'string' ? (data as T) : null;
}

export function afterLoad(run: () => void): () => void {
  if (document.readyState === 'complete') {
    run();
    return () => {};
  }
  window.addEventListener('load', run, { once: true });
  return () => window.removeEventListener('load', run);
}

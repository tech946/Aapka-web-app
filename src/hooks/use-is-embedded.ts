'use client';

import { useEffect, useState } from 'react';

export function useIsEmbedded(): boolean {
  const [embedded, setEmbedded] = useState(false);
  useEffect(() => setEmbedded(window.self !== window.top), []);
  return embedded;
}

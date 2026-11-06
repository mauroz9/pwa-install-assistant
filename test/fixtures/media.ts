/** Replace `window.matchMedia` with one that matches the given features (e.g. "standalone", "landscape"). */
export function stubMedia(...features: string[]): () => void {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) => ({
    media: query,
    matches: features.some((f) => query.includes(f)),
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
}

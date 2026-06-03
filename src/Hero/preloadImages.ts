import { CARD_PAIRS } from './cardImages';

/** Front faces only — backs load on hover. */
export function getCardFrontUrls(): readonly string[] {
  return CARD_PAIRS.map((p) => p.front);
}

/**
 * Decode all carousel front images; resolves even if an individual URL fails.
 */
export function preloadCardFronts(
  onProgress?: (percent: number) => void,
): Promise<void> {
  const urls = getCardFrontUrls();
  if (urls.length === 0) {
    onProgress?.(100);
    return Promise.resolve();
  }

  let loaded = 0;
  const bump = () => {
    loaded += 1;
    onProgress?.(Math.min(100, Math.round((loaded / urls.length) * 100)));
  };

  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          const done = () => {
            bump();
            resolve();
          };
          img.onload = done;
          img.onerror = done;
          img.src = url;
        }),
    ),
  ).then(() => undefined);
}

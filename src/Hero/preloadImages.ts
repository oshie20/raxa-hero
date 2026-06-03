import { CARD_PAIRS } from './cardImages';

/** Front faces only. */
export function getCardFrontUrls(): readonly string[] {
  return CARD_PAIRS.map((p) => p.front);
}

/** Every carousel asset (front + back layers) for the preloader. */
export function getAllCarouselImageUrls(): readonly string[] {
  const urls: string[] = [];
  for (const pair of CARD_PAIRS) {
    urls.push(pair.front);
    if (typeof pair.back === 'string') {
      urls.push(pair.back);
    } else {
      for (const layer of pair.back) urls.push(layer.src);
    }
  }
  return urls;
}

/**
 * Decode carousel images; resolves even if an individual URL fails.
 */
export function preloadCarouselImages(
  urls: readonly string[],
  onProgress?: (percent: number) => void,
): Promise<void> {
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
          img.onload = () => {
            void img.decode().finally(done);
          };
          img.onerror = done;
          img.src = url;
        }),
    ),
  ).then(() => undefined);
}

/** @deprecated Use preloadCarouselImages(getAllCarouselImageUrls()). */
export function preloadCardFronts(
  onProgress?: (percent: number) => void,
): Promise<void> {
  return preloadCarouselImages(getCardFrontUrls(), onProgress);
}

/** Front + back faces — use before revealing the hero. */
export function preloadAllCarouselImages(
  onProgress?: (percent: number) => void,
): Promise<void> {
  return preloadCarouselImages(getAllCarouselImageUrls(), onProgress);
}

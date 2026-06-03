import card1 from './assets/card1.webp';
import card2 from './assets/card2.webp';
import card3 from './assets/card3.webp';
import card4 from './assets/card4.webp';
import card5 from './assets/card5.webp';
import card6 from './assets/card6.webp';
import card7 from './assets/card7.webp';

import card1Back from './assets/card1-back.webp';
import card2Back0 from './assets/card2-back-0.webp';
import card2Back1 from './assets/card2-back-1.webp';
import card3Back from './assets/card3-back.webp';
import card4Back from './assets/card4-back.webp';
import card5Back0 from './assets/card5-back-0.webp';
import card5Back1 from './assets/card5-back-1.webp';
import card6Back0 from './assets/card6-back-0.webp';
import card6Back1 from './assets/card6-back-1.webp';
import card7Back0 from './assets/card7-back-0.webp';
import card7Back1 from './assets/card7-back-1.webp';

export interface CardBackLayer {
  src: string;
  /** Optional extra class on the back-layer img (e.g. Figma crop). */
  className?: string;
}

export interface CardPair {
  front: string;
  back: string | readonly CardBackLayer[];
}

/** Front (carousel) + back (Figma hover flip), in carousel order. */
export const CARD_PAIRS: readonly CardPair[] = [
  { front: card1, back: card1Back },
  {
    front: card2,
    back: [
      { src: card2Back0 },
      { src: card2Back1 },
    ],
  },
  { front: card3, back: card3Back },
  { front: card4, back: card4Back },
  {
    front: card5,
    back: [
      { src: card5Back0 },
      { src: card5Back1 },
    ],
  },
  {
    front: card6,
    back: [
      { src: card6Back0 },
      { src: card6Back1 },
    ],
  },
  {
    front: card7,
    back: [
      { src: card7Back0 },
      { src: card7Back1 },
    ],
  },
];

/** @deprecated Use CARD_PAIRS — kept for any external references. */
export const CARD_IMAGES: readonly string[] = CARD_PAIRS.map((p) => p.front);

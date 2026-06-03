import { type GeoConfig, type CardShape, shape, GEO_DESKTOP, GEO_MOBILE } from './geometry';
import { type CardPair, CARD_PAIRS } from './cardImages';

const SIDE    = 5;
const VISIBLE = SIDE * 2 + 1; // 11 DOM nodes
const MAX_BACK_LAYERS = 2;

/** Cached transform string buffer — avoids per-frame string allocation overhead. */
const _transformParts = new Array<string>(4);

function buildTransform(s: CardShape): string {
  _transformParts[0] = `translateX(${s.x}px)`;
  _transformParts[1] = `translateZ(${s.z}px)`;
  _transformParts[2] = `rotateY(${s.rot}deg)`;
  _transformParts[3] = `scale(${s.scale})`;
  return _transformParts.join(' ');
}

interface CardNode {
  el: HTMLDivElement;
  frontImg: HTMLImageElement;
  backImgs: HTMLImageElement[];
  lastImgIdx: number;
}

export class CarouselEngine {
  private readonly container: HTMLElement;
  private readonly track: HTMLDivElement;
  private readonly cards: CardNode[] = [];
  private readonly pairs: readonly CardPair[] = CARD_PAIRS;
  private geo: GeoConfig = GEO_DESKTOP;

  private offset = 0;
  private readonly speed = 0.0042; // constant infinite scroll

  private rafId  = 0;
  private lastTs = 0;
  private running = false;

  private readonly prefersReducedMotion: boolean;
  private readonly resizeHandler: () => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.prefersReducedMotion =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.track = document.createElement('div');
    this.track.className = 'cards-track';
    this.container.appendChild(this.track);

    this.buildCardNodes();

    this.resizeHandler = () => {
      this.computeGeo();
      if (this.prefersReducedMotion) this.render();
    };
    window.addEventListener('resize', this.resizeHandler, { passive: true });

    this.computeGeo();
    this.render(); // first static paint before start()
  }

  private buildCardNodes(): void {
    for (let k = 0; k < VISIBLE; k++) {
      const el = document.createElement('div');
      el.className = 'card';

      const flip = document.createElement('div');
      flip.className = 'card-flip';

      const frontFace = document.createElement('div');
      frontFace.className = 'card-face card-face--front';
      const frontImg = document.createElement('img');
      frontImg.alt = '';
      frontImg.draggable = false;
      frontFace.appendChild(frontImg);

      const backFace = document.createElement('div');
      backFace.className = 'card-face card-face--back';

      const backImgs: HTMLImageElement[] = [];
      for (let i = 0; i < MAX_BACK_LAYERS; i++) {
        const img = document.createElement('img');
        img.alt = '';
        img.draggable = false;
        img.className = 'card-back-layer';
        img.hidden = true;
        backFace.appendChild(img);
        backImgs.push(img);
      }

      flip.appendChild(frontFace);
      flip.appendChild(backFace);
      el.appendChild(flip);

      this.track.appendChild(el);
      this.cards.push({ el, frontImg, backImgs, lastImgIdx: -1 });
    }
  }

  private assignPair(card: CardNode, imgIdx: number): void {
    const pair = this.pairs[imgIdx];
    card.frontImg.src = pair.front;

    const back = pair.back;
    if (typeof back === 'string') {
      card.backImgs[0].src = back;
      card.backImgs[0].className = 'card-back-layer';
      card.backImgs[0].hidden = false;
      card.backImgs[1].hidden = true;
      card.backImgs[1].removeAttribute('src');
    } else {
      for (let i = 0; i < MAX_BACK_LAYERS; i++) {
        const layer = back[i];
        const img = card.backImgs[i];
        if (layer) {
          img.src = layer.src;
          img.className = layer.className
            ? `card-back-layer ${layer.className}`
            : 'card-back-layer';
          img.hidden = false;
        } else {
          img.hidden = true;
          img.removeAttribute('src');
        }
      }
    }
  }

  private computeGeo(): void {
    this.geo = window.innerWidth <= 640 ? { ...GEO_MOBILE } : { ...GEO_DESKTOP };
    const { cardW, cardH, stageH } = this.geo;
    this.container.style.setProperty('--card-w', `${cardW}px`);
    this.container.style.setProperty('--card-h', `${cardH}px`);
    this.container.style.setProperty('--stage-h', `${stageH}px`);
  }

  render(): void {
    const N    = this.pairs.length;
    const base = Math.round(this.offset);
    const frac = this.offset - base;

    for (let k = 0; k < VISIBLE; k++) {
      const slotIndex = k - SIDE;
      const imgIdx    = (((base + slotIndex) % N) + N) % N;
      const card      = this.cards[k];

      if (imgIdx !== card.lastImgIdx) {
        this.assignPair(card, imgIdx);
        card.lastImgIdx = imgIdx;
      }

      const s = shape(slotIndex - frac, this.geo);

      card.el.style.opacity   = String(s.op);
      card.el.style.zIndex    = String(200 - Math.round(s.a * 10));
      card.el.style.transform = buildTransform(s);
    }
  }

  private tick = (ts: number): void => {
    if (this.lastTs === 0) this.lastTs = ts;
    const dt   = (ts - this.lastTs) / 16.67; // normalise to ~60 fps
    this.lastTs = ts;

    this.offset += this.speed * dt;

    this.render();
    this.rafId = requestAnimationFrame(this.tick);
  };

  start(): void {
    if (this.prefersReducedMotion || this.running) return;
    this.running = true;
    this.lastTs  = 0;
    this.rafId   = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  resize(): void {
    this.computeGeo();
  }

  destroy(): void {
    this.stop();
    window.removeEventListener('resize', this.resizeHandler);
    this.track.remove();
  }
}

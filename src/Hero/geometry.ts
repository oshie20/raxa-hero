export interface GeoConfig {
  cardW: number;
  cardH: number;
  /** Constant visual gap between the scaled edges of adjacent cards. */
  gutter: number;
  stageH: number;
  maxRot: number;
  /** Rotation curve exponent — lower = more tilt at the edges vs center. */
  rotPower: number;
  centerScale: number;
  edgeScale: number;
  span: number;
  /** Extra gutter applied toward the edges to offset rotation/perspective crowding. */
  edgeGutterBoost: number;
}

export interface CardShape {
  x: number;
  z: number;
  rot: number;
  scale: number;
  op: number;
  a: number;
  t: number;
}

/**
 * Normalised growth factor 0 (center) .. 1 (edge) for a given |slot|.
 * Raised-cosine ease — finite curvature at the center, so cards glide through
 * the middle with no snap/bounce.
 */
function growth(u: number, g: GeoConfig): number {
  const t = Math.min(u, g.span) / g.span;
  return (1 - Math.cos(Math.PI * t)) / 2;
}

/** Card scale at a given |slot| distance from center. */
function scaleAt(u: number, g: GeoConfig): number {
  return g.centerScale + (g.edgeScale - g.centerScale) * growth(u, g);
}

/**
 * Cumulative horizontal position for a (possibly fractional) signed slot.
 * Integrates each card's scaled width + gutter so the gap between neighbours
 * stays visually constant regardless of how big each card is.
 */
function positionAt(slot: number, g: GeoConfig): number {
  const sign = slot < 0 ? -1 : 1;
  const u = Math.abs(slot);

  const STEP = 0.1;
  let x = 0;
  let v = 0;
  while (v < u) {
    const seg = Math.min(STEP, u - v);
    const mid = v + seg / 2;
    const gutter = g.gutter * (1 + g.edgeGutterBoost * growth(mid, g));
    x += (scaleAt(mid, g) * g.cardW + gutter) * seg;
    v += seg;
  }
  return sign * x;
}

/**
 * 3D fan — small upright center, larger inward-tilted cards toward the edges.
 */
export function shape(slot: number, g: GeoConfig): CardShape {
  const a   = Math.abs(slot);
  const dir = slot < 0 ? 1 : -1;
  const e   = growth(a, g);
  const rotE = Math.pow(e, g.rotPower);

  return {
    x:     positionAt(slot, g),
    z:     0,
    rot:   dir * g.maxRot * rotE,
    scale: scaleAt(a, g),
    op:    1,
    a,
    t:     e,
  };
}

export const GEO_DESKTOP: GeoConfig = {
  cardW: 190,
  cardH: 300,
  gutter: 22,
  stageH: 520,
  maxRot: 48,
  rotPower: 0.62,
  centerScale: 0.72,
  edgeScale: 1.38,
  span: 4,
  edgeGutterBoost: 3.4,
};

export const GEO_MOBILE: GeoConfig = {
  cardW: 120,
  cardH: 200,
  gutter: 14,
  stageH: 360,
  maxRot: 44,
  rotPower: 0.62,
  centerScale: 0.76,
  edgeScale: 1.3,
  span: 4,
  edgeGutterBoost: 3.4,
};

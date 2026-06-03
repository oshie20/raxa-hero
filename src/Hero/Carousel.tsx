import { useEffect, useRef } from 'react';
import { CarouselEngine } from './carouselEngine';

interface CarouselProps {
  started: boolean;
}

export function Carousel({ started }: CarouselProps) {
  const wrapRef   = useRef<HTMLDivElement>(null);
  const engineRef = useRef<CarouselEngine | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const engine    = new CarouselEngine(el);
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (started) {
      engineRef.current?.start();
    }
  }, [started]);

  // The .cards-wrap class is a global class (carousel.css) picked up by the engine
  return <div ref={wrapRef} className="cards-wrap" />;
}

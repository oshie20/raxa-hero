import { useEffect, useRef, useState } from 'react';
import styles from './Preloader.module.css';
import { preloadCardFronts } from './preloadImages';

interface PreloaderProps {
  onComplete: () => void;
}

type Phase = 'counting' | 'fading' | 'done';

/** Minimum time the counter animation runs before fade-out. */
const PRELOADER_DURATION_MS = 3000;

export function Preloader({ onComplete }: PreloaderProps) {
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<Phase>('counting');
  const tidRef            = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef     = useRef(onComplete);
  onCompleteRef.current   = onComplete;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.height   = '100vh';

    const prefersReduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let cancelled = false;
    let imagesReady = false;
    let animationDone = false;
    const startedAt = performance.now();

    function finishLoad() {
      setPhase('fading');
      tidRef.current = setTimeout(() => {
        document.body.style.overflow = '';
        document.body.style.height   = '';
        setPhase('done');
        onCompleteRef.current();
      }, 650);
    }

    function tryFinish() {
      if (cancelled || !imagesReady || !animationDone) return;
      tidRef.current = setTimeout(finishLoad, 420);
    }

    preloadCardFronts().then(() => {
      if (cancelled) return;
      imagesReady = true;
      tryFinish();
    });

    if (prefersReduced) {
      tidRef.current = setTimeout(() => {
        if (cancelled) return;
        setCount(100);
        animationDone = true;
        imagesReady = true;
        tryFinish();
      }, PRELOADER_DURATION_MS);
      return () => {
        cancelled = true;
        teardown();
      };
    }

    const nRef = { value: 0 };

    function step() {
      if (cancelled) return;

      const elapsed = performance.now() - startedAt;
      const timeCap = Math.min(
        animationDone ? 100 : 99,
        (elapsed / PRELOADER_DURATION_MS) * 100,
      );

      const n   = nRef.value;
      const inc = n < 70
        ? 2 + Math.random() * 5
        : 0.6 + Math.random() * 1.8;
      nRef.value = Math.min(timeCap, n + inc);
      setCount(Math.floor(nRef.value));

      if (elapsed >= PRELOADER_DURATION_MS) {
        animationDone = true;
        nRef.value = 100;
        setCount(100);
        tryFinish();
        return;
      }

      tidRef.current = setTimeout(step, nRef.value < 70 ? 55 : 95);
    }

    tidRef.current = setTimeout(step, 80);

    return () => {
      cancelled = true;
      teardown();
    };

    function teardown() {
      if (tidRef.current) clearTimeout(tidRef.current);
      document.body.style.overflow = '';
      document.body.style.height   = '';
    }
  }, []);

  if (phase === 'done') return null;

  return (
    <div
      className={`${styles.preloader} ${phase === 'fading' ? styles.fading : ''}`}
      aria-hidden="true"
    >
      <div className={styles.counter}>
        <span className={styles.number}>{count}</span>
        <span className={styles.percent}>%</span>
      </div>

      <div className={styles.progressTrack}>
        <div
          className={styles.progressFill}
          style={{ width: `${count}%` }}
        />
      </div>
    </div>
  );
}

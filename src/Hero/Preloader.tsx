import { useEffect, useRef, useState } from 'react';
import styles from './Preloader.module.css';

interface PreloaderProps {
  onComplete: () => void;
}

type Phase = 'counting' | 'fading' | 'done';

export function Preloader({ onComplete }: PreloaderProps) {
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<Phase>('counting');
  const tidRef            = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Stable ref so timeout closure always sees the latest callback.
  const onCompleteRef     = useRef(onComplete);
  onCompleteRef.current   = onComplete;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.height   = '100vh';

    const prefersReduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function finishLoad() {
      setPhase('fading');
      tidRef.current = setTimeout(() => {
        document.body.style.overflow = '';
        document.body.style.height   = '';
        setPhase('done');
        onCompleteRef.current();
      }, 650);
    }

    if (prefersReduced) {
      setCount(100);
      tidRef.current = setTimeout(finishLoad, 200);
      return teardown;
    }

    const nRef = { value: 0 };

    function step() {
      const n   = nRef.value;
      const inc = n < 70
        ? 2 + Math.random() * 5
        : 0.6 + Math.random() * 1.8;
      nRef.value = Math.min(100, n + inc);
      setCount(Math.floor(nRef.value));

      if (nRef.value < 100) {
        tidRef.current = setTimeout(step, nRef.value < 70 ? 55 : 95);
      } else {
        tidRef.current = setTimeout(finishLoad, 420);
      }
    }

    tidRef.current = setTimeout(step, 80);
    return teardown;

    function teardown() {
      if (tidRef.current) clearTimeout(tidRef.current);
      document.body.style.overflow = '';
      document.body.style.height   = '';
    }
  }, []); // runs once on mount

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

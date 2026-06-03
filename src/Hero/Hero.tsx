import { useState } from 'react';
import styles from './Hero.module.css';
import { Preloader } from './Preloader';
import { HeadingReveal } from './HeadingReveal';
import { Carousel } from './Carousel';

function BoltIcon() {
  return (
    <svg
      className={styles.bolt}
      width="23"
      height="36"
      viewBox="0 0 23 36"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M13.5 1L1 20.5H11.5L9.5 35L22 15.5H11.5L13.5 1Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CtaButton() {
  return (
    <button className={styles.cta} type="button">
      Generate Cards
    </button>
  );
}

export function Hero() {
  const [revealed, setRevealed]           = useState(false);
  const [carouselStarted, setCarouselStarted] = useState(false);

  function handleLoadComplete() {
    setRevealed(true);
    setCarouselStarted(true);
  }

  return (
    <>
      <Preloader onComplete={handleLoadComplete} />

      <section className={styles.hero}>
        {/* z=0 — atmospheric background layers */}
        <div className={styles.glow} aria-hidden="true" />
        <div className={styles.grain} aria-hidden="true" />

        {/* z=1 — frame decoration */}
        <div className={styles.frame} aria-hidden="true">
          <div className={styles.frameLine} />
          <span className={`${styles.dot} ${styles.dotTL}`} />
          <span className={`${styles.dot} ${styles.dotTR}`} />
        </div>

        {/* z=3 — hero content */}
        <div className={`${styles.heroInner} ${revealed ? styles.revealed : ''}`}>
          <BoltIcon />

          <div className={`t-stagger ${revealed ? 'is-shown' : ''}`}>
            <HeadingReveal />

            <p className={`${styles.subhead} t-stagger-line t-stagger-line--2`}>
              We enhance businesses' ability to boost customer engagement through
              the integration of personalized and interactive elements into their
              videos.
            </p>
          </div>

          <CtaButton />
        </div>

        {/* z=2 — carousel */}
        <div className={styles.cardsSection}>
          <Carousel started={carouselStarted} />
        </div>
      </section>
    </>
  );
}

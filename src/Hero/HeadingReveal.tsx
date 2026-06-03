import styles from './HeadingReveal.module.css';

export function HeadingReveal() {
  return (
    <h1 className={styles.headline}>
      <strong className="t-stagger-line t-stagger-line--1">
        <span className={`${styles.line} ${styles.lineTitle}`}>
          A <span className={styles.boxed}>CREATIVE</span> Video Creation Agency
        </span>
        <span className={styles.line}>That drives engagement</span>
      </strong>
    </h1>
  );
}

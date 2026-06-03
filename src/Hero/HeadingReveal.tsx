import styles from './HeadingReveal.module.css';

export function HeadingReveal() {
  return (
    <h1 className={styles.headline}>
      <strong className="t-stagger-line t-stagger-line--1">
        A <span className={styles.boxed}>CREATIVE</span> Video Creation Agency
        <br />
        That drives engagement
      </strong>
    </h1>
  );
}

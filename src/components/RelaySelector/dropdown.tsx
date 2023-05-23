import styles from './dropdown.module.scss';

export const dropdownRender = (menu: React.ReactNode) => (
  <div className={styles.root}>
    <div className={styles.relayModeTitle}>Relay Mode</div>

    <div className={styles.dropdownContent}>{menu}</div>

    <div style={{ padding: '8px', borderTop: '1px solid #e8e8e8' }}>
      <div className={styles.borderOption}>Display benchmark</div>
      <div>
        <a href="#">About Relay Mode</a>
      </div>
      <div>
        <a href="/relay">Manage Relays..</a>
      </div>
    </div>
  </div>
);

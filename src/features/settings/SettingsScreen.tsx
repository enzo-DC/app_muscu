import { useLiveQuery } from 'dexie-react-hooks';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import fieldStyles from '../../components/Field.module.css';
import { Screen } from '../../components/Screen';
import { Stepper } from '../../components/Stepper';
import { getSettings, MAX_REST_SECONDS, MIN_REST_SECONDS, updateSettings } from '../../db/settings';
import { formatNumber, formatTimer } from '../../lib/format';
import { t } from '../../lib/strings';
import { BackupSection } from './BackupSection';
import styles from './SettingsScreen.module.css';

const WEIGHT_STEPS = [1, 1.25, 2.5, 5] as const;
const STEP_OPTIONS = WEIGHT_STEPS.map((step) => ({ value: String(step), label: `${formatNumber(step)}\u00a0kg` }));

export function SettingsScreen() {
  const settings = useLiveQuery(getSettings);

  return (
    <Screen title={t.settings.title} backTo="/">
      {settings && (
        <div className={styles.sections}>
          <p className={styles.autosaved}>{t.autosaved}</p>

          <section className={styles.section} aria-labelledby="rest-label">
            <h2 id="rest-label" className={fieldStyles.label}>
              {t.settings.restLabel}
            </h2>
            <p className={fieldStyles.hint}>{t.settings.restHint}</p>
            <Stepper
              value={settings.defaultRestSeconds}
              min={MIN_REST_SECONDS}
              max={MAX_REST_SECONDS}
              step={15}
              format={formatTimer}
              decreaseLabel={t.settings.restLess}
              increaseLabel={t.settings.restMore}
              onChange={(defaultRestSeconds) => void updateSettings({ defaultRestSeconds })}
            />
          </section>

          <section className={styles.section}>
            <ChoiceGroup
              legend={t.settings.stepLabel}
              options={STEP_OPTIONS}
              value={String(settings.weightStep)}
              onChange={(step) => void updateSettings({ weightStep: Number(step) })}
            />
            <p className={fieldStyles.hint}>{t.settings.stepHint}</p>
          </section>

          <section className={styles.section}>
            <label className={styles.toggle}>
              <input
                ref={(el) => el?.setAttribute('switch', '')}
                type="checkbox"
                className={styles.toggleInput}
                checked={settings.vibrate}
                onChange={(e) => void updateSettings({ vibrate: e.target.checked })}
              />
              <span className={styles.toggleTrack} aria-hidden="true" />
              <span className={fieldStyles.label}>{t.settings.vibrateLabel}</span>
            </label>
            <p className={fieldStyles.hint}>{t.settings.vibrateHint}</p>
          </section>

          <section className={styles.section}>
            <label className={styles.toggle}>
              <input
                ref={(el) => el?.setAttribute('switch', '')}
                type="checkbox"
                className={styles.toggleInput}
                checked={settings.sound !== false}
                onChange={(e) => void updateSettings({ sound: e.target.checked })}
              />
              <span className={styles.toggleTrack} aria-hidden="true" />
              <span className={fieldStyles.label}>{t.settings.soundLabel}</span>
            </label>
            <p className={fieldStyles.hint}>{t.settings.soundHint}</p>
          </section>

          <BackupSection />
        </div>
      )}
    </Screen>
  );
}

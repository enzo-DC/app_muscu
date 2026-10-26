import { useRef, useState } from 'react';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import fieldStyles from '../../components/Field.module.css';
import {
  BackupError,
  backupFileName,
  exportBackup,
  parseBackup,
  restoreBackup,
  summarize,
  type Backup,
} from '../../db/backup';
import { formatDateTime } from '../../lib/format';
import { saveFile } from '../../lib/saveFile';
import { t } from '../../lib/strings';
import styles from './SettingsScreen.module.css';

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

/** Exporter toutes les données en JSON, ou les remplacer par une sauvegarde. */
export function BackupSection() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Backup | null>(null);
  const [status, setStatus] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  async function handleExport() {
    setStatus(null);
    try {
      const backup = await exportBackup();
      await saveFile(JSON.stringify(backup), backupFileName(backup.exportedAt));
      setStatus({ tone: 'ok', text: t.settings.exported });
    } catch {
      setStatus({ tone: 'error', text: t.settings.exportFailed });
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setStatus(null);
    try {
      setPending(parseBackup(await file.text()));
    } catch (error) {
      const detail = error instanceof BackupError ? error.message : '';
      setStatus({ tone: 'error', text: `${t.settings.importFailed} ${detail}`.trim() });
    } finally {
      // Permet de rechoisir le même fichier
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function handleImport() {
    if (!pending) return;
    const backup = pending;
    setPending(null);
    try {
      await restoreBackup(backup);
      setStatus({ tone: 'ok', text: t.settings.imported });
    } catch {
      setStatus({ tone: 'error', text: t.settings.importFailed });
    }
  }

  const summary = pending ? summarize(pending) : null;

  return (
    <section className={styles.section} aria-labelledby="backup-title">
      <h2 id="backup-title" className={fieldStyles.label}>
        {t.settings.backupTitle}
      </h2>
      <p className={fieldStyles.hint}>{t.settings.backupHint}</p>
      <div className={styles.backupActions}>
        <Button block onClick={() => void handleExport()}>
          {t.settings.export}
        </Button>
        <Button block onClick={() => fileInput.current?.click()}>
          {t.settings.import}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="visually-hidden"
          tabIndex={-1}
          aria-label={t.settings.import}
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
      </div>
      <p className={status?.tone === 'error' ? styles.statusError : styles.status} role="status">
        {status?.text ?? ''}
      </p>

      <ConfirmDialog
        open={pending !== null}
        title={t.settings.importTitle}
        message={summary ? t.settings.importMessage(formatDateTime(summary.exportedAt)) : ''}
        confirmLabel={t.settings.importConfirm}
        onConfirm={() => void handleImport()}
        onCancel={() => setPending(null)}
      >
        {summary && (
          <p className={styles.backupContent}>
            {[
              plural(summary.sessions, 'séance', 'séances'),
              plural(summary.templates, 'modèle', 'modèles'),
              plural(summary.exercises, 'exercice', 'exercices'),
            ].join(' · ')}
          </p>
        )}
      </ConfirmDialog>
    </section>
  );
}

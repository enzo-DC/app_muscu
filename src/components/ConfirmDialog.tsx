import { useEffect, useId, useRef, type ReactNode } from 'react';
import { t } from '../lib/strings';
import { Button } from './Button';
import styles from './ConfirmDialog.module.css';

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** danger = action destructive (rouge), primary = action normale (accent). */
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
};

/** Demande de confirmation avant une action importante. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = t.cancel,
  tone = 'danger',
  onConfirm,
  onCancel,
  children,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const confirm = (
    <Button
      block
      variant={tone === 'primary' ? 'primary' : 'secondary'}
      className={tone === 'danger' ? styles.danger : undefined}
      onClick={onConfirm}
    >
      {confirmLabel}
    </Button>
  );
  const cancel = (
    <Button block onClick={onCancel}>
      {cancelLabel}
    </Button>
  );

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      // Toucher le fond (hors de la feuille) ferme, comme sur iOS
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className={styles.grabber} aria-hidden="true" />
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      <p className={styles.message}>{message}</p>
      {children}
      <div className={styles.actions}>
        {/* Action destructive : Annuler en premier, c'est lui qui reçoit le focus */}
        {tone === 'danger' ? (
          <>
            {cancel}
            {confirm}
          </>
        ) : (
          <>
            {confirm}
            {cancel}
          </>
        )}
      </div>
    </dialog>
  );
}

import styles from "../page.module.css";

export function OwnedPetToast({
  toast,
  hasPendingRemoval,
  onUndo,
}: {
  toast: string;
  hasPendingRemoval: boolean;
  onUndo: () => void;
}) {
  if (!toast) return null;
  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <span>{toast}</span>
      {hasPendingRemoval ? (
        <button type="button" onClick={onUndo}>
          Undo
        </button>
      ) : null}
    </div>
  );
}

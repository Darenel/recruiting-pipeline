import { Modal } from "./Modal";
import { useI18n } from "../i18n";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  loading = false,
  error,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const { t } = useI18n();
  const resolvedConfirmLabel = confirmLabel ?? t("common.delete");

  return (
    <Modal onClose={onClose} open={open} title={title}>
      <div className="modal-body">
        <p>{message}</p>
        {error ? <div className="error-box">{error}</div> : null}
      </div>
      <footer className="modal-actions">
        <button className="ghost" disabled={loading} onClick={onClose} type="button">
          {t("common.cancel")}
        </button>
        <button className="danger" disabled={loading} onClick={onConfirm} type="button">
          {loading ? t("common.working") : resolvedConfirmLabel}
        </button>
      </footer>
    </Modal>
  );
}

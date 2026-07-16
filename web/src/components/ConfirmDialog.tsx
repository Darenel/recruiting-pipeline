import { Modal } from "./Modal";

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
  confirmLabel = "Delete",
  loading = false,
  error,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal onClose={onClose} open={open} title={title}>
      <div className="modal-body">
        <p>{message}</p>
        {error ? <div className="error-box">{error}</div> : null}
      </div>
      <footer className="modal-actions">
        <button className="ghost" disabled={loading} onClick={onClose} type="button">
          Cancel
        </button>
        <button className="danger" disabled={loading} onClick={onConfirm} type="button">
          {loading ? "Working..." : confirmLabel}
        </button>
      </footer>
    </Modal>
  );
}

import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
  isLoading,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>{message}</p>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
          Cancel
        </button>
        <button
          className={`btn btn-${variant}`}
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? 'Please wait…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

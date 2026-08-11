import './ConfirmDialog.css'

interface ConfirmDialogProps {
  title: string
  body?: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  title,
  body,
  confirmLabel = 'Confirm',
  danger,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="confirm-dialog__backdrop" role="dialog" aria-modal="true">
      <div className="confirm-dialog card">
        <h2 className="confirm-dialog__title">{title}</h2>
        {body && <p className="confirm-dialog__body">{body}</p>}
        <div className="confirm-dialog__actions">
          <button type="button" className="button button--secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={`button ${danger ? 'button--danger' : 'button--primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

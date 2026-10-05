import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function DispatchRescheduleDialog({
  enabled,
  busy,
  title,
  onClose,
  children,
}: {
  enabled: boolean;
  busy: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!enabled) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.showModal();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [enabled]);

  if (!enabled) return <>{children}</>;
  return createPortal(
    <dialog
      ref={dialog}
      className="dispatch-reschedule-dialog"
      aria-labelledby="reschedule-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <header>
        <div>
          <h2 id="reschedule-title">Hẹn lại & phân công</h2>
          <p>{title}</p>
        </div>
        <button
          type="button"
          className="reschedule-close"
          aria-label="Đóng"
          disabled={busy}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </header>
      <div className="reschedule-body">{children}</div>
      <footer>
        <button type="button" disabled={busy} onClick={onClose}>
          Hủy
        </button>
      </footer>
    </dialog>,
    document.body,
  );
}

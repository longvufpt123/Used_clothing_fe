import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  tone?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Đóng',
  isLoading = false,
  tone = 'warning',
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => undefined : onCancel}
      title={title}
      footer={
        <div className="confirm-dialog-actions">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            type="button"
            className={`confirm-dialog-primary confirm-dialog-primary-${tone}`}
            isLoading={isLoading}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className={`confirm-dialog-body confirm-dialog-${tone}`}>
        <div className="confirm-dialog-icon" aria-hidden="true">
          <AlertTriangle size={24} />
        </div>
        <p>{message}</p>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
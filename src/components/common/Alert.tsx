import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import './Alert.css';

interface AlertProps {
  type?: 'success' | 'warning' | 'error' | 'info';
  message: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  message,
  onClose,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="alert-icon" size={20} />;
      case 'error':
        return <AlertCircle className="alert-icon" size={20} />;
      case 'warning':
        return <AlertCircle className="alert-icon" size={20} />;
      default:
        return <Info className="alert-icon" size={20} />;
    }
  };

  return (
    <div className={`alert-banner alert-${type}`}>
      <div className="alert-content">
        {getIcon()}
        <span className="alert-message">{message}</span>
      </div>
      {onClose && (
        <button className="alert-close-btn" onClick={onClose}>
          <X size={16} />
        </button>
      )}
    </div>
  );
};
export default Alert;

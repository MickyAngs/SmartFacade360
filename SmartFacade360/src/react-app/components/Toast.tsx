import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  type?: 'success' | 'error';
}

export default function Toast({ message, isVisible, onClose, type = 'success' }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className={`bg-white border ${type === 'error' ? 'border-red-200' : 'border-gray-200'} rounded-lg shadow-lg p-4 flex items-center space-x-3 animate-in slide-in-from-top duration-300`}>
        {type === 'success' ? (
          <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
        )}
        <p className={`text-sm flex-1 ${type === 'error' ? 'text-red-700' : 'text-gray-700'}`}>{message}</p>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

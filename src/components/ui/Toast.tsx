import React from 'react';
import type { Toast as ToastType } from '../../store/workspaceStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export const Toast: React.FC<{ toast: ToastType; onRemove: (id: string) => void }> = ({
  toast,
  onRemove,
}) => {
  const icons = {
    SUCCESS: <CheckCircle className="h-5 w-5 text-[var(--osint-graph-2)]" />,
    ERROR: <AlertCircle className="w-5 h-5 osint-danger-text" />,
    INFO: <Info className="h-5 w-5 text-[var(--osint-graph-1)]" />,
  };

  const bgColors = {
    SUCCESS: '',
    ERROR: 'osint-danger-banner',
    INFO: '',
  };

  const toneStyles = {
    SUCCESS: {
      backgroundColor: 'color-mix(in oklab, var(--osint-graph-2) 14%, var(--osint-panel) 86%)',
      borderColor: 'color-mix(in oklab, var(--osint-graph-2) 38%, var(--osint-border))',
    },
    ERROR: undefined,
    INFO: {
      backgroundColor: 'color-mix(in oklab, var(--osint-graph-1) 14%, var(--osint-panel) 86%)',
      borderColor: 'color-mix(in oklab, var(--osint-graph-1) 38%, var(--osint-border))',
    },
  };

  return (
    <div
      className={`flex items-center p-4 min-w-[300px] border backdrop-blur-md animate-in slide-in-from-right-full duration-300 ${bgColors[toast.type]}`}
      style={toneStyles[toast.type]}
    >
      <div className="mr-3">{icons[toast.type]}</div>
      <div className="flex-1 text-sm font-mono text-white">{toast.message}</div>
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-4 text-zinc-500 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useWorkspaceStore();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col space-y-4">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

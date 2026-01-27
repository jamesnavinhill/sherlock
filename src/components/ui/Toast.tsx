import React from 'react';
import type { Toast as ToastType } from '../../store/caseStore';
import { useCaseStore } from '../../store/caseStore';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export const Toast: React.FC<{ toast: ToastType; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
    const icons = {
        SUCCESS: <CheckCircle className="w-5 h-5 text-green-500" />,
        ERROR: <AlertCircle className="w-5 h-5 text-red-500" />,
        INFO: <Info className="w-5 h-5 text-osint-primary" />,
    };

    const bgColors = {
        SUCCESS: 'bg-green-500/10 border-green-500/50',
        ERROR: 'bg-red-500/10 border-red-500/50',
        INFO: 'bg-osint-primary/10 border-osint-primary/50',
    };

    return (
        <div className={`flex items-center p-4 min-w-[300px] border backdrop-blur-md animate-in slide-in-from-right-full duration-300 ${bgColors[toast.type]}`}>
            <div className="mr-3">
                {icons[toast.type]}
            </div>
            <div className="flex-1 text-sm font-mono text-white">
                {toast.message}
            </div>
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
    const { toasts, removeToast } = useCaseStore();

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col space-y-4">
            {toasts.map((toast) => (
                <Toast key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
        </div>
    );
};

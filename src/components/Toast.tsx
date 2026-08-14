import React from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-20 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-200 animate-in slide-in-from-bottom-5 ${
            toast.type === 'success'
              ? 'bg-[#141F2E]/95 border-emerald-500/60 text-slate-100 shadow-emerald-950/40'
              : toast.type === 'error'
              ? 'bg-[#2E1418]/95 border-rose-500/60 text-slate-100 shadow-rose-950/40'
              : 'bg-[#161B29]/95 border-[#344163] text-slate-100 shadow-black/40'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : toast.type === 'error' ? (
            <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-[#c0c1ff] flex-shrink-0" />
          )}

          <span className="text-xs sm:text-sm font-semibold flex-1">
            {toast.message}
          </span>

          <button
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';

export function ToastContainer() {
  const { toasts, dismissToast } = usePortfolio();
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const icon =
          toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
          );

        const borderClass =
          toast.type === 'success'
            ? 'border-emerald-200 dark:border-emerald-800/70'
            : toast.type === 'error'
              ? 'border-rose-200 dark:border-rose-800/70'
              : 'border-sky-200 dark:border-sky-800/70';

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border ${borderClass} bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg text-sm text-stone-800 dark:text-slate-100`}
          >
            <div className="mt-0.5">{icon}</div>
            <p className="flex-1 leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

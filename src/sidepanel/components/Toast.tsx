import { useEffect, useState } from 'react';
import { subscribeToast, dismissToast } from '../lib/toast';
import type { ToastPayload } from '../lib/toast';

export default function Toast() {
  const [toast, setToast] = useState<ToastPayload | null>(null);

  useEffect(() => subscribeToast(setToast), []);

  if (!toast) return null;

  return (
    <>
      <style>{`
        @keyframes toast-slide-in {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
      <div
        style={{
          position: 'absolute',
          bottom: 44,
          right: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--panel-bg)',
          border: '1px solid var(--toolbar-border)',
          borderRadius: 8,
          padding: '8px 12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          color: 'var(--text-primary)',
          zIndex: 20,
          whiteSpace: 'nowrap',
          animation: 'toast-slide-in 150ms ease-out',
        }}
      >
        <span>{toast.message}</span>
        {toast.action && (
          <button
            onClick={() => {
              toast.action!.onClick();
              dismissToast();
            }}
            style={{
              border: 'none',
              background: 'transparent',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--accent)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>
    </>
  );
}

import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function NotificationToast() {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 1000,
        maxWidth: '400px',
      }}
    >
      {notifications.map((n) => {
        let icon = <Info size={16} color="#38bdf8" />;
        let border = 'rgba(56, 189, 248, 0.4)';
        let bg = 'rgba(15, 23, 42, 0.95)';

        if (n.type === 'success') {
          icon = <CheckCircle2 size={16} color="#10b981" />;
          border = 'rgba(16, 185, 129, 0.4)';
        } else if (n.type === 'error') {
          icon = <AlertCircle size={16} color="#ef4444" />;
          border = 'rgba(239, 68, 68, 0.4)';
        } else if (n.type === 'warning') {
          icon = <AlertCircle size={16} color="#f59e0b" />;
          border = 'rgba(245, 158, 11, 0.4)';
        }

        return (
          <div
            key={n.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '10px 14px',
              backgroundColor: bg,
              border: `1px solid ${border}`,
              borderRadius: 'var(--radius-xs)',
              boxShadow: 'var(--shadow-panel)',
              backdropFilter: 'blur(8px)',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {icon}
              <span
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                }}
              >
                {n.message}
              </span>
            </div>

            <button
              onClick={() => removeNotification(n.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

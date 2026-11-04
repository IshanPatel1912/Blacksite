import React from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { AlertTriangle, RefreshCw, Terminal, CheckCircle } from 'lucide-react';

export function DbStatusBanner() {
  const { dbStatus, checkHealth } = usePlayer();

  if (dbStatus.connected) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, maxWidth: '850px' }}>
        <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '13px',
              fontWeight: 700,
              color: '#ef4444',
              letterSpacing: '0.05em',
            }}
          >
            BLACKSITE CLUSTER DISCONNECTED // ATTEMPTING RECONNECT
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              marginTop: 4,
            }}
          >
            The production game server cluster is temporarily unreachable. Please ensure the local service is running.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={checkHealth}
          className="tactical-btn tactical-btn-primary"
          style={{ fontSize: '12px', padding: '6px 14px' }}
        >
          <RefreshCw size={13} />
          RETRY CONNECTION
        </button>
      </div>
    </div>
  );
}

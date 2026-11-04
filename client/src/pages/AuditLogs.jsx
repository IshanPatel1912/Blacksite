import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../services/api';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Activity,
  List,
  GitCommit,
  CheckCircle2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export function AuditLogs() {
  const { activePlayerId, playersList, dbStatus } = usePlayer();
  const [logs, setLogs] = useState([]);
  const [actionTypes, setActionTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'timeline'

  // Filters
  const [selectedPlayer, setSelectedPlayer] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({
        playerId: selectedPlayer,
        actionType: 'ALL',
        limit: 100,
      });
      if (res.success) {
        setLogs(res.data || []);
        if (res.actionTypes) setActionTypes(res.actionTypes);
      }
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [selectedPlayer, dbStatus.connected]);

  // Filter logs by category
  const filteredLogs = logs.filter((log) => {
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'PURCHASES') return log.action_type?.includes('PURCHASE') || log.action_type?.includes('BUY');
    if (selectedCategory === 'TRADES') return log.action_type?.includes('TRADE');
    if (selectedCategory === 'MARKET') return log.action_type?.includes('MARKET');
    if (selectedCategory === 'WALLET') return log.action_type?.includes('WALLET') || log.action_type?.includes('REPAIR');
    return true;
  });

  const getActionBadge = (action) => {
    if (action.includes('PURCHASE') || action.includes('BUY')) {
      return { label: action, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' };
    }
    if (action.includes('TRADE')) {
      return { label: action, color: 'var(--accent-primary)', bg: 'rgba(255, 133, 0, 0.12)' };
    }
    if (action.includes('MARKET')) {
      return { label: action, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' };
    }
    if (action.includes('WALLET') || action.includes('REPAIR')) {
      return { label: action, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' };
    }
    return { label: action, color: 'var(--text-secondary)', bg: 'rgba(148, 163, 184, 0.12)' };
  };

  const renderDetailsFormatted = (details) => {
    if (!details) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
    try {
      const parsed = typeof details === 'string' ? JSON.parse(details) : details;
      if (typeof parsed === 'object') {
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {Object.entries(parsed).map(([key, val]) => (
              <span
                key={key}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  backgroundColor: 'var(--bg-surface)',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-dim)',
                }}
              >
                <strong style={{ color: 'var(--text-muted)' }}>{key}:</strong>{' '}
                <span style={{ color: 'var(--text-primary)' }}>{String(val)}</span>
              </span>
            ))}
          </div>
        );
      }
    } catch (e) {
      // not json
    }
    return <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{String(details)}</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="tech-tag">ACTION TELEMETRY</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>// IMMUTABLE LEDGER</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '0.04em', margin: 0, color: 'var(--text-primary)' }}>
            SERVICE ACTIVITY LOGS
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Operational deployments, supply requisitions, and market transactions recorded in real time.
          </p>
        </div>

        <button
          onClick={loadAuditLogs}
          className="tactical-btn tactical-btn-secondary"
          title="Refresh activity logs"
          style={{ padding: '8px 12px' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {/* Filter Category Pills & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'ALL ACTIVITY' },
            { id: 'PURCHASES', label: 'PURCHASES' },
            { id: 'TRADES', label: 'TRADES' },
            { id: 'MARKET', label: 'MARKETPLACE' },
            { id: 'WALLET', label: 'WALLET & REPAIRS' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="tactical-btn tactical-btn-secondary"
              style={{
                fontSize: '11px',
                padding: '6px 14px',
                backgroundColor: selectedCategory === cat.id ? 'rgba(255, 133, 0, 0.14)' : 'transparent',
                borderColor: selectedCategory === cat.id ? 'var(--accent-primary)' : 'var(--border-dim)',
                color: selectedCategory === cat.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: selectedCategory === cat.id ? 700 : 500,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
            className="tactical-select"
            style={{ fontSize: '12px', padding: '6px 10px' }}
          >
            <option value="ALL">All Operators</option>
            {playersList.map((p) => (
              <option key={p.player_id} value={p.player_id}>
                {p.username}
              </option>
            ))}
          </select>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setViewMode('table')}
              className="tactical-btn tactical-btn-secondary"
              style={{
                padding: '6px 10px',
                borderColor: viewMode === 'table' ? 'var(--accent-primary)' : 'var(--border-dim)',
                color: viewMode === 'table' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              }}
              title="Table View"
            >
              <List size={15} />
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className="tactical-btn tactical-btn-secondary"
              style={{
                padding: '6px 10px',
                borderColor: viewMode === 'timeline' ? 'var(--accent-primary)' : 'var(--border-dim)',
                color: viewMode === 'timeline' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              }}
              title="Timeline View"
            >
              <GitCommit size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {filteredLogs.length === 0 ? (
        <div
          className="tactical-panel"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <FileText size={36} color="var(--text-muted)" style={{ opacity: 0.5 }} />
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
            No Activity Logs Recorded
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
            No transactional events match your current filter selection.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="tactical-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '750px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-medium)' }}>
                <th style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                  LOG ID
                </th>
                <th style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                  TIMESTAMP
                </th>
                <th style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                  OPERATOR
                </th>
                <th style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                  ACTION TYPE
                </th>
                <th style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                  AUDIT DETAILS
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                const badge = getActionBadge(log.action_type || '');
                return (
                  <tr
                    key={log.log_id}
                    style={{
                      borderBottom: '1px solid var(--border-dim)',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                      #{log.log_id}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={13} color="var(--text-muted)" />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {log.username || `Operator #${log.player_id || 'System'}`}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: badge.bg,
                          color: badge.color,
                          fontSize: '10px',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          border: `1px solid ${badge.color}44`,
                        }}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {renderDetailsFormatted(log.details)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Timeline View */
        <div className="tactical-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: '15px',
                width: '2px',
                backgroundColor: 'var(--border-dim)',
              }}
            />

            {filteredLogs.map((log) => {
              const badge = getActionBadge(log.action_type || '');

              return (
                <div
                  key={log.log_id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '18px',
                    position: 'relative',
                    paddingLeft: '36px',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: '8px',
                      top: '4px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: badge.color,
                      border: '3px solid var(--bg-panel)',
                    }}
                  />

                  <div
                    style={{
                      flex: 1,
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-dim)',
                      borderRadius: 'var(--radius-xs)',
                      padding: '14px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: badge.bg,
                            color: badge.color,
                            fontSize: '10px',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {badge.label}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {log.username || `Operator #${log.player_id}`}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        <Clock size={12} />
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>

                    <div>{renderDetailsFormatted(log.details)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditLogs;
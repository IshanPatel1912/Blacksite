import React from 'react';
import { usePlayer } from '../../context/PlayerContext';
import {
  Coins,
  Shield,
  User,
  RefreshCw,
  Menu,
  Crown,
  LogOut,
  ArrowLeftRight,
  Radio
} from 'lucide-react';

export function TopBar({ onToggleSidebar, isSidebarCollapsed }) {
  const {
    authRole,
    adminUser,
    activePlayer,
    wallets,
    playersList,
    activePlayerId,
    switchPlayer,
    switchRole,
    logout,
    refreshPlayerData,
    dbStatus,
    loading,
  } = usePlayer();

  const isAdmin = authRole === 'admin';

  return (
    <header
      style={{
        height: '56px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: `1px solid ${isAdmin ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-dim)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 18px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Brand & Sidebar Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={onToggleSidebar}
          className="tactical-btn tactical-btn-secondary"
          style={{ padding: '6px 8px' }}
          title={isSidebarCollapsed ? 'Expand Navigation' : 'Collapse Navigation'}
        >
          <Menu size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              backgroundColor: isAdmin ? '#ef4444' : 'var(--accent-primary)',
              transform: 'rotate(45deg)',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '17px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: 'var(--text-primary)',
            }}
          >
            BLACKSITE <span style={{ color: isAdmin ? '#ef4444' : 'var(--accent-primary)' }}>//</span> {isAdmin ? 'COMMAND CONSOLE' : 'ARMORY'}
          </span>
        </div>

        {/* Server Network Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 8px',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: 'rgba(69, 184, 137, 0.12)',
            border: '1px solid rgba(69, 184, 137, 0.3)',
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            color: 'var(--color-success)',
            fontWeight: 700,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--color-success)' }} />
          <span>SERVER: LIVE</span>
        </div>

        {/* Role Badge */}
        <span
          style={{
            padding: '3px 8px',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: isAdmin ? 'rgba(227, 93, 93, 0.15)' : 'rgba(163, 179, 107, 0.15)',
            color: isAdmin ? 'var(--color-error)' : 'var(--accent-olive)',
            fontSize: '10px',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.04em',
            border: `1px solid ${isAdmin ? 'rgba(227, 93, 93, 0.35)' : 'rgba(163, 179, 107, 0.35)'}`,
          }}
        >
          {isAdmin ? 'OVERSEER // COMMAND' : 'OPERATOR // TIER 1'}
        </span>
      </div>

      {/* Center: Live Currency Balances (Player Mode) or System Stats (Admin Mode) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {!isAdmin ? (
          wallets && wallets.length > 0 ? (
            wallets.slice(0, 2).map((w) => (
              <div
                key={w.currency_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border-dim)',
                  borderRadius: 'var(--radius-xs)',
                }}
                title={w.currency_name}
              >
                <Coins size={13} color={w.is_premium ? 'var(--accent-primary)' : '#94a3b8'} />
                <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {w.symbol}:
                </span>
                <span
                  className="font-mono"
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: w.is_premium ? 'var(--text-accent)' : 'var(--text-primary)',
                  }}
                >
                  {parseFloat(w.balance).toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {dbStatus.connected ? 'Synchronizing...' : 'Offline'}
            </span>
          )
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            <Radio size={12} color="#ef4444" />
            <span>CENTRAL OVERVIEW // UNRESTRICTED CLEARANCE</span>
          </div>
        )}
      </div>

      {/* Right Controls: Switch Role & Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={refreshPlayerData}
          className="tactical-btn tactical-btn-secondary"
          style={{ padding: '6px 8px' }}
          title="Refresh Live Data"
          disabled={loading}
        >
          <RefreshCw size={13} className={loading ? 'spin' : ''} />
        </button>

        {/* Quick Role Toggle */}
        {isAdmin ? (
          <button
            onClick={() => switchRole('player')}
            className="tactical-btn tactical-btn-secondary"
            style={{ padding: '5px 10px', fontSize: '11px', gap: '6px' }}
            title="Switch to Player View"
          >
            <Shield size={13} color="#38bdf8" />
            <span>SWITCH TO PLAYER</span>
          </button>
        ) : (
          <>
            {/* Player Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={13} color="var(--accent-primary)" />
              <select
                value={activePlayerId}
                onChange={(e) => switchPlayer(parseInt(e.target.value, 10))}
                className="tactical-select"
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-accent)',
                }}
              >
                {playersList.map((p) => (
                  <option key={p.player_id} value={p.player_id}>
                    {p.username}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => switchRole('admin')}
              className="tactical-btn tactical-btn-secondary"
              style={{ padding: '5px 10px', fontSize: '11px', gap: '6px' }}
              title="Switch to Admin Console"
            >
              <Crown size={13} color="#ef4444" />
              <span>ADMIN</span>
            </button>
          </>
        )}

        {/* Logout Button */}
        <button
          onClick={logout}
          className="tactical-btn tactical-btn-secondary"
          style={{ padding: '6px 8px' }}
          title="Log Out / Return to Gateway"
        >
          <LogOut size={13} />
        </button>
      </div>
    </header>
  );
}

export default TopBar;
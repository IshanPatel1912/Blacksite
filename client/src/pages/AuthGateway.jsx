import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useNotification } from '../context/NotificationContext';
import {
  Shield,
  Lock,
  User,
  KeyRound,
  Terminal,
  CheckCircle2,
  ChevronRight,
  AlertTriangle,
  ArrowRight,
  Database,
  Radio,
  Sparkles,
  Layers,
  Crown
} from 'lucide-react';

export function AuthGateway() {
  const { playersList, loginAsPlayer, loginAsAdmin, dbStatus } = usePlayer();
  const { addNotification } = useNotification();

  const [activeTab, setActiveTab] = useState('player'); // 'player' | 'admin'
  const [selectedPlayerId, setSelectedPlayerId] = useState(1);
  const [customCallsign, setCustomCallsign] = useState('');
  const [playerPassword, setPlayerPassword] = useState('password123');

  // Admin form state
  const [adminPasscode, setAdminPasscode] = useState('');
  const [adminError, setAdminError] = useState('');

  const handlePlayerLogin = (e) => {
    e?.preventDefault();
    loginAsPlayer(selectedPlayerId);
    addNotification('Operator authentication verified. Welcome to the Armory!', 'success');
  };

  const handleAdminLogin = (e) => {
    e?.preventDefault();
    setAdminError('');

    // Accept standard passcodes or demo bypass
    const validKeys = ['admin', 'admin123', 'blacksite', 'overseer', 'blacksite-admin'];
    const entered = adminPasscode.trim().toLowerCase();

    if (!entered || validKeys.includes(entered)) {
      loginAsAdmin(adminPasscode);
      addNotification('Central Command Level-5 credentials authorized. Welcome, Overseer.', 'success');
    } else {
      setAdminError('Invalid security clearance key. (Hint: Use "admin" or click demo access)');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        backgroundImage: `
          radial-gradient(circle at 50% 20%, rgba(217, 154, 61, 0.08) 0%, transparent 60%),
          linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 24px 24px, 24px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      {/* Top Brand Insignia */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            backgroundColor: 'rgba(255, 133, 0, 0.1)',
            border: '1px solid rgba(255, 133, 0, 0.3)',
            borderRadius: 'var(--radius-xs)',
            marginBottom: '10px',
          }}
        >
          <Radio size={14} color="var(--accent-primary)" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 700, letterSpacing: '0.1em' }}>
            BLACKSITE // SECURE IDENTITY GATEWAY
          </span>
        </div>

        <h1
          style={{
            fontSize: '32px',
            fontWeight: 800,
            letterSpacing: '0.06em',
            margin: 0,
            color: '#fff',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
          }}
        >
          BLACKSITE // ARMORY
        </h1>
        <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Tactical FPS Inventory, Live Asset Exchange & Operator Management
        </p>
      </div>

      {/* Main Authentication Card */}
      <div
        className="tactical-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          backgroundColor: 'var(--bg-panel)',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Role Mode Navigation Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            borderBottom: '1px solid var(--border-medium)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <button
            onClick={() => setActiveTab('player')}
            style={{
              padding: '16px',
              backgroundColor: activeTab === 'player' ? 'var(--bg-panel)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'player' ? '3px solid var(--accent-primary)' : '3px solid transparent',
              color: activeTab === 'player' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontFamily: 'var(--font-display)',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              transition: 'all 0.15s ease',
            }}
          >
            <Shield size={18} />
            OPERATOR LOGIN (PLAYER)
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            style={{
              padding: '16px',
              backgroundColor: activeTab === 'admin' ? 'var(--bg-panel)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'admin' ? '3px solid #ef4444' : '3px solid transparent',
              color: activeTab === 'admin' ? '#ef4444' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontFamily: 'var(--font-display)',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              transition: 'all 0.15s ease',
            }}
          >
            <Crown size={18} />
            CENTRAL COMMAND (ADMIN)
          </button>
        </div>

        {/* TAB 1: PLAYER / OPERATOR LOGIN */}
        {activeTab === 'player' && (
          <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                STEP 1: SELECT DEPLOYMENT CALLSIGN
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 2px 0' }}>
                Authorized Personnel Roster
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                Select an active operator profile to access your locker, armory, and trading escrow.
              </p>
            </div>

            {/* Operator Selection Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
                gap: '10px',
                marginBottom: '20px',
                maxHeight: '230px',
                overflowY: 'auto',
                padding: '4px',
              }}
            >
              {playersList.map((p) => {
                const isSelected = p.player_id === selectedPlayerId;
                return (
                  <div
                    key={p.player_id}
                    onClick={() => setSelectedPlayerId(p.player_id)}
                    style={{
                      padding: '12px',
                      backgroundColor: isSelected ? 'rgba(255, 133, 0, 0.12)' : 'var(--bg-surface)',
                      border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-dim)',
                      borderRadius: 'var(--radius-xs)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                        #{p.player_id}
                      </span>
                      {isSelected && <CheckCircle2 size={13} color="var(--accent-primary)" />}
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                      {p.username}
                    </div>

                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                      {p.total_items ?? 0} ITEMS // {p.active_listings ?? 0} LISTED
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Deploy Action */}
            <form onSubmit={handlePlayerLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <button
                type="submit"
                className="tactical-btn tactical-btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                DEPLOY AS OPERATOR
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: CENTRAL COMMAND ADMIN LOGIN */}
        {activeTab === 'admin' && (
          <div style={{ padding: '24px' }}>
            <div
              style={{
                padding: '14px',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                borderLeft: '4px solid #ef4444',
                borderRadius: 'var(--radius-xs)',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 700, fontSize: '13px' }}>
                <Lock size={16} />
                LEVEL-5 OVERSEER MASTER CLEARANCE
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Central Command grants full administrative authority over item blueprint registration, quartermaster supply drops, operator security moderation, and real-time network telemetry.
              </p>
            </div>

            <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                  COMMAND AUTHORIZATION KEY
                </label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    value={adminPasscode}
                    onChange={(e) => setAdminPasscode(e.target.value)}
                    placeholder="Enter Overseer Passkey (or leave default)..."
                    className="tactical-input"
                    style={{ width: '100%', paddingLeft: '36px', fontSize: '13px' }}
                  />
                </div>
                {adminError && (
                  <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '6px' }}>
                    {adminError}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setAdminPasscode('admin');
                    loginAsAdmin('admin');
                    addNotification('Central Command Level-5 credentials authorized. Welcome, Overseer.', 'success');
                  }}
                  className="tactical-btn tactical-btn-secondary"
                  style={{ flex: 1, padding: '10px', fontSize: '11px' }}
                >
                  <Sparkles size={14} color="#ef4444" />
                  DEMO 1-CLICK ACCESS
                </button>

                <button
                  type="submit"
                  className="tactical-btn tactical-btn-danger"
                  style={{ flex: 2, padding: '10px', fontSize: '12px', fontWeight: 700 }}
                >
                  <Lock size={15} />
                  ENTER COMMAND CONSOLE
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Network Security Footnote */}
      <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
        <span>BLACKSITE CLUSTER NETWORK // SECURE PRODUCTION DEPLOYMENT ACTIVE</span>
      </div>
    </div>
  );
}

export default AuthGateway;
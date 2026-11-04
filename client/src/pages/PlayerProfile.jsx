import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../services/api';
import {
  User,
  Shield,
  Mail,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Repeat,
  Tag,
  Users,
  Coins,
  Award,
  Crosshair,
  BadgeCheck,
  Radio,
  RefreshCw
} from 'lucide-react';

export function PlayerProfile() {
  const { activePlayerId, playersList, switchPlayer, dbStatus } = usePlayer();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await api.getPlayer(activePlayerId);
      if (res.success) {
        setProfileData(res.data);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [activePlayerId, dbStatus.connected]);

  const player = profileData?.player;
  const stats = profileData?.stats;
  const wallets = profileData?.wallets || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="tech-tag">PERSONNEL DOSSIER</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>// OPERATOR PROFILE</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '0.04em', margin: 0, color: 'var(--text-primary)' }}>
            OPERATOR PROFILE
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Individual operator credentials, deployment records, assigned financial wallets, and testing accounts.
          </p>
        </div>

        <button
          onClick={loadProfile}
          className="tactical-btn tactical-btn-secondary"
          title="Refresh dossier"
          style={{ padding: '8px 12px' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {/* Main Dossier Card */}
      <div
        className="tactical-panel"
        style={{
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 1.4fr)',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Left: Operator Identification Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '78px',
                height: '78px',
                backgroundColor: '#101419',
                border: '2px solid var(--accent-olive)',
                borderRadius: 'var(--radius-xs)',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src="/images/operators/operator_ghost.jpg"
                alt="Operator Avatar"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  objectPosition: 'center',
                  padding: '4px',
                  boxSizing: 'border-box',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  backgroundColor: 'var(--color-success)',
                  borderRadius: '50%',
                  width: '10px',
                  height: '10px',
                  border: '2px solid var(--bg-panel)',
                }}
              />
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                CALLSIGN / OPERATOR
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 4px 0' }}>
                {player?.username || `Operator #${activePlayerId}`}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: player?.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: player?.status === 'active' ? '#10b981' : '#ef4444',
                    fontSize: '10px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    border: `1px solid ${player?.status === 'active' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  }}
                >
                  STATUS: {player?.status?.toUpperCase() || 'ACTIVE'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  ID: #{player?.player_id || activePlayerId}
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              paddingTop: '16px',
              borderTop: '1px solid var(--border-dim)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
              <Mail size={15} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-secondary)' }}>
                {player?.email || `${player?.username || 'operator'}@blacksite.ops`}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
              <Calendar size={15} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-secondary)' }}>
                ENLISTED: {player?.created_at ? new Date(player.created_at).toLocaleDateString() : 'Active Service'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
              <Radio size={15} color="var(--accent-primary)" />
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                CLEARANCE: LEVEL 4 SPECIAL TACTICAL OPERATOR
              </span>
            </div>
          </div>
        </div>

        {/* Right: Operational Statistics & Asset Ledgers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
            OPERATIONAL ASSET & MARKET METRICS
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
            }}
          >
            <div
              style={{
                padding: '14px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-dim)',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                ARMORY ITEMS
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                {stats?.inventory_count ?? 0}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Assigned to locker
              </div>
            </div>

            <div
              style={{
                padding: '14px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-dim)',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                ACTIVE LISTINGS
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#38bdf8', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                {stats?.active_listings ?? 0}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Listed on market
              </div>
            </div>

            <div
              style={{
                padding: '14px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-dim)',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                PENDING TRADES
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                {stats?.pending_trades ?? 0}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Awaiting escrow
              </div>
            </div>
          </div>

          {/* Assigned Currencies */}
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
              ATTACHED LEDGER BALANCES
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {wallets.map((w) => (
                <div
                  key={w.currency_id}
                  style={{
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-surface)',
                    border: w.is_premium ? '1px solid rgba(255, 133, 0, 0.4)' : '1px solid var(--border-dim)',
                    borderRadius: 'var(--radius-xs)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    minWidth: '160px',
                  }}
                >
                  <Coins size={16} color={w.is_premium ? 'var(--accent-primary)' : '#94a3b8'} />
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {w.currency_name}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: w.is_premium ? 'var(--accent-primary)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {parseFloat(w.balance || 0).toLocaleString()} {w.symbol}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Operator Personnel Roster */}
      <div className="tactical-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="var(--accent-primary)" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              OPERATOR PERSONNEL ROSTER // ACTIVE UNIT
            </h3>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            CLICK TO SWITCH ACTIVE OPERATOR PROFILE
          </span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
          Select any active unit operator to deploy with their specific weapons loadout, personal locker items, and financial ledger.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            gap: '12px',
          }}
        >
          {playersList.map((p) => {
            const isSelected = p.player_id === activePlayerId;
            return (
              <div
                key={p.player_id}
                onClick={() => switchPlayer(p.player_id)}
                style={{
                  padding: '14px 16px',
                  backgroundColor: isSelected ? 'rgba(255, 133, 0, 0.12)' : 'var(--bg-surface)',
                  border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-dim)',
                  borderRadius: 'var(--radius-xs)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                    OPERATOR #{p.player_id}
                  </span>
                  {isSelected ? (
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'var(--accent-primary)',
                        color: '#000',
                        fontSize: '9px',
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      ACTIVE
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '10px',
                        color: p.status === 'active' ? '#10b981' : '#ef4444',
                        fontWeight: 700,
                      }}
                    >
                      {p.status?.toUpperCase()}
                    </span>
                  )}
                </div>

                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', marginTop: '6px' }}>
                  {p.username}
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                  {p.total_items ?? 0} ITEMS // {p.active_listings ?? 0} LISTED
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PlayerProfile;
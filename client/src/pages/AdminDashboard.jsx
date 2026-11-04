import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import {
  Shield,
  Users,
  Coins,
  Package,
  ArrowLeftRight,
  Repeat,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  RefreshCw,
  PlusCircle,
  FileText,
  Activity,
  Layers,
  Sparkles,
  Compass,
  Sliders,
  Edit3,
  Flame,
  Zap,
  Check,
  X
} from 'lucide-react';

export function AdminDashboard({ onNavigate }) {
  const { adminUser, dbStatus, refreshPlayerData } = usePlayer();
  const { addNotification } = useNotification();

  // Navigation section inside Admin console
  const [adminSection, setAdminSection] = useState('overview'); // 'overview' | 'wheel'

  const [metrics, setMetrics] = useState(null);
  const [players, setPlayers] = useState([]);
  const [storeOffers, setStoreOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Restock modal state
  const [restockModalOffer, setRestockModalOffer] = useState(null);
  const [addStockAmount, setAddStockAmount] = useState('25');

  // Luck Royale Admin State
  const [wheelConfig, setWheelConfig] = useState(null);
  const [wheelHistory, setWheelHistory] = useState([]);
  const [editingReward, setEditingReward] = useState(null);
  const [editProb, setEditProb] = useState('');
  const [editSupply, setEditSupply] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editCost, setEditCost] = useState('500');

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [metricsRes, playersRes, storeRes, wheelRes, historyRes] = await Promise.all([
        api.getAdminMetrics().catch(() => ({ success: false })),
        api.getPlayers().catch(() => ({ success: false, data: [] })),
        api.getStoreOffers().catch(() => ({ success: false, data: [] })),
        api.getAdminWheelConfig().catch(() => ({ success: false })),
        api.getWheelSpinHistory({ limit: 25 }).catch(() => ({ success: false, data: [] }))
      ]);

      if (metricsRes.success) setMetrics(metricsRes.data);
      if (playersRes.success) setPlayers(playersRes.data || []);
      if (storeRes.success) setStoreOffers(storeRes.data || []);
      if (wheelRes.success) {
        setWheelConfig(wheelRes);
        if (wheelRes.events?.[0]) setEditCost(String(wheelRes.events[0].spin_cost));
      }
      if (historyRes.success) setWheelHistory(historyRes.data || []);
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [dbStatus.connected]);

  const handleUpdateStatus = async (playerId, newStatus) => {
    try {
      setProcessingId(playerId);
      const res = await api.updatePlayerStatus(playerId, {
        status: newStatus,
        reason: 'COMMAND_ADMIN_CONSOLE_ACTION',
      });
      if (res.success) {
        addNotification(res.message, 'success');
        loadAdminData();
      }
    } catch (err) {
      addNotification(err.message || 'Status update failed', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockModalOffer) return;
    try {
      const res = await api.updateStoreOffer(restockModalOffer.offer_id, {
        addStock: parseInt(addStockAmount, 10),
      });
      if (res.success) {
        addNotification(res.message, 'success');
        setRestockModalOffer(null);
        loadAdminData();
      }
    } catch (err) {
      addNotification(err.message || 'Restock failed', 'error');
    }
  };

  // Open Edit Reward Modal
  const openEditReward = (reward) => {
    setEditingReward(reward);
    setEditProb(String(reward.base_probability));
    setEditSupply(reward.max_supply !== null && reward.max_supply !== undefined ? String(reward.max_supply) : '');
    setEditActive(reward.is_active);
  };

  // Submit Reward Update
  const handleSaveRewardConfig = async (e) => {
    e.preventDefault();
    if (!editingReward) return;

    try {
      const probNum = parseFloat(editProb);
      if (isNaN(probNum) || probNum < 0 || probNum > 1) {
        addNotification('Probability must be between 0.0000 and 1.0000', 'error');
        return;
      }

      const supplyVal = editSupply.trim() === '' ? null : parseInt(editSupply, 10);
      if (supplyVal !== null && (isNaN(supplyVal) || supplyVal < 0)) {
        addNotification('Supply limit must be a positive integer or empty (for unlimited)', 'error');
        return;
      }

      const res = await api.updateWheelReward(editingReward.reward_id, {
        baseProbability: probNum,
        maxSupply: supplyVal,
        isActive: editActive,
      });

      if (res.success) {
        addNotification(res.message || 'Reward configuration updated!', 'success');
        setEditingReward(null);
        loadAdminData();
      }
    } catch (err) {
      addNotification(err.message || 'Failed to update reward configuration', 'error');
    }
  };

  // Toggle Event Active/Cost
  const handleSaveEventConfig = async (isActive) => {
    const activeEvent = wheelConfig?.events?.[0];
    if (!activeEvent) return;

    try {
      const res = await api.updateEventConfig({
        eventId: activeEvent.event_id,
        spinCost: parseFloat(editCost) || 500,
        currencyId: activeEvent.currency_id,
        isActive: isActive !== undefined ? isActive : activeEvent.is_active,
      });

      if (res.success) {
        addNotification('Luck Royale event configuration synchronized.', 'success');
        loadAdminData();
      }
    } catch (err) {
      addNotification(err.message || 'Failed to update event.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px 28px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'rgba(227, 93, 93, 0.15)',
                color: 'var(--color-error)',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.04em',
                border: '1px solid rgba(227, 93, 93, 0.35)',
              }}
            >
              COMMAND OVERSEER
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
              // CLEARANCE LEVEL 5
            </span>
          </div>

          <h1 style={{ fontSize: '26px', color: 'var(--text-primary)', margin: 0 }}>
            CENTRAL COMMAND CONSOLE
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            System-level control over catalog blueprints, depot supply drops, operator security clearance, and real-time network telemetry.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--border-dim)',
              borderRadius: 'var(--radius-xs)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--color-success)',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--color-success)' }} />
            <span>CLUSTER STATUS: HEALTHY</span>
          </div>

          <button
            onClick={loadAdminData}
            className="tactical-btn tactical-btn-secondary"
            title="Refresh admin telemetry"
            style={{ padding: '8px 12px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Admin Section Tabs: Overview vs Luck Royale Scarcity */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid var(--border-dim)', paddingBottom: 10 }}>
        <button
          onClick={() => setAdminSection('overview')}
          className={`tactical-btn ${adminSection === 'overview' ? 'tactical-btn-primary' : 'tactical-btn-secondary'}`}
          style={{ padding: '8px 18px', fontSize: '12px' }}
        >
          <Shield size={14} />
          OVERVIEW & PERSONNEL
        </button>

        <button
          onClick={() => setAdminSection('wheel')}
          className={`tactical-btn ${adminSection === 'wheel' ? 'tactical-btn-primary' : 'tactical-btn-secondary'}`}
          style={{ padding: '8px 18px', fontSize: '12px' }}
        >
          <Compass size={14} />
          LUCK ROYALE & SCARCITY CONTROL
        </button>
      </div>

      {/* SECTION 1: OVERVIEW & PERSONNEL */}
      {adminSection === 'overview' && (
        <>
          {/* Global Administrative Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
            }}
          >
            <div className="tactical-panel" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>TOTAL OPERATORS</span>
                <Users size={16} color="var(--accent-olive)" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                {metrics?.players?.total ?? players.length}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {metrics?.players?.active ?? players.filter((p) => p.status === 'active').length} Active in Service
              </div>
            </div>

            <div className="tactical-panel" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>ARMORY ASSETS SPAWNED</span>
                <Package size={16} color="var(--accent-primary)" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                {metrics?.inventory?.total_instances ?? '24'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Across {metrics?.inventory?.distinct_types ?? '16'} Blueprint Archetypes
              </div>
            </div>

            <div className="tactical-panel" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>MARKET VOLUME</span>
                <ArrowLeftRight size={16} color="var(--color-success)" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-success)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                {metrics?.market?.active_listings ?? '1'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Active P2P Listings
              </div>
            </div>

            <div className="tactical-panel" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>PENDING TRADES</span>
                <Repeat size={16} color="var(--accent-primary)" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                {metrics?.trades?.pending_trades ?? '1'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Awaiting Escrow Resolution
              </div>
            </div>
          </div>

          {/* Main Administrative Control Panels */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(420px, 1.4fr) minmax(320px, 1fr)',
              gap: '20px',
            }}
          >
            {/* Left Column: Player Moderation Roster */}
            <div className="tactical-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} color="var(--accent-olive)" />
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    OPERATOR PERSONNEL & SECURITY ROSTER
                  </h3>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                  LIVE STATUS CONTROL
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-dim)', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '11px' }}>
                      <th style={{ padding: '8px 10px' }}>ID // CALLSIGN</th>
                      <th style={{ padding: '8px 10px' }}>STATUS</th>
                      <th style={{ padding: '8px 10px' }}>ITEMS</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>MODERATION ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((p) => {
                      const isProcessing = processingId === p.player_id;
                      const isActive = p.status === 'active';

                      return (
                        <tr key={p.player_id} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                          <td style={{ padding: '10px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                              {p.username}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              #{p.player_id} // {p.email}
                            </div>
                          </td>
                          <td style={{ padding: '10px' }}>
                            <span
                              style={{
                                padding: '2px 6px',
                                borderRadius: 'var(--radius-xs)',
                                backgroundColor: isActive ? 'rgba(69, 184, 137, 0.15)' : 'rgba(227, 93, 93, 0.15)',
                                color: isActive ? 'var(--color-success)' : 'var(--color-error)',
                                fontSize: '10px',
                                fontWeight: 700,
                              }}
                            >
                              {p.status.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                            {p.total_items ?? 0}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              {isActive ? (
                                <button
                                  onClick={() => handleUpdateStatus(p.player_id, 'suspended')}
                                  disabled={isProcessing}
                                  className="tactical-btn tactical-btn-secondary"
                                  style={{ padding: '4px 8px', fontSize: '10px', color: 'var(--accent-primary)' }}
                                >
                                  SUSPEND
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateStatus(p.player_id, 'active')}
                                  disabled={isProcessing}
                                  className="tactical-btn tactical-btn-secondary"
                                  style={{ padding: '4px 8px', fontSize: '10px', color: 'var(--color-success)' }}
                                >
                                  ACTIVATE
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Store Supply Quotas */}
            <div className="tactical-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={16} color="var(--accent-primary)" />
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    DEPOT SUPPLY OFFERS & STOCK
                  </h3>
                </div>
                <button
                  onClick={() => onNavigate('catalog')}
                  className="tactical-btn tactical-btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '10px' }}
                >
                  BLUEPRINTS
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
                {storeOffers.map((offer) => {
                  const remaining = offer.remaining_stock ?? (offer.stock_limit - offer.stock_sold);
                  const isLow = remaining < 10;

                  return (
                    <div
                      key={offer.offer_id}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-dim)',
                        borderRadius: 'var(--radius-xs)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {offer.item_name}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          PRICE: {parseFloat(offer.price).toLocaleString()} {offer.currency_symbol} // SOLD: {offer.stock_sold}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                          <span style={{ color: isLow ? 'var(--color-error)' : 'var(--color-success)', fontWeight: 700 }}>
                            {remaining}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}> / {offer.stock_limit}</span>
                        </div>

                        <button
                          onClick={() => setRestockModalOffer(offer)}
                          className="tactical-btn tactical-btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '10px' }}
                          title="Add inventory units"
                        >
                          + RESTOCK
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* SECTION 2: LUCK ROYALE & SCARCITY CONTROL */}
      {adminSection === 'wheel' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Wheel Event Controls & Telemetry */}
          {wheelConfig?.events?.[0] && (
            <div
              className="tactical-panel"
              style={{
                padding: '20px 24px',
                background: 'var(--bg-panel)',
                borderLeft: '4px solid var(--accent-primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div>
                <span className="tech-tag">EVENT PARAMETERS & DEPLOYMENT</span>
                <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginTop: 2 }}>
                  {wheelConfig.events[0].event_name}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span>Total Spins: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{wheelConfig.stats?.total_spins || 0}</strong></span>
                  <span>•</span>
                  <span>Credits Sink: <strong style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>{parseFloat(wheelConfig.stats?.total_revenue || 0).toLocaleString()} CR</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Spin Cost:</span>
                  <input
                    type="number"
                    min="1"
                    value={editCost}
                    onChange={(e) => setEditCost(e.target.value)}
                    className="tactical-input"
                    style={{ width: '90px', padding: '6px 10px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}
                  />
                  <button
                    onClick={() => handleSaveEventConfig()}
                    className="tactical-btn tactical-btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '11px' }}
                  >
                    UPDATE
                  </button>
                </div>

                <button
                  onClick={() => handleSaveEventConfig(!wheelConfig.events[0].is_active)}
                  className={`tactical-btn ${wheelConfig.events[0].is_active ? 'tactical-btn-danger' : 'tactical-btn-olive'}`}
                  style={{ padding: '6px 16px', fontSize: '12px' }}
                >
                  {wheelConfig.events[0].is_active ? 'DISABLE EVENT' : 'ENABLE EVENT'}
                </button>
              </div>
            </div>
          )}

          {/* Scarcity-Enforced Reward Matrix Table */}
          <div className="tactical-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <span className="tech-tag">CONFIGURABLE REWARD MATRIX</span>
                <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', margin: '2px 0 0 0' }}>
                  REWARD PROBABILITIES & SUPPLY LIMIT ENFORCEMENT
                </h3>
              </div>

              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Server-side Atomic Locking Enforced
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-dim)', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '11px' }}>
                    <th style={{ padding: '8px 10px' }}>ITEM BLUEPRINT</th>
                    <th style={{ padding: '8px 10px' }}>RARITY</th>
                    <th style={{ padding: '8px 10px' }}>BASE PROBABILITY</th>
                    <th style={{ padding: '8px 10px' }}>GLOBAL CAP</th>
                    <th style={{ padding: '8px 10px' }}>AWARDED / REMAINING</th>
                    <th style={{ padding: '8px 10px' }}>STATUS</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {wheelConfig?.rewards?.map((r) => {
                    const isSoldOut = r.max_supply !== null && r.awarded_count >= r.max_supply;
                    return (
                      <tr key={r.reward_id} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                        <td style={{ padding: '10px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {r.item_name}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {r.category}
                          </div>
                        </td>

                        <td style={{ padding: '10px' }}>
                          <span className={`rarity-badge rarity-${r.rarity}`}>
                            {r.rarity}
                          </span>
                        </td>

                        <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-primary)' }}>
                          {(parseFloat(r.base_probability) * 100).toFixed(2)}% ({parseFloat(r.base_probability).toFixed(4)})
                        </td>

                        <td style={{ padding: '10px', fontFamily: 'var(--font-mono)' }}>
                          {r.max_supply !== null ? (
                            <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
                              {r.max_supply} UNITS MAX
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>UNLIMITED</span>
                          )}
                        </td>

                        <td style={{ padding: '10px', fontFamily: 'var(--font-mono)' }}>
                          <span style={{ fontWeight: 700, color: isSoldOut ? 'var(--color-error)' : 'var(--color-success)' }}>
                            {r.awarded_count} AWARDED
                          </span>
                          {r.max_supply !== null && (
                            <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>
                              ({Math.max(0, r.max_supply - r.awarded_count)} LEFT)
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '10px' }}>
                          {isSoldOut ? (
                            <span style={{ padding: '2px 6px', borderRadius: '2px', backgroundColor: 'rgba(227, 93, 93, 0.15)', color: 'var(--color-error)', fontSize: '10px', fontWeight: 700 }}>
                              SOLD OUT
                            </span>
                          ) : r.is_active ? (
                            <span style={{ padding: '2px 6px', borderRadius: '2px', backgroundColor: 'rgba(69, 184, 137, 0.15)', color: 'var(--color-success)', fontSize: '10px', fontWeight: 700 }}>
                              ACTIVE
                            </span>
                          ) : (
                            <span style={{ padding: '2px 6px', borderRadius: '2px', backgroundColor: 'rgba(154, 168, 181, 0.15)', color: 'var(--text-muted)', fontSize: '10px', fontWeight: 700 }}>
                              DISABLED
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '10px', textAlign: 'right' }}>
                          <button
                            onClick={() => openEditReward(r)}
                            className="tactical-btn tactical-btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '11px', gap: 4 }}
                          >
                            <Edit3 size={12} />
                            EDIT
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Spin Audit History Ledger */}
          <div className="tactical-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={16} color="var(--accent-olive)" />
                <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', margin: 0 }}>
                  LUCK ROYALE AUDIT TRAIL // RECENT SPINS
                </h3>
              </div>

              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {wheelHistory.length} ENTRIES
              </span>
            </div>

            <div style={{ overflowX: 'auto', maxHeight: '340px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-dim)', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '11px' }}>
                    <th style={{ padding: '8px 10px' }}>SPIN ID</th>
                    <th style={{ padding: '8px 10px' }}>OPERATOR</th>
                    <th style={{ padding: '8px 10px' }}>REWARD GRANTED</th>
                    <th style={{ padding: '8px 10px' }}>COST PAID</th>
                    <th style={{ padding: '8px 10px' }}>TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody>
                  {wheelHistory.map((s) => (
                    <tr key={s.spin_id} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                      <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        #{s.spin_id}
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {s.username}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{s.item_name}</span>
                        <span className={`rarity-badge rarity-${s.rarity}`} style={{ fontSize: '9px', marginLeft: 6 }}>
                          {s.rarity}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {parseFloat(s.cost_paid).toLocaleString()} {s.currency_symbol}
                      </td>
                      <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(s.spun_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Reward Probability & Cap Modal */}
      {editingReward && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 16,
          }}
        >
          <div
            className="tactical-panel"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '24px',
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--border-strong)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: '16px', margin: 0, color: 'var(--text-primary)' }}>
                EDIT REWARD: {editingReward.item_name}
              </h3>
              <button
                onClick={() => setEditingReward(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRewardConfig} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'var(--font-display)' }}>
                  BASE PROBABILITY (0.0001 TO 1.0000)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  max="1"
                  value={editProb}
                  onChange={(e) => setEditProb(e.target.value)}
                  className="tactical-input"
                  style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                  required
                />
                <span style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: 2, display: 'block' }}>
                  Equivalent: {(parseFloat(editProb || 0) * 100).toFixed(2)}%
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'var(--font-display)' }}>
                  GLOBAL SUPPLY CAP (LEAVE BLANK FOR UNLIMITED)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={editSupply}
                  onChange={(e) => setEditSupply(e.target.value)}
                  placeholder="Unlimited"
                  className="tactical-input"
                  style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>
                  Current Awarded: {editingReward.awarded_count} copies
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  id="rewardActiveCheck"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                />
                <label htmlFor="rewardActiveCheck" style={{ fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Active on Luck Royale Wheel
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setEditingReward(null)}
                  className="tactical-btn tactical-btn-secondary"
                  style={{ padding: '8px 14px' }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="tactical-btn tactical-btn-primary"
                  style={{ padding: '8px 18px' }}
                >
                  SAVE CONFIGURATION
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockModalOffer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => setRestockModalOffer(null)}
        >
          <div
            className="tactical-panel"
            style={{ width: '100%', maxWidth: '380px', padding: '20px', backgroundColor: 'var(--bg-panel)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: 'var(--text-primary)' }}>
              RESTOCK: {restockModalOffer.item_name}
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Authorize additional physical supply units into the depot inventory limit.
            </p>

            <form onSubmit={handleRestockSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                  ADD UNITS TO STOCK LIMIT
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={addStockAmount}
                  onChange={(e) => setAddStockAmount(e.target.value)}
                  className="tactical-input"
                  style={{ width: '100%', padding: '8px 12px', fontSize: '14px', fontFamily: 'var(--font-mono)' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setRestockModalOffer(null)}
                  className="tactical-btn tactical-btn-secondary"
                  style={{ flex: 1 }}
                >
                  CANCEL
                </button>
                <button type="submit" className="tactical-btn tactical-btn-primary" style={{ flex: 1 }}>
                  CONFIRM RESTOCK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;

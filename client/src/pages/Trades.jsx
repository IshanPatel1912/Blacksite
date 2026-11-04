import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import { CreateTradeModal } from '../components/modals/CreateTradeModal';
import { ItemVisual } from '../components/common/ItemVisual';
import {
  Repeat,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Coins,
  ArrowRight,
  RefreshCw,
  User,
  ShieldAlert,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle
} from 'lucide-react';

export function Trades() {
  const { activePlayerId, refreshPlayerData, dbStatus } = usePlayer();
  const { addNotification } = useNotification();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL', 'pending', 'accepted', 'declined', 'cancelled'
  const [processingId, setProcessingId] = useState(null);

  const loadTrades = async () => {
    try {
      setLoading(true);
      const res = await api.getTrades(activePlayerId, activeTab);
      if (res.success) {
        setTrades(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load trades:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrades();
  }, [activePlayerId, activeTab, dbStatus.connected]);

  const handleAccept = async (tradeId) => {
    try {
      setProcessingId(tradeId);
      const res = await api.acceptTrade(tradeId, activePlayerId);
      if (res.success) {
        addNotification(res.message || 'Trade executed successfully!', 'success');
        refreshPlayerData();
        loadTrades();
      }
    } catch (err) {
      addNotification(err.message || 'Failed to accept trade', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (tradeId) => {
    try {
      setProcessingId(tradeId);
      const res = await api.declineTrade(tradeId, activePlayerId);
      if (res.success) {
        addNotification(res.message || 'Trade proposal declined', 'info');
        loadTrades();
      }
    } catch (err) {
      addNotification(err.message || 'Failed to decline trade', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (tradeId) => {
    try {
      setProcessingId(tradeId);
      const res = await api.cancelTrade(tradeId, activePlayerId);
      if (res.success) {
        addNotification(res.message || 'Trade proposal cancelled', 'info');
        loadTrades();
      }
    } catch (err) {
      addNotification(err.message || 'Failed to cancel trade', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const incomingPending = trades.filter((t) => t.receiver_id === activePlayerId && t.status === 'pending');
  const outgoingPending = trades.filter((t) => t.initiator_id === activePlayerId && t.status === 'pending');
  const totalCompleted = trades.filter((t) => t.status === 'accepted').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="tech-tag">ESCROW SYSTEM</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>// SECURE P2P TRADING</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '0.04em', margin: 0, color: 'var(--text-primary)' }}>
            TRADES
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Barter tactical gear and currency bundles directly with other operators via atomic transactions.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            className="tactical-btn tactical-btn-primary"
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            <PlusCircle size={15} />
            PROPOSE TRADE
          </button>
          <button
            onClick={loadTrades}
            className="tactical-btn tactical-btn-secondary"
            title="Refresh trades"
            style={{ padding: '8px 12px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
        }}
      >
        <div className="tactical-panel" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>INCOMING PROPOSALS</span>
            <ArrowDownLeft size={16} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#38bdf8', marginTop: '6px' }}>
            {incomingPending.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Awaiting your review & approval
          </div>
        </div>

        <div className="tactical-panel" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>OUTGOING OFFERS</span>
            <ArrowUpRight size={16} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '6px' }}>
            {outgoingPending.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Awaiting recipient response
          </div>
        </div>

        <div className="tactical-panel" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>EXECUTED TRADES</span>
            <CheckCircle2 size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#10b981', marginTop: '6px' }}>
            {totalCompleted}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Successfully settled & transferred
          </div>
        </div>
      </div>

      {/* Tabs Filter */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-dim)', paddingBottom: '10px' }}>
        {[
          { id: 'ALL', label: 'ALL TRADES' },
          { id: 'pending', label: 'PENDING' },
          { id: 'accepted', label: 'ACCEPTED' },
          { id: 'declined', label: 'DECLINED' },
          { id: 'cancelled', label: 'CANCELLED' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="tactical-btn tactical-btn-secondary"
            style={{
              fontSize: '11px',
              padding: '6px 14px',
              backgroundColor: activeTab === tab.id ? 'rgba(255, 133, 0, 0.14)' : 'transparent',
              borderColor: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--border-dim)',
              color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.id ? 700 : 500,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Trades List */}
      {trades.length === 0 ? (
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
          <Repeat size={36} color="var(--text-muted)" style={{ opacity: 0.5 }} />
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
            No Trades Found in This Category
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', maxWidth: '400px' }}>
            Propose a new item or currency trade with fellow operators, or switch tabs to view other records.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="tactical-btn tactical-btn-primary"
            style={{ marginTop: '8px', padding: '8px 18px', fontSize: '12px' }}
          >
            <PlusCircle size={15} />
            PROPOSE TRADE NOW
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {trades.map((t) => {
            const isIncoming = t.receiver_id === activePlayerId;
            const isPending = t.status === 'pending';
            const isProcessing = processingId === t.trade_id;

            const statusColors = {
              pending: { bg: 'rgba(245, 158, 11, 0.12)', border: '#f59e0b', text: '#f59e0b', label: 'PENDING ACTION' },
              accepted: { bg: 'rgba(16, 185, 129, 0.12)', border: '#10b981', text: '#10b981', label: 'SETTLED & COMPLETE' },
              declined: { bg: 'rgba(239, 68, 68, 0.12)', border: '#ef4444', text: '#ef4444', label: 'DECLINED' },
              cancelled: { bg: 'rgba(148, 163, 184, 0.12)', border: '#64748b', text: '#94a3b8', label: 'CANCELLED' },
            };

            const currentStatus = statusColors[t.status] || statusColors.pending;

            return (
              <div
                key={t.trade_id}
                className="tactical-panel"
                style={{
                  padding: '20px',
                  borderLeft: `4px solid ${currentStatus.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {/* Trade Top Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      TRADE PROTOCOL #{t.trade_id}
                    </span>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: currentStatus.bg,
                        color: currentStatus.text,
                        fontSize: '11px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        border: `1px solid ${currentStatus.border}`,
                      }}
                    >
                      {currentStatus.label}
                    </span>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: isIncoming ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 133, 0, 0.1)',
                        color: isIncoming ? '#38bdf8' : 'var(--accent-primary)',
                        fontSize: '11px',
                        fontWeight: 600,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {isIncoming ? 'INCOMING OFFER' : 'OUTGOING PROPOSAL'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    <Clock size={12} />
                    {new Date(t.created_at).toLocaleString()}
                  </div>
                </div>

                {/* Split Workspace: Initiator Offer vs Recipient */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(280px, 1fr) auto minmax(280px, 1fr)',
                    gap: '16px',
                    alignItems: 'stretch',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-dim)',
                    borderRadius: 'var(--radius-xs)',
                    padding: '16px',
                  }}
                >
                  {/* Left Column: Initiator Offer */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: t.initiator_id === activePlayerId ? 'rgba(255, 133, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: t.initiator_id === activePlayerId ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        }}
                      >
                        <User size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          OFFERED BY
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {t.initiator_name || `Operator #${t.initiator_id}`}
                          {t.initiator_id === activePlayerId && (
                            <span style={{ color: 'var(--accent-primary)', marginLeft: '6px', fontSize: '11px' }}>(YOU)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>
                      PLEDGED ASSETS:
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {t.items?.map((item) => (
                        <div
                          key={item.trade_item_id || item.item_instance_id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            backgroundColor: 'var(--bg-panel)',
                            border: '1px solid var(--border-dim)',
                            borderRadius: 'var(--radius-xs)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '48px', height: '36px', flexShrink: 0, borderRadius: 'var(--radius-xs)', overflow: 'hidden' }}>
                              <ItemVisual item={item} size="sm" showRarityGlow={false} />
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {item.item_name}
                              </div>
                              <span className={`rarity-badge rarity-${item.rarity}`} style={{ fontSize: '9px', padding: '1px 5px' }}>
                                {item.rarity}
                              </span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                            COND: {item.durability}%
                          </div>
                        </div>
                      ))}

                      {t.currencies?.map((curr) => (
                        <div
                          key={curr.trade_currency_id || curr.currency_id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            backgroundColor: 'var(--bg-panel)',
                            border: '1px solid var(--border-dim)',
                            borderRadius: 'var(--radius-xs)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
                            <Coins size={14} />
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {curr.currency_name || 'Funds'}
                            </span>
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                            +{parseFloat(curr.amount || 0).toLocaleString()} {curr.currency_symbol || 'CR'}
                          </div>
                        </div>
                      ))}

                      {(!t.items || t.items.length === 0) && (!t.currencies || t.currencies.length === 0) && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
                          No items or currency bundles attached.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Center Column: Transfer Escrow Direction */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 12px',
                      borderLeft: '1px solid var(--border-dim)',
                      borderRight: '1px solid var(--border-dim)',
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--bg-panel)',
                        border: '1px solid var(--border-dim)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-primary)',
                      }}
                    >
                      <ArrowRight size={18} />
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        color: 'var(--text-muted)',
                        marginTop: '8px',
                        letterSpacing: '0.05em',
                        textAlign: 'center',
                      }}
                    >
                      ATOMIC ESCROW
                    </span>
                  </div>

                  {/* Right Column: Recipient Target */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: t.receiver_id === activePlayerId ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: t.receiver_id === activePlayerId ? '#38bdf8' : 'var(--text-secondary)',
                        }}
                      >
                        <User size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          RECIPIENT OPERATOR
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {t.receiver_name || `Operator #${t.receiver_id}`}
                          {t.receiver_id === activePlayerId && (
                            <span style={{ color: '#38bdf8', marginLeft: '6px', fontSize: '11px' }}>(YOU)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>
                      SETTLEMENT STATUS:
                    </div>

                    <div
                      style={{
                        backgroundColor: 'var(--bg-panel)',
                        border: '1px solid var(--border-dim)',
                        borderRadius: 'var(--radius-xs)',
                        padding: '12px',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                    >
                      {t.status === 'accepted' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
                          <CheckCircle2 size={16} />
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>Assets successfully transferred</span>
                        </div>
                      ) : t.status === 'declined' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                          <XCircle size={16} />
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>Proposal declined by recipient</span>
                        </div>
                      ) : t.status === 'cancelled' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                          <AlertCircle size={16} />
                          <span style={{ fontSize: '12px' }}>Proposal cancelled by initiator</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b' }}>
                          <Clock size={16} />
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>
                            {isIncoming ? 'Your decision required' : 'Awaiting recipient response'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons for Pending Status */}
                {isPending && (
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-dim)', paddingTop: '14px' }}>
                    {isIncoming ? (
                      <>
                        <button
                          onClick={() => handleDecline(t.trade_id)}
                          disabled={isProcessing}
                          className="tactical-btn tactical-btn-danger"
                          style={{ padding: '8px 16px', fontSize: '11px' }}
                        >
                          <XCircle size={14} />
                          DECLINE OFFER
                        </button>
                        <button
                          onClick={() => handleAccept(t.trade_id)}
                          disabled={isProcessing}
                          className="tactical-btn tactical-btn-primary"
                          style={{ padding: '8px 18px', fontSize: '11px' }}
                        >
                          <CheckCircle2 size={14} />
                          {isProcessing ? 'EXECUTING TRANSACTION...' : 'ACCEPT & EXECUTE'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleCancel(t.trade_id)}
                        disabled={isProcessing}
                        className="tactical-btn tactical-btn-secondary"
                        style={{ padding: '8px 16px', fontSize: '11px' }}
                      >
                        <XCircle size={14} />
                        CANCEL PROPOSAL
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <CreateTradeModal
          onClose={() => setShowCreateModal(false)}
          onCreated={loadTrades}
        />
      )}
    </div>
  );
}

export default Trades;
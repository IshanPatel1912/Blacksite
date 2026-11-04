import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import {
  Wallet,
  Coins,
  Shield,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  PlusCircle,
  CreditCard,
  History,
  Lock,
  ArrowDownLeft,
  DollarSign,
  Layers,
  Sparkles
} from 'lucide-react';

export function Wallets() {
  const { activePlayerId, wallets, refreshPlayerData, dbStatus } = usePlayer();
  const { addNotification } = useNotification();
  const [currencies, setCurrencies] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fundingCurrencyId, setFundingCurrencyId] = useState(null);
  const [fundingAmount, setFundingAmount] = useState('500');
  const [showFundModal, setShowFundModal] = useState(false);
  const [submittingFund, setSubmittingFund] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [currRes, transRes] = await Promise.all([
        api.getCurrencies().catch(() => ({ success: false })),
        api.getWalletTransactions(activePlayerId).catch(() => ({ success: false, data: [] }))
      ]);

      if (currRes.success) setCurrencies(currRes.data || []);
      if (transRes.success) setTransactions(transRes.data || []);
    } catch (err) {
      console.error('Failed to load wallet data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activePlayerId, dbStatus.connected]);

  // Calculate Net Worth: Soft tokens (1:1 standard scrip) + Premium tokens (at 10x scrip equivalent)
  const softWallet = wallets.find((w) => !w.is_premium);
  const premiumWallet = wallets.find((w) => w.is_premium);

  const softBalance = parseFloat(softWallet?.balance || 0);
  const premiumBalance = parseFloat(premiumWallet?.balance || 0);
  const estimatedNetWorthScrip = softBalance + (premiumBalance * 10);

  const handleOpenFundModal = (currencyId, defaultAmt = '500') => {
    setFundingCurrencyId(currencyId);
    setFundingAmount(defaultAmt);
    setShowFundModal(true);
  };

  const handleFundSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(fundingAmount);
    if (isNaN(amt) || amt <= 0) {
      addNotification('Please enter a valid positive amount.', 'error');
      return;
    }

    try {
      setSubmittingFund(true);
      const res = await api.fundWallet({
        playerId: activePlayerId,
        currencyId: fundingCurrencyId,
        amount: amt,
      });

      if (res.success) {
        addNotification(res.message, 'success');
        setShowFundModal(false);
        refreshPlayerData();
        loadData();
      }
    } catch (err) {
      addNotification(err.message || 'Funding failed', 'error');
    } finally {
      setSubmittingFund(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="tech-tag">FISCAL ACCOUNTS</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>// MULTI-TIER LEDGER</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '0.04em', margin: 0, color: 'var(--text-primary)' }}>
            WALLET
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Real-time player balances across standard military scrip and encrypted premium tokens.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => handleOpenFundModal(softWallet?.currency_id || 1, '1000')}
            className="tactical-btn tactical-btn-primary"
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            <PlusCircle size={15} />
            REQUEST STIPEND
          </button>
          <button
            onClick={() => { refreshPlayerData(); loadData(); }}
            className="tactical-btn tactical-btn-secondary"
            title="Refresh wallet balances"
            style={{ padding: '8px 12px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Top Net Worth Overview Banner */}
      <div
        className="tactical-panel"
        style={{
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(255, 133, 0, 0.08) 0%, rgba(20, 24, 34, 0.95) 100%)',
          border: '1px solid var(--border-medium)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
            TOTAL ESTIMATED NET WORTH
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            {estimatedNetWorthScrip.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            <span style={{ fontSize: '15px', color: 'var(--accent-primary)', marginLeft: '8px', fontWeight: 700 }}>
              CR-EQ
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Consolidated valuation (1 Premium Coin = 10 Scrip CR)
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div
            style={{
              flex: 1,
              minWidth: '160px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-dim)',
              borderRadius: 'var(--radius-xs)',
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              STANDARD SCRIP (SOFT)
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
              {softBalance.toLocaleString()} {softWallet?.symbol || 'CR'}
            </div>
            <div style={{ fontSize: '10px', color: '#10b981', marginTop: '2px' }}>
              Used for repairs & regular gear
            </div>
          </div>

          <div
            style={{
              flex: 1,
              minWidth: '160px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid rgba(255, 133, 0, 0.3)',
              borderRadius: 'var(--radius-xs)',
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
              PREMIUM COINS (HARD)
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
              {premiumBalance.toLocaleString()} {premiumWallet?.symbol || 'BC'}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Used for exotic supply drops & high-tier trades
            </div>
          </div>
        </div>
      </div>

      {/* Primary Currency Accounts Cards */}
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', letterSpacing: '0.04em' }}>
          CURRENCY ACCOUNTS
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {wallets.map((wallet) => {
            const isPrem = wallet.is_premium;
            return (
              <div
                key={wallet.wallet_id}
                className="tactical-panel"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: isPrem ? '1px solid var(--accent-primary)' : '1px solid var(--border-medium)',
                  backgroundColor: isPrem ? 'rgba(255, 133, 0, 0.03)' : 'var(--bg-panel)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isPrem && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '4px',
                      height: '100%',
                      backgroundColor: 'var(--accent-primary)',
                    }}
                  />
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: isPrem ? 'rgba(255, 133, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isPrem ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        }}
                      >
                        <Coins size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {wallet.currency_name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          WALLET ID: #{wallet.wallet_id}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: isPrem ? 'rgba(255, 133, 0, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                        color: isPrem ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        fontSize: '10px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {isPrem ? 'PREMIUM TIER' : 'STANDARD TIER'}
                    </span>
                  </div>

                  {/* Balance */}
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      CONFIRMED LEDGER BALANCE
                    </div>
                    <div
                      style={{
                        fontSize: '30px',
                        fontWeight: 700,
                        color: isPrem ? 'var(--accent-primary)' : 'var(--text-primary)',
                        marginTop: '4px',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {parseFloat(wallet.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span style={{ fontSize: '14px', marginLeft: '6px', color: 'var(--text-muted)' }}>
                        {wallet.symbol}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px', lineHeight: 1.5 }}>
                    {wallet.currency_description ||
                      (isPrem
                        ? 'Hard tokens used for exclusive store bundles and premium marketplace trading.'
                        : 'Standard tactical credits earned through operations, used for supplies and gear maintenance.')}
                  </p>
                </div>

                {/* Footer Controls */}
                <div
                  style={{
                    marginTop: '20px',
                    paddingTop: '14px',
                    borderTop: '1px solid var(--border-dim)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    SYNCED: {new Date(wallet.updated_at).toLocaleTimeString()}
                  </span>

                  <button
                    onClick={() => handleOpenFundModal(wallet.currency_id, isPrem ? '100' : '500')}
                    className="tactical-btn tactical-btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '11px' }}
                  >
                    <PlusCircle size={13} />
                    ALLOCATE FUNDS
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction & Activity Log Section */}
      <div className="tactical-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              RECENT WALLET TRANSACTIONS
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            RECORDED IN ATOMIC AUDIT LOG
          </span>
        </div>

        {transactions.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No recent financial transactions found for this operator.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                  <th style={{ padding: '8px 12px' }}>EVENT / ACTION</th>
                  <th style={{ padding: '8px 12px' }}>DESCRIPTION</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>DATE & TIME</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  let parsedDetails = {};
                  try {
                    parsedDetails = typeof tx.details === 'string' ? JSON.parse(tx.details) : tx.details || {};
                  } catch (e) {
                    parsedDetails = { raw: tx.details };
                  }

                  const actionLabels = {
                    WALLET_FUNDED: { label: 'FUNDS ALLOCATED', color: '#10b981' },
                    STORE_PURCHASE: { label: 'STORE PURCHASE', color: 'var(--accent-primary)' },
                    MARKETPLACE_BUY: { label: 'MARKETPLACE BUY', color: '#38bdf8' },
                    MARKETPLACE_SOLD: { label: 'MARKETPLACE SALE', color: '#10b981' },
                    TRADE_EXECUTED: { label: 'P2P TRADE SETTLED', color: '#a855f7' },
                    ITEM_REPAIRED: { label: 'ARMORY REPAIR', color: '#f59e0b' },
                  };

                  const badge = actionLabels[tx.action_type] || { label: tx.action_type, color: 'var(--text-secondary)' };

                  return (
                    <tr
                      key={tx.log_id}
                      style={{
                        borderBottom: '1px solid var(--border-dim)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '10px 12px' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: `${badge.color}22`,
                            color: badge.color,
                            fontSize: '10px',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-primary)' }}>
                        {tx.action_type === 'WALLET_FUNDED' && (
                          <span>Requisitioned +{parsedDetails.amount?.toLocaleString()} funds</span>
                        )}
                        {tx.action_type === 'STORE_PURCHASE' && (
                          <span>Store offer #{parsedDetails.offer_id || ''} for {parsedDetails.price} credits</span>
                        )}
                        {tx.action_type === 'MARKETPLACE_BUY' && (
                          <span>Purchased marketplace item #{parsedDetails.listing_id || ''}</span>
                        )}
                        {tx.action_type === 'MARKETPLACE_SOLD' && (
                          <span>Sold listing #{parsedDetails.listing_id || ''} to buyer</span>
                        )}
                        {tx.action_type === 'TRADE_EXECUTED' && (
                          <span>Settled bilateral trade protocol #{parsedDetails.trade_id || ''}</span>
                        )}
                        {tx.action_type === 'ITEM_REPAIRED' && (
                          <span>Repaired weapon/gear to 100% durability</span>
                        )}
                        {!['WALLET_FUNDED', 'STORE_PURCHASE', 'MARKETPLACE_BUY', 'MARKETPLACE_SOLD', 'TRADE_EXECUTED', 'ITEM_REPAIRED'].includes(tx.action_type) && (
                          <span style={{ color: 'var(--text-muted)' }}>{JSON.stringify(parsedDetails)}</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Requisition / Fund Wallet Modal */}
      {showFundModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => setShowFundModal(false)}
        >
          <div
            className="tactical-panel"
            style={{
              width: '100%',
              maxWidth: '420px',
              padding: '24px',
              border: '1px solid var(--border-medium)',
              backgroundColor: 'var(--bg-panel)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Coins size={18} color="var(--accent-primary)" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  REQUISITION FUNDS
                </h3>
              </div>
              <button
                onClick={() => setShowFundModal(false)}
                className="tactical-btn tactical-btn-secondary"
                style={{ padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFundSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                  TARGET CURRENCY
                </label>
                <select
                  value={fundingCurrencyId || ''}
                  onChange={(e) => setFundingCurrencyId(parseInt(e.target.value, 10))}
                  className="tactical-input"
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
                >
                  {wallets.map((w) => (
                    <option key={w.currency_id} value={w.currency_id}>
                      {w.currency_name} ({w.symbol}) - Current: {parseFloat(w.balance).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                  AMOUNT TO ALLOCATE
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={fundingAmount}
                  onChange={(e) => setFundingAmount(e.target.value)}
                  className="tactical-input"
                  style={{ width: '100%', padding: '8px 12px', fontSize: '14px', fontFamily: 'var(--font-mono)' }}
                  placeholder="500"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {['100', '500', '1000', '5000'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setFundingAmount(preset)}
                    className="tactical-btn tactical-btn-secondary"
                    style={{ flex: 1, padding: '4px', fontSize: '11px' }}
                  >
                    +{preset}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowFundModal(false)}
                  className="tactical-btn tactical-btn-secondary"
                  style={{ flex: 1, padding: '8px' }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submittingFund}
                  className="tactical-btn tactical-btn-primary"
                  style={{ flex: 1, padding: '8px' }}
                >
                  {submittingFund ? 'PROCESSING...' : 'CONFIRM DEPOSIT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Wallets;
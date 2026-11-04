import React, { useState, useEffect } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { useNotification } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { X, Repeat, Coins, Package, CheckSquare, Square } from 'lucide-react';

export function CreateTradeModal({ onClose, onCreated }) {
  const { activePlayerId, playersList, wallets } = usePlayer();
  const { addNotification } = useNotification();

  const [receiverId, setReceiverId] = useState('');
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [offeredCurrencyId, setOfferedCurrencyId] = useState(1);
  const [currencyAmount, setCurrencyAmount] = useState('0');
  const [loading, setLoading] = useState(false);

  // Available trading partners (exclude active player)
  const tradingPartners = playersList.filter((p) => p.player_id !== activePlayerId);

  useEffect(() => {
    if (tradingPartners.length > 0 && !receiverId) {
      setReceiverId(tradingPartners[0].player_id);
    }
  }, [tradingPartners, receiverId]);

  // Load eligible items from inventory
  useEffect(() => {
    async function loadItems() {
      try {
        const res = await api.getInventory({
          playerId: activePlayerId,
          availability: 'AVAILABLE',
          tradable: 'true',
        });
        if (res.success) {
          setAvailableItems(res.data.filter((i) => i.durability > 0));
        }
      } catch (err) {
        // Handled
      }
    }
    loadItems();
  }, [activePlayerId]);

  const toggleSelectItem = (id) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!receiverId) {
      addNotification('Please select a recipient operator.', 'error');
      return;
    }

    const numericAmount = parseFloat(currencyAmount) || 0;
    if (selectedItemIds.length === 0 && numericAmount <= 0) {
      addNotification('Trade proposal must contain at least one item or currency amount.', 'error');
      return;
    }

    // Verify wallet balance if currency offered
    if (numericAmount > 0) {
      const activeWallet = wallets.find((w) => w.currency_id === offeredCurrencyId);
      if (!activeWallet || parseFloat(activeWallet.balance) < numericAmount) {
        addNotification('Insufficient currency balance in wallet for proposed trade.', 'error');
        return;
      }
    }

    try {
      setLoading(true);
      const payload = {
        initiatorId: activePlayerId,
        receiverId: parseInt(receiverId, 10),
        itemInstanceIds: selectedItemIds,
        currencyOffers: numericAmount > 0 ? [{ currencyId: offeredCurrencyId, amount: numericAmount }] : [],
      };

      const res = await api.createTrade(payload);
      if (res.success) {
        addNotification(res.message, 'success');
        onCreated?.();
        onClose();
      }
    } catch (err) {
      addNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 510,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="tactical-panel tactical-corners"
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: 'var(--bg-panel)',
          border: '1px solid var(--border-strong)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="tech-tag">BILATERAL TRADE // SECURE PROTOCOL</div>
            <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: 2 }}>
              PROPOSE NEW TRADE
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Recipient Selection */}
          <div>
            <label className="tech-tag" style={{ display: 'block', marginBottom: 6 }}>
              SELECT RECIPIENT OPERATOR
            </label>
            <select
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
              className="tactical-select"
              style={{ width: '100%' }}
            >
              {tradingPartners.map((p) => (
                <option key={p.player_id} value={p.player_id}>
                  {p.username} ({p.status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Select Items to Offer */}
          <div>
            <label className="tech-tag" style={{ display: 'block', marginBottom: 6 }}>
              OFFER ARMORY ITEMS ({selectedItemIds.length} SELECTED)
            </label>
            <div
              style={{
                maxHeight: '160px',
                overflowY: 'auto',
                border: '1px solid var(--border-dim)',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--bg-surface)',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              {availableItems.length > 0 ? (
                availableItems.map((item) => {
                  const isSelected = selectedItemIds.includes(item.item_instance_id);
                  return (
                    <div
                      key={item.item_instance_id}
                      onClick={() => toggleSelectItem(item.item_instance_id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        background: isSelected ? 'rgba(255, 132, 0, 0.15)' : 'var(--bg-panel)',
                        border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-dim)',
                        borderRadius: 'var(--radius-xs)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isSelected ? (
                          <CheckSquare size={14} color="var(--accent-primary)" />
                        ) : (
                          <Square size={14} color="var(--text-muted)" />
                        )}
                        <span className={`rarity-badge rarity-${item.rarity}`}>{item.rarity}</span>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{item.item_name}</span>
                      </div>
                      <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        DUR: {item.durability}%
                      </span>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  No tradable items currently eligible in armory.
                </div>
              )}
            </div>
          </div>

          {/* Currency Offer */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="tech-tag" style={{ display: 'block', marginBottom: 6 }}>
                OFFER CURRENCY
              </label>
              <select
                value={offeredCurrencyId}
                onChange={(e) => setOfferedCurrencyId(parseInt(e.target.value, 10))}
                className="tactical-select"
                style={{ width: '100%' }}
              >
                {wallets.map((w) => (
                  <option key={w.currency_id} value={w.currency_id}>
                    {w.currency_name} ({w.symbol}) — Avail: {parseFloat(w.balance || 0).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="tech-tag" style={{ display: 'block', marginBottom: 6 }}>
                AMOUNT TO PLEDGE
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={currencyAmount}
                onChange={(e) => setCurrencyAmount(e.target.value)}
                className="tactical-input"
                style={{ width: '100%' }}
                placeholder="0"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              className="tactical-btn tactical-btn-secondary"
              style={{ flex: 1 }}
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              className="tactical-btn tactical-btn-primary"
              style={{ flex: 2 }}
            >
              <Repeat size={14} />
              DISPATCH PROPOSAL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

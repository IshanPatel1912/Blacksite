import React, { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { useNotification } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { ItemVisual } from '../common/ItemVisual';
import { X, Tag, DollarSign, CheckCircle, AlertTriangle } from 'lucide-react';

export function CreateListingModal({ item, onClose, onCreated }) {
  const { activePlayerId, wallets } = usePlayer();
  const { addNotification } = useNotification();
  const [currencyId, setCurrencyId] = useState(1); // 1 = Credits, 2 = Blacksite Tokens
  const [price, setPrice] = useState('1000');
  const [loading, setLoading] = useState(false);

  if (!item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      addNotification('Please enter a valid positive listing price.', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await api.createMarketListing(
        activePlayerId,
        item.item_instance_id,
        currencyId,
        numericPrice
      );
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
          maxWidth: '460px',
          backgroundColor: 'var(--bg-panel)',
          border: '1px solid var(--border-strong)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="tech-tag">P2P EXCHANGE // NEW LISTING</div>
            <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: 2 }}>
              LIST {item.item_name}
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
          <ItemVisual item={item} size="sm" />

          {/* Item Preview Summary */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-dim)',
            }}
          >
            <div>
              <span className={`rarity-badge rarity-${item.rarity}`}>{item.rarity}</span>
              <span style={{ marginLeft: 8, fontSize: '13px', fontWeight: 600 }}>
                {item.item_name}
              </span>
            </div>
            <span className="font-mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              DUR: {item.durability}%
            </span>
          </div>

          {/* Currency Selection */}
          <div>
            <label className="tech-tag" style={{ display: 'block', marginBottom: 6 }}>
              DENOMINATE ASKING CURRENCY
            </label>
            <select
              value={currencyId}
              onChange={(e) => setCurrencyId(parseInt(e.target.value, 10))}
              className="tactical-select"
              style={{ width: '100%' }}
            >
              {wallets.length > 0 ? (
                wallets.map((w) => (
                  <option key={w.currency_id} value={w.currency_id}>
                    {w.currency_name} ({w.symbol}) {w.is_premium ? '— Premium' : '— Standard'}
                  </option>
                ))
              ) : (
                <>
                  <option value="1">Combat Credits (CR) - Standard</option>
                  <option value="2">Blacksite Tokens (BST) - Premium Tier</option>
                </>
              )}
            </select>
          </div>

          {/* Asking Price Input */}
          <div>
            <label className="tech-tag" style={{ display: 'block', marginBottom: 6 }}>
              ASKING UNIT PRICE
            </label>
            <input
              type="number"
              step="any"
              min="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="tactical-input"
              style={{ width: '100%', fontSize: '15px' }}
              placeholder="Enter price..."
              required
            />
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
              <Tag size={14} />
              PUBLISH LISTING
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

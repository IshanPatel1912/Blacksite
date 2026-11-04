import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import { ItemVisual } from '../components/common/ItemVisual';
import {
  ShoppingBag,
  Coins,
  Shield,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  X,
  Package,
} from 'lucide-react';

export function SupplyDepot() {
  const { activePlayerId, wallets, refreshPlayerData, dbStatus } = usePlayer();
  const { addNotification } = useNotification();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingOffer, setConfirmingOffer] = useState(null);
  const [purchasing, setPurchasing] = useState(false);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const res = await api.getStoreOffers();
      if (res.success) {
        setOffers(res.data);
      }
    } catch (err) {
      console.error('Failed to load store offers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, [dbStatus.connected]);

  const handleConfirmPurchase = async () => {
    if (!confirmingOffer) return;

    try {
      setPurchasing(true);
      const res = await api.purchaseStoreOffer(activePlayerId, confirmingOffer.offer_id);
      if (res.success) {
        addNotification(res.message, 'success');
        refreshPlayerData();
        setConfirmingOffer(null);
        loadOffers();
      }
    } catch (err) {
      addNotification(err.message, 'error');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '24px 28px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="tech-tag">ORDNANCE PROCUREMENT // SUPPLY DEPOT</div>
          <h1 style={{ fontSize: '24px', color: 'var(--text-primary)', marginTop: 2 }}>
            STORE
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 2 }}>
            Acquire official military armory drops, prototype weapon blueprints, and tactical equipment.
          </p>
        </div>

        <button onClick={loadOffers} className="tactical-btn tactical-btn-secondary">
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          REFRESH STORE
        </button>
      </div>

      {/* Store Offers Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 18,
        }}
      >
        {offers.map((offer) => {
          const isSoldOut = offer.status === 'sold_out' || offer.remaining_stock <= 0;
          const wallet = wallets?.find((w) => w.currency_id === offer.currency_id);
          const price = parseFloat(offer.price);
          const canAfford = wallet && parseFloat(wallet.balance) >= price;

          let rarityBorder = 'var(--border-dim)';
          if (offer.rarity === 'Mythic') rarityBorder = 'var(--rarity-mythic)';
          else if (offer.rarity === 'Legendary') rarityBorder = 'var(--rarity-legendary)';
          else if (offer.rarity === 'Epic') rarityBorder = 'var(--rarity-epic)';
          else if (offer.rarity === 'Rare') rarityBorder = 'var(--rarity-rare)';
          else if (offer.rarity === 'Uncommon') rarityBorder = 'var(--rarity-uncommon)';
          else if (offer.rarity === 'Common') rarityBorder = 'var(--rarity-common)';

          return (
            <div
              key={offer.offer_id}
              className="tactical-panel"
              style={{
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderTop: `3px solid ${rarityBorder}`,
                opacity: isSoldOut ? 0.65 : 1,
              }}
            >
              <div>
                {/* Rarity & Stock Remaining Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`rarity-badge rarity-${offer.rarity}`}>{offer.rarity}</span>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: '11px',
                      color: isSoldOut ? '#ef4444' : '#10b981',
                      fontWeight: 700,
                    }}
                  >
                    {isSoldOut ? 'SOLD OUT' : `${offer.remaining_stock} OF ${offer.stock_limit} LEFT`}
                  </span>
                </div>

                {/* Visual Item Image */}
                <div style={{ marginTop: 10 }}>
                  <ItemVisual item={offer} size="md" />
                </div>

                {/* Title & Description */}
                <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginTop: 10, fontWeight: 700 }}>
                  {offer.item_name}
                </h3>

                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5, minHeight: '36px' }}>
                  {offer.item_description || 'High-grade military tactical asset ready for field deployment.'}
                </p>

                {/* Stock Exhaustion Bar */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: 4 }}>
                    <span className="tech-tag">DEPOT ALLOCATION</span>
                    <span className="font-mono" style={{ color: 'var(--text-muted)' }}>
                      {offer.stock_sold} / {offer.stock_limit} SOLD
                    </span>
                  </div>
                  <div className="durability-bar">
                    <div
                      className="durability-fill"
                      style={{
                        width: `${(offer.stock_sold / offer.stock_limit) * 100}%`,
                        backgroundColor: isSoldOut ? '#ef4444' : 'var(--accent-primary)',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Price & Requisition Button */}
              <div
                style={{
                  marginTop: 18,
                  paddingTop: 12,
                  borderTop: '1px solid var(--border-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div className="tech-tag">PRICE</div>
                  <div
                    className="font-mono"
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: offer.is_premium ? 'var(--text-accent)' : 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      marginTop: 2,
                    }}
                  >
                    <Coins size={14} color={offer.is_premium ? 'var(--accent-primary)' : '#94a3b8'} />
                    {price.toLocaleString()} {offer.currency_symbol}
                  </div>
                </div>

                <button
                  onClick={() => setConfirmingOffer(offer)}
                  disabled={isSoldOut || !canAfford}
                  className={`tactical-btn ${canAfford && !isSoldOut ? 'tactical-btn-primary' : 'tactical-btn-secondary'}`}
                  style={{ padding: '6px 16px', fontSize: '12px' }}
                >
                  {isSoldOut ? 'DEPLETED' : !canAfford ? 'INSUFFICIENT FUNDS' : 'REQUISITION'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Purchase Confirmation Dialog */}
      {confirmingOffer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 600,
            padding: 20,
          }}
          onClick={() => setConfirmingOffer(null)}
        >
          <div
            className="tactical-panel"
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--border-strong)',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="tech-tag">CONFIRM REQUISITION</div>
                <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: 2 }}>
                  ACQUIRE {confirmingOffer.item_name}
                </h3>
              </div>
              <button
                onClick={() => setConfirmingOffer(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <ItemVisual item={confirmingOffer} size="sm" />

            <div
              style={{
                padding: '12px 14px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-dim)',
                borderRadius: 'var(--radius-xs)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span className={`rarity-badge rarity-${confirmingOffer.rarity}`}>{confirmingOffer.rarity}</span>
                <span style={{ fontWeight: 700, fontSize: '13px', marginLeft: 8 }}>{confirmingOffer.item_name}</span>
              </div>
              <div className="font-mono" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-accent)' }}>
                {parseFloat(confirmingOffer.price).toLocaleString()} {confirmingOffer.currency_symbol}
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              This will deduct <strong>{parseFloat(confirmingOffer.price).toLocaleString()} {confirmingOffer.currency_symbol}</strong> from your wallet and immediately transfer the item instance into your Armory Inventory.
            </p>

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setConfirmingOffer(null)}
                className="tactical-btn tactical-btn-secondary"
                style={{ flex: 1 }}
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmPurchase}
                disabled={purchasing}
                className="tactical-btn tactical-btn-primary"
                style={{ flex: 2 }}
              >
                {purchasing ? 'TRANSACTING...' : 'CONFIRM PURCHASE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

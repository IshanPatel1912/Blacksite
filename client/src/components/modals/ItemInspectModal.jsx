import React, { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { useNotification } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { ItemVisual } from '../common/ItemVisual';
import {
  X,
  Shield,
  Wrench,
  Tag,
  Repeat,
  CheckCircle,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export function ItemInspectModal({ item, onClose, onActionCompleted, onOpenListModal }) {
  const { activePlayerId } = usePlayer();
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(false);

  if (!item) return null;

  const isOwner = item.player_id === activePlayerId;
  const isBroken = item.durability <= 0;
  const isListed = item.availability_status === 'LISTED' || item.active_listing_id;
  const isInTrade = item.availability_status === 'IN_TRADE';

  const handleToggleEquip = async () => {
    try {
      setLoading(true);
      const res = await api.equipItem(item.item_instance_id, activePlayerId);
      if (res.success) {
        addNotification(res.message, 'success');
        onActionCompleted?.();
        onClose();
      }
    } catch (err) {
      addNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRepair = async () => {
    try {
      setLoading(true);
      const res = await api.repairItem(item.item_instance_id, activePlayerId);
      if (res.success) {
        addNotification(res.message, 'success');
        onActionCompleted?.();
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
        zIndex: 500,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="tactical-panel tactical-corners"
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: 'var(--bg-panel)',
          border: '1px solid var(--border-strong)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="tech-tag">ITEM SPECIFICATION // INSTANCE #{item.item_instance_id}</div>
            <h2
              style={{
                fontSize: '22px',
                color: 'var(--text-primary)',
                marginTop: 4,
              }}
            >
              {item.item_name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span className={`rarity-badge rarity-${item.rarity}`}>{item.rarity}</span>
              <span className="tech-tag" style={{ color: 'var(--text-secondary)' }}>
                {item.category}
              </span>
              {item.is_tradable ? (
                <span className="tech-tag" style={{ color: '#10b981' }}>
                  TRADABLE
                </span>
              ) : (
                <span className="tech-tag" style={{ color: '#ef4444' }}>
                  NON-TRADABLE
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Large Item Visual Showcase */}
        <ItemVisual item={item} size="lg" />

        {/* Item Description */}
        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            background: 'var(--bg-surface)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-xs)',
            borderLeft: '3px solid var(--accent-primary)',
          }}
        >
          {item.description || 'Standard tactical equipment issued under military field ordnance.'}
        </p>

        {/* Tactical Parameters Matrix */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
            background: 'var(--bg-surface)',
            padding: 14,
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--border-dim)',
          }}
        >
          {/* Durability */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="tech-tag">INTEGRITY (DURABILITY)</span>
              <span
                className="font-mono"
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: item.durability > 50 ? '#10b981' : item.durability > 20 ? '#f59e0b' : '#ef4444',
                }}
              >
                {item.durability}%
              </span>
            </div>
            <div className="durability-bar">
              <div
                className="durability-fill"
                style={{
                  width: `${item.durability}%`,
                  backgroundColor:
                    item.durability > 50 ? '#10b981' : item.durability > 20 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
          </div>

          {/* Loadout Status */}
          <div>
            <span className="tech-tag">DEPLOYMENT STATE</span>
            <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600 }}>
              {item.is_equipped ? (
                <span style={{ color: 'var(--accent-primary)' }}>EQUIPPED IN LOADOUT</span>
              ) : isListed ? (
                <span style={{ color: '#38bdf8' }}>LISTED ON MARKET ({item.listing_price} CR)</span>
              ) : isInTrade ? (
                <span style={{ color: '#f59e0b' }}>PLEDGED IN TRADE</span>
              ) : (
                <span style={{ color: '#10b981' }}>READY IN ARMORY</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        {isOwner && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
            {/* Equip / Unequip */}
            <button
              onClick={handleToggleEquip}
              disabled={loading || isListed || isInTrade}
              className={`tactical-btn ${
                item.is_equipped ? 'tactical-btn-secondary' : 'tactical-btn-primary'
              }`}
              style={{ flex: 1 }}
            >
              <Shield size={14} />
              {item.is_equipped ? 'UNEQUIP FROM LOADOUT' : 'EQUIP TO LOADOUT'}
            </button>

            {/* Repair */}
            {item.durability < 100 && (
              <button
                onClick={handleRepair}
                disabled={loading}
                className="tactical-btn tactical-btn-secondary"
                title={`Repair to 100% (Cost: ${(100 - item.durability) * 15} Credits)`}
              >
                <Wrench size={14} />
                REPAIR ({(100 - item.durability) * 15} CR)
              </button>
            )}

            {/* List on Marketplace */}
            {item.is_tradable && !isListed && !isInTrade && (
              <button
                onClick={() => {
                  onClose();
                  onOpenListModal?.(item);
                }}
                disabled={loading || isBroken}
                className="tactical-btn tactical-btn-secondary"
              >
                <Tag size={14} />
                LIST ON MARKET
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

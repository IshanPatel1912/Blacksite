import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../services/api';
import { OperatorShowcase } from '../components/operator/OperatorShowcase';
import { ItemInspectModal } from '../components/modals/ItemInspectModal';
import { CreateListingModal } from '../components/modals/CreateListingModal';
import { ItemVisual } from '../components/common/ItemVisual';
import {
  Shield,
  ShoppingBag,
  ArrowLeftRight,
  Repeat,
  Activity,
  Coins,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  Package,
  Compass,
} from 'lucide-react';

export function Dashboard({ onNavigate }) {
  const { activePlayerId, activePlayer, wallets, dbStatus } = usePlayer();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [listingItem, setListingItem] = useState(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard(activePlayerId);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [activePlayerId, dbStatus.connected]);

  const primaryWallet = wallets?.find((w) => !w.is_premium) || wallets?.[0];
  const premiumWallet = wallets?.find((w) => w.is_premium);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '24px 28px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* 1. Hero Welcome & Quick Action Bar */}
      <div
        className="tactical-panel"
        style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, rgba(24, 29, 42, 0.95) 0%, rgba(13, 16, 23, 0.95) 100%)',
          borderLeft: '4px solid var(--accent-primary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="font-mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              ACTIVE OPERATOR
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#10b981',
                background: 'rgba(16, 185, 129, 0.12)',
                padding: '2px 8px',
                borderRadius: '2px',
              }}
            >
              READY FOR COMBAT
            </span>
          </div>

          <h1
            style={{
              fontSize: '26px',
              color: 'var(--text-primary)',
              marginTop: 4,
              letterSpacing: '0.05em',
            }}
          >
            {activePlayer?.username || data?.player?.username || 'GHOST_ACTUAL'}
          </h1>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 2 }}>
            Armory readiness optimal. Manage loadouts, trade assets on the exchange, or requisition elite drops.
          </p>
        </div>

        {/* Hero Quick Actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigate('inventory')}
            className="tactical-btn tactical-btn-primary"
            style={{ padding: '8px 16px' }}
          >
            <Shield size={15} />
            INVENTORY
          </button>
          <button
            onClick={() => onNavigate('luck-royale')}
            className="tactical-btn tactical-btn-olive"
            style={{ padding: '8px 16px' }}
          >
            <Compass size={15} />
            LUCK ROYALE
          </button>
          <button
            onClick={() => onNavigate('store')}
            className="tactical-btn tactical-btn-secondary"
            style={{ padding: '8px 16px' }}
          >
            <ShoppingBag size={15} />
            SUPPLY DEPOT
          </button>
          <button
            onClick={() => onNavigate('marketplace')}
            className="tactical-btn tactical-btn-secondary"
            style={{ padding: '8px 16px' }}
          >
            <ArrowLeftRight size={15} />
            MARKETPLACE
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {/* Metric 1: Inventory Items */}
        <div
          className="tactical-panel tactical-panel-interactive"
          style={{ padding: '16px 20px' }}
          onClick={() => onNavigate('inventory')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="tech-tag">INVENTORY ASSETS</span>
            <Shield size={16} color="var(--accent-primary)" />
          </div>
          <div className="font-mono" style={{ fontSize: '28px', fontWeight: 700, marginTop: 6, color: 'var(--text-primary)' }}>
            {loading ? '...' : data?.counts?.inventory_count ?? 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>Weapons, vests, & gear</span>
            <ChevronRight size={13} />
          </div>
        </div>

        {/* Metric 2: Active Market Listings */}
        <div
          className="tactical-panel tactical-panel-interactive"
          style={{ padding: '16px 20px' }}
          onClick={() => onNavigate('marketplace')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="tech-tag">ACTIVE LISTINGS</span>
            <ArrowLeftRight size={16} color="#38bdf8" />
          </div>
          <div className="font-mono" style={{ fontSize: '28px', fontWeight: 700, marginTop: 6, color: 'var(--text-primary)' }}>
            {loading ? '...' : data?.counts?.active_listings_count ?? 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>Items for sale by you</span>
            <ChevronRight size={13} />
          </div>
        </div>

        {/* Metric 3: Pending Trades */}
        <div
          className="tactical-panel tactical-panel-interactive"
          style={{ padding: '16px 20px' }}
          onClick={() => onNavigate('trades')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="tech-tag">PENDING TRADES</span>
            <Repeat size={16} color="#f59e0b" />
          </div>
          <div className="font-mono" style={{ fontSize: '28px', fontWeight: 700, marginTop: 6, color: 'var(--text-primary)' }}>
            {loading ? '...' : data?.counts?.pending_trades_count ?? 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>Proposals awaiting action</span>
            <ChevronRight size={13} />
          </div>
        </div>

        {/* Metric 4: Combat Credits */}
        <div
          className="tactical-panel tactical-panel-interactive"
          style={{ padding: '16px 20px' }}
          onClick={() => onNavigate('wallets')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="tech-tag">COMBAT CREDITS</span>
            <Coins size={16} color="var(--accent-primary)" />
          </div>
          <div className="font-mono" style={{ fontSize: '28px', fontWeight: 700, marginTop: 6, color: 'var(--text-accent)' }}>
            {loading ? '...' : parseFloat(primaryWallet?.balance || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>Available soft balance</span>
            <ChevronRight size={13} />
          </div>
        </div>
      </div>

      {/* 3. Main Center Split: 3D Operator Avatar & Equipped Loadout Slots */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1fr) minmax(340px, 1.25fr)',
          gap: 20,
        }}
      >
        {/* Left: Call of Duty Tactical Operator Showcase (2D High-Res) */}
        <OperatorShowcase
          equippedItems={data?.equipped || []}
          activePlayer={activePlayer || data?.player}
          onNavigate={onNavigate}
        />

        {/* Right: Active Loadout Gear Slots & Tactical Breakdown */}
        <div className="tactical-panel" style={{ padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div className="tech-tag">FIELD LOADOUT</div>
                <h2 style={{ fontSize: '16px', color: 'var(--text-primary)', marginTop: 2 }}>
                  ACTIVE EQUIPMENT SLOTS
                </h2>
              </div>
              <span className="font-mono" style={{ fontSize: '12px', color: 'var(--text-accent)' }}>
                {data?.equipped?.length || 0} SLOTS EQUIPPED
              </span>
            </div>

            {/* Gear Slots Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
              {data?.equipped && data.equipped.length > 0 ? (
                data.equipped.map((item) => (
                  <div
                    key={item.item_instance_id}
                    onClick={() => setSelectedItem(item)}
                    className="tactical-panel tactical-panel-interactive"
                    style={{
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderLeft: '3px solid var(--accent-primary)',
                      gap: 8,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span className={`rarity-badge rarity-${item.rarity}`}>{item.rarity}</span>
                        <span className="tech-tag">{item.category}</span>
                      </div>
                      <ItemVisual item={item} size="sm" />
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', marginTop: 8 }}>
                        {item.item_name}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid var(--border-dim)' }}>
                      <span className="font-mono" style={{ fontSize: '11px', color: item.durability > 50 ? '#10b981' : '#f59e0b' }}>
                        INTEGRITY: {item.durability}%
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Eye size={12} /> Inspect
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    padding: '36px',
                    textAlign: 'center',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-xs)',
                  }}
                >
                  <Package size={28} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-secondary)' }}>
                    No Equipment Currently Equipped
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>
                    Select weapons, helmets, and armor from your armory to equip them to your operator.
                  </p>
                  <button
                    onClick={() => onNavigate('inventory')}
                    className="tactical-btn tactical-btn-primary"
                    style={{ marginTop: 12, padding: '6px 14px', fontSize: '12px' }}
                  >
                    EQUIP GEAR
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Footer Stats */}
          <div
            style={{
              marginTop: 16,
              paddingTop: 12,
              borderTop: '1px solid var(--border-dim)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>
              Callsign: <strong style={{ color: 'var(--text-primary)' }}>{data?.player?.username || 'Active'}</strong>
            </span>
            <button
              onClick={() => onNavigate('inventory')}
              className="tactical-btn tactical-btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11px' }}
            >
              MANAGE INVENTORY
            </button>
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Featured Requisitions & Recent Activity */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 20,
        }}
      >
        {/* Featured Store Offers */}
        <div className="tactical-panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingBag size={16} color="var(--accent-primary)" />
              <h2 style={{ fontSize: '16px', color: 'var(--text-primary)' }}>
                FEATURED STORE DROPS
              </h2>
            </div>
            <button
              onClick={() => onNavigate('store')}
              className="tactical-btn tactical-btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11px' }}
            >
              VIEW STORE
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data?.featuredOffers && data.featuredOffers.length > 0 ? (
              data.featuredOffers.map((offer) => (
                <div
                  key={offer.offer_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-dim)',
                    borderRadius: 'var(--radius-xs)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`rarity-badge rarity-${offer.rarity}`}>{offer.rarity}</span>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                        {offer.item_name}
                      </span>
                    </div>
                    <div className="tech-tag" style={{ marginTop: 3 }}>
                      {offer.category} // {offer.remaining_stock} of {offer.stock_limit} left
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('store')}
                    className="tactical-btn tactical-btn-primary"
                    style={{ padding: '5px 12px', fontSize: '11px' }}
                  >
                    {parseFloat(offer.price).toLocaleString()} {offer.currency_symbol}
                  </button>
                </div>
              ))
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                No active store drops found.
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="tactical-panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={16} color="var(--accent-primary)" />
              <h2 style={{ fontSize: '16px', color: 'var(--text-primary)' }}>
                RECENT INVENTORY ACTIVITY
              </h2>
            </div>
            <button
              onClick={() => onNavigate('audit')}
              className="tactical-btn tactical-btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11px' }}
            >
              FULL LOG
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data?.recentActivity && data.recentActivity.length > 0 ? (
              data.recentActivity.slice(0, 4).map((log) => (
                <div
                  key={log.log_id}
                  style={{
                    padding: '9px 12px',
                    background: 'var(--bg-surface)',
                    borderLeft: '3px solid var(--border-strong)',
                    borderRadius: 'var(--radius-xs)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span className="font-mono" style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
                      {log.action_type}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ marginTop: 3, fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {log.details}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                No recent activity recorded.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inspect Item Modal */}
      {selectedItem && (
        <ItemInspectModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onActionCompleted={loadDashboard}
          onOpenListModal={(item) => setListingItem(item)}
        />
      )}

      {/* Create Listing Modal */}
      {listingItem && (
        <CreateListingModal
          item={listingItem}
          onClose={() => setListingItem(null)}
          onCreated={loadDashboard}
        />
      )}
    </div>
  );
}

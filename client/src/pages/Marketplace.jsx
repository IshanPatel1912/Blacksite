import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import { ItemVisual } from '../components/common/ItemVisual';
import {
  ArrowLeftRight,
  Search,
  Filter,
  Coins,
  Shield,
  User,
  RefreshCw,
  XCircle,
  Tag,
  CheckCircle,
  Package,
} from 'lucide-react';

export function Marketplace({ onNavigate }) {
  const { activePlayerId, wallets, refreshPlayerData, dbStatus } = usePlayer();
  const { addNotification } = useNotification();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyingListing, setBuyingListing] = useState(null);
  const [purchasing, setPurchasing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [rarity, setRarity] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [currencyId, setCurrencyId] = useState('ALL');
  const [sort, setSort] = useState('date_desc');

  const loadMarketplace = async () => {
    try {
      setLoading(true);
      const res = await api.getMarketplace({ search, rarity, category, currencyId, sort });
      if (res.success) {
        setListings(res.data);
      }
    } catch (err) {
      console.error('Failed to load marketplace:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketplace();
  }, [search, rarity, category, currencyId, sort, dbStatus.connected]);

  const handleConfirmBuy = async () => {
    if (!buyingListing) return;

    try {
      setPurchasing(true);
      const res = await api.buyMarketListing(activePlayerId, buyingListing.listing_id);
      if (res.success) {
        addNotification(res.message, 'success');
        refreshPlayerData();
        setBuyingListing(null);
        loadMarketplace();
      }
    } catch (err) {
      addNotification(err.message, 'error');
    } finally {
      setPurchasing(false);
    }
  };

  const handleCancelListing = async (listingId) => {
    try {
      const res = await api.cancelMarketListing(listingId, activePlayerId);
      if (res.success) {
        addNotification(res.message, 'success');
        loadMarketplace();
      }
    } catch (err) {
      addNotification(err.message, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '24px 28px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="tech-tag">PLAYER-TO-PLAYER COMMERCE // PUBLIC EXCHANGE</div>
          <h1 style={{ fontSize: '24px', color: 'var(--text-primary)', marginTop: 2 }}>
            MARKETPLACE
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 2 }}>
            Browse active listings placed by operators across the network or list items from your armory.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => onNavigate('inventory')}
            className="tactical-btn tactical-btn-primary"
          >
            <Tag size={14} />
            SELL FROM INVENTORY
          </button>
          <button onClick={loadMarketplace} className="tactical-btn tactical-btn-secondary">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className="tactical-panel"
        style={{
          padding: '12px 16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        <div style={{ position: 'relative' }}>
          <Search
            size={14}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search item or seller..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="tactical-input"
            style={{ width: '100%', paddingLeft: 32 }}
          />
        </div>

        <select value={rarity} onChange={(e) => setRarity(e.target.value)} className="tactical-select">
          <option value="ALL">All Rarities</option>
          <option value="Common">Common</option>
          <option value="Uncommon">Uncommon</option>
          <option value="Rare">Rare</option>
          <option value="Epic">Epic</option>
          <option value="Legendary">Legendary</option>
          <option value="Mythic">Mythic</option>
        </select>

        <select value={category} onChange={(e) => setCategory(e.target.value)} className="tactical-select">
          <option value="ALL">All Categories</option>
          <option value="Assault Rifle">Assault Rifles</option>
          <option value="SMG">SMGs</option>
          <option value="Sniper Rifle">Sniper Rifles</option>
          <option value="Combat Helmet">Combat Helmets</option>
          <option value="Tactical Vest">Tactical Vests</option>
          <option value="Weapon Skin">Weapon Skins</option>
          <option value="Operator Skin">Operator Outfits</option>
          <option value="Supply Crate">Supply Crates</option>
        </select>

        <select value={currencyId} onChange={(e) => setCurrencyId(e.target.value)} className="tactical-select">
          <option value="ALL">All Currencies</option>
          <option value="1">Combat Credits (CR)</option>
          <option value="2">Blacksite Tokens (BST)</option>
        </select>

        <select value={sort} onChange={(e) => setSort(e.target.value)} className="tactical-select">
          <option value="date_desc">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rarity_desc">Highest Rarity</option>
        </select>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px' }} />
          <div className="font-mono">LOADING MARKET LISTINGS...</div>
        </div>
      ) : listings.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: 16,
          }}
        >
          {listings.map((item) => {
            const isOwnListing = item.seller_id === activePlayerId;
            const wallet = wallets?.find((w) => w.currency_id === item.currency_id);
            const price = parseFloat(item.price);
            const canAfford = wallet && parseFloat(wallet.balance) >= price;

            let rarityBorder = 'var(--border-dim)';
            if (item.rarity === 'Mythic') rarityBorder = 'var(--rarity-mythic)';
            else if (item.rarity === 'Legendary') rarityBorder = 'var(--rarity-legendary)';
            else if (item.rarity === 'Epic') rarityBorder = 'var(--rarity-epic)';
            else if (item.rarity === 'Rare') rarityBorder = 'var(--rarity-rare)';
            else if (item.rarity === 'Uncommon') rarityBorder = 'var(--rarity-uncommon)';
            else if (item.rarity === 'Common') rarityBorder = 'var(--rarity-common)';

            return (
              <div
                key={item.listing_id}
                className="tactical-panel"
                style={{
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: `3px solid ${rarityBorder}`,
                  backgroundColor: isOwnListing ? 'rgba(56, 189, 248, 0.04)' : 'var(--bg-panel)',
                }}
              >
                <div>
                  {/* Top Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={`rarity-badge rarity-${item.rarity}`}>{item.rarity}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={12} color="var(--text-muted)" />
                      <span
                        style={{
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          color: isOwnListing ? '#38bdf8' : 'var(--text-secondary)',
                          fontWeight: 700,
                        }}
                      >
                        {isOwnListing ? 'YOUR LISTING' : item.seller_username}
                      </span>
                    </div>
                  </div>

                  {/* Item Image */}
                  <div style={{ marginTop: 10 }}>
                    <ItemVisual item={item} size="md" />
                  </div>

                  {/* Item Name */}
                  <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginTop: 10, fontWeight: 700 }}>
                    {item.item_name}
                  </h3>

                  <div className="tech-tag" style={{ marginTop: 2 }}>
                    {item.category} // CONDITION: {item.durability}%
                  </div>
                </div>

                {/* Price and Action */}
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 12,
                    borderTop: '1px solid var(--border-dim)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div className="tech-tag">ASKING PRICE</div>
                    <div
                      className="font-mono"
                      style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: item.is_premium ? 'var(--text-accent)' : 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        marginTop: 2,
                      }}
                    >
                      <Coins size={13} color={item.is_premium ? 'var(--accent-primary)' : '#94a3b8'} />
                      {price.toLocaleString()} {item.currency_symbol}
                    </div>
                  </div>

                  {isOwnListing ? (
                    <button
                      onClick={() => handleCancelListing(item.listing_id)}
                      className="tactical-btn tactical-btn-danger"
                      style={{ padding: '5px 12px', fontSize: '11px' }}
                    >
                      <XCircle size={13} />
                      CANCEL
                    </button>
                  ) : (
                    <button
                      onClick={() => setBuyingListing(item)}
                      disabled={!canAfford}
                      className={`tactical-btn ${canAfford ? 'tactical-btn-primary' : 'tactical-btn-secondary'}`}
                      style={{ padding: '6px 14px', fontSize: '11px' }}
                    >
                      {canAfford ? 'BUY ITEM' : 'INSUFFICIENT FUNDS'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="tactical-panel" style={{ padding: '60px', textAlign: 'center' }}>
          <Package size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', color: 'var(--text-primary)' }}>
            NO ACTIVE MARKET LISTINGS
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 4 }}>
            Be the first operator to list an eligible item on the public exchange!
          </p>
          <button
            onClick={() => onNavigate('inventory')}
            className="tactical-btn tactical-btn-primary"
            style={{ marginTop: 14 }}
          >
            LIST FROM INVENTORY
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {buyingListing && (
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
          onClick={() => setBuyingListing(null)}
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
            <div>
              <div className="tech-tag">CONFIRM MARKETPLACE PURCHASE</div>
              <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: 2 }}>
                BUY {buyingListing.item_name}
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              You are about to purchase <strong>{buyingListing.item_name}</strong> from <strong>{buyingListing.seller_username}</strong> for <strong>{parseFloat(buyingListing.price).toLocaleString()} {buyingListing.currency_symbol}</strong>.
            </p>

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setBuyingListing(null)}
                className="tactical-btn tactical-btn-secondary"
                style={{ flex: 1 }}
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmBuy}
                disabled={purchasing}
                className="tactical-btn tactical-btn-primary"
                style={{ flex: 2 }}
              >
                {purchasing ? 'TRANSACTING...' : 'CONFIRM BUY'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

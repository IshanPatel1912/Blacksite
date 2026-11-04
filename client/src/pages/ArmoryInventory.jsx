import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../services/api';
import { ItemInspectModal } from '../components/modals/ItemInspectModal';
import { CreateListingModal } from '../components/modals/CreateListingModal';
import { ItemVisual } from '../components/common/ItemVisual';
import {
  Shield,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle,
  Tag,
  Crosshair,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';

export function ArmoryInventory() {
  const { activePlayerId, dbStatus } = usePlayer();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [rarity, setRarity] = useState('ALL');
  const [tradable, setTradable] = useState('ALL');
  const [availability, setAvailability] = useState('ALL');
  const [sort, setSort] = useState('acquired_desc');

  // Modals
  const [selectedItem, setSelectedItem] = useState(null);
  const [listingItem, setListingItem] = useState(null);

  const categories = [
    { id: 'ALL', label: 'All Items' },
    { id: 'Assault Rifle', label: 'Assault Rifles' },
    { id: 'SMG', label: 'SMGs' },
    { id: 'Sniper Rifle', label: 'Sniper Rifles' },
    { id: 'Combat Helmet', label: 'Helmets' },
    { id: 'Tactical Vest', label: 'Vests & Armor' },
    { id: 'Weapon Skin', label: 'Weapon Skins' },
    { id: 'Operator Skin', label: 'Operator Outfits' },
    { id: 'Supply Crate', label: 'Supply Crates' },
    { id: 'Tactical Gear', label: 'Tactical Gear' },
  ];

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await api.getInventory({
        playerId: activePlayerId,
        search,
        rarity,
        category,
        tradable,
        availability,
        sort,
      });
      if (res.success) {
        setItems(res.data);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [activePlayerId, search, rarity, category, tradable, availability, sort, dbStatus.connected]);

  const resetFilters = () => {
    setSearch('');
    setCategory('ALL');
    setRarity('ALL');
    setTradable('ALL');
    setAvailability('ALL');
    setSort('acquired_desc');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '24px 28px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* 1. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="tech-tag">TACTICAL ARMORY // PERSONAL LOADOUT</div>
          <h1 style={{ fontSize: '24px', color: 'var(--text-primary)', marginTop: 2 }}>
            INVENTORY
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 2 }}>
            Equip, inspect, repair, and manage your weapon platforms, ballistic armor, and cosmetic skins.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            className="font-mono"
            style={{
              padding: '6px 14px',
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-dim)',
              borderRadius: 'var(--radius-xs)',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--text-accent)',
            }}
          >
            {items.length} ASSETS OWNED
          </div>
          <button
            onClick={loadInventory}
            className="tactical-btn tactical-btn-secondary"
            style={{ padding: '6px 12px' }}
            title="Refresh Inventory"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* 2. Split Layout: Category Nav Rail + Search & Filter Toolbar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Category Horizontal Filter Pills */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            paddingBottom: 4,
          }}
        >
          {categories.map((cat) => {
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-xs)',
                  border: isActive ? '1px solid var(--accent-primary)' : '1px solid var(--border-dim)',
                  backgroundColor: isActive ? 'var(--accent-primary)' : 'var(--bg-panel)',
                  color: isActive ? '#0d1017' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search, Rarity, Tradability, and Sort Filters */}
        <div
          className="tactical-panel"
          style={{
            padding: '12px 16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            alignItems: 'center',
          }}
        >
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search weapons or gear..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="tactical-input"
              style={{ width: '100%', paddingLeft: 32 }}
            />
          </div>

          {/* Rarity */}
          <select value={rarity} onChange={(e) => setRarity(e.target.value)} className="tactical-select">
            <option value="ALL">All Rarities</option>
            <option value="Common">Common</option>
            <option value="Uncommon">Uncommon</option>
            <option value="Rare">Rare</option>
            <option value="Epic">Epic</option>
            <option value="Legendary">Legendary</option>
            <option value="Mythic">Mythic</option>
          </select>

          {/* Availability */}
          <select value={availability} onChange={(e) => setAvailability(e.target.value)} className="tactical-select">
            <option value="ALL">All Availability</option>
            <option value="AVAILABLE">Available in Armory</option>
            <option value="LISTED">Listed on Marketplace</option>
            <option value="IN_TRADE">Pledged in Trade</option>
          </select>

          {/* Sort */}
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="tactical-select">
            <option value="acquired_desc">Newest Acquired</option>
            <option value="acquired_asc">Oldest Acquired</option>
            <option value="rarity_desc">Highest Rarity</option>
            <option value="durability_desc">Highest Durability</option>
            <option value="durability_asc">Lowest Durability</option>
            <option value="name_asc">Name (A-Z)</option>
          </select>

          {/* Reset Filters */}
          <button
            onClick={resetFilters}
            className="tactical-btn tactical-btn-secondary"
            style={{ padding: '8px 12px', fontSize: '11px' }}
          >
            RESET FILTERS
          </button>
        </div>
      </div>

      {/* 3. Items Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px' }} />
          <div className="font-mono">LOADING ARMORY INVENTORY...</div>
        </div>
      ) : items.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {items.map((item) => {
            const isEquipped = item.is_equipped;
            const isListed = item.availability_status === 'LISTED';
            const isInTrade = item.availability_status === 'IN_TRADE';

            // Distinctive visual border based on rarity
            let rarityBorder = 'var(--border-dim)';
            if (item.rarity === 'Mythic') rarityBorder = 'var(--rarity-mythic)';
            else if (item.rarity === 'Legendary') rarityBorder = 'var(--rarity-legendary)';
            else if (item.rarity === 'Epic') rarityBorder = 'var(--rarity-epic)';
            else if (item.rarity === 'Rare') rarityBorder = 'var(--rarity-rare)';
            else if (item.rarity === 'Uncommon') rarityBorder = 'var(--rarity-uncommon)';
            else if (item.rarity === 'Common') rarityBorder = 'var(--rarity-common)';

            return (
              <div
                key={item.item_instance_id}
                className="tactical-panel tactical-panel-interactive"
                style={{
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: isEquipped ? '3px solid var(--accent-primary)' : `3px solid ${rarityBorder}`,
                  backgroundColor: isEquipped ? 'rgba(255, 133, 0, 0.04)' : 'var(--bg-panel)',
                  position: 'relative',
                }}
                onClick={() => setSelectedItem(item)}
              >
                <div>
                  {/* Top Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={`rarity-badge rarity-${item.rarity}`}>{item.rarity}</span>
                    {isEquipped ? (
                      <span
                        style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          color: '#0d1017',
                          backgroundColor: 'var(--accent-primary)',
                          padding: '2px 6px',
                          borderRadius: '2px',
                          fontWeight: 700,
                        }}
                      >
                        EQUIPPED
                      </span>
                    ) : isListed ? (
                      <span
                        style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          color: '#38bdf8',
                          backgroundColor: 'rgba(56, 189, 248, 0.15)',
                          padding: '2px 6px',
                          borderRadius: '2px',
                          fontWeight: 700,
                        }}
                      >
                        LISTED // {item.listing_price} CR
                      </span>
                    ) : isInTrade ? (
                      <span
                        style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          color: '#f59e0b',
                          backgroundColor: 'rgba(245, 158, 11, 0.15)',
                          padding: '2px 6px',
                          borderRadius: '2px',
                          fontWeight: 700,
                        }}
                      >
                        IN TRADE
                      </span>
                    ) : (
                      <span className="tech-tag" style={{ color: '#10b981' }}>
                        READY
                      </span>
                    )}
                  </div>

                  {/* Item Image Representation */}
                  <div style={{ marginTop: 10 }}>
                    <ItemVisual item={item} size="md" />
                  </div>

                  {/* Title & Specs */}
                  <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginTop: 10, fontWeight: 700 }}>
                    {item.item_name}
                  </h3>
                  <div className="tech-tag" style={{ marginTop: 2 }}>
                    {item.category}
                  </div>
                </div>

                {/* Bottom Durability & Quick Action */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: 4 }}>
                    <span className="tech-tag">CONDITION</span>
                    <span
                      className="font-mono"
                      style={{
                        fontWeight: 700,
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

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 12,
                      paddingTop: 8,
                      borderTop: '1px solid var(--border-dim)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        color: item.is_tradable ? '#10b981' : '#64748b',
                      }}
                    >
                      {item.is_tradable ? 'TRADABLE' : 'LOCKED'}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem(item);
                      }}
                      className="tactical-btn tactical-btn-secondary"
                      style={{ padding: '3px 10px', fontSize: '11px' }}
                    >
                      <Eye size={12} /> INSPECT
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="tactical-panel" style={{ padding: '60px', textAlign: 'center' }}>
          <Package size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', color: 'var(--text-primary)' }}>
            NO ITEMS FOUND
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 4 }}>
            Try resetting your active category or search filters.
          </p>
          <button onClick={resetFilters} className="tactical-btn tactical-btn-primary" style={{ marginTop: 14 }}>
            CLEAR ALL FILTERS
          </button>
        </div>
      )}

      {/* Inspect Item Modal */}
      {selectedItem && (
        <ItemInspectModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onActionCompleted={loadInventory}
          onOpenListModal={(item) => setListingItem(item)}
        />
      )}

      {/* Create Listing Modal */}
      {listingItem && (
        <CreateListingModal
          item={listingItem}
          onClose={() => setListingItem(null)}
          onCreated={loadInventory}
        />
      )}
    </div>
  );
}

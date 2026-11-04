import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import { ItemVisual } from '../components/common/ItemVisual';
import {
  BookOpen,
  Search,
  Filter,
  PlusCircle,
  Shield,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  Lock,
  Unlock,
  Crosshair,
  Package,
  Sparkles,
  LayoutGrid,
  List
} from 'lucide-react';

export function ItemCatalog() {
  const { dbStatus } = usePlayer();
  const { addNotification } = useNotification();
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Filters
  const [search, setSearch] = useState('');
  const [rarity, setRarity] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [tradable, setTradable] = useState('ALL');

  // Category filter tabs
  const [activeGroup, setActiveGroup] = useState('ALL');

  // Admin Modal
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    item_name: '',
    rarity: 'Rare',
    category: 'Assault Rifle',
    is_tradable: true,
    base_durability: 100,
    description: '',
    asset_key: 'standard_gear',
  });

  const loadCatalog = async () => {
    try {
      setLoading(true);
      const res = await api.getCatalog({ search, rarity, category, tradable });
      if (res.success) {
        setCatalog(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load item catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, [search, rarity, category, tradable, dbStatus.connected]);

  const handleCreateBlueprint = async (e) => {
    e.preventDefault();
    if (!formData.item_name.trim()) {
      addNotification('Blueprint designation is required.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createCatalogItem(formData);
      if (res.success) {
        addNotification(res.message || 'Blueprint registered successfully!', 'success');
        setShowAdminModal(false);
        setFormData({
          item_name: '',
          rarity: 'Rare',
          category: 'Assault Rifle',
          is_tradable: true,
          base_durability: 100,
          description: '',
          asset_key: 'standard_gear',
        });
        loadCatalog();
      }
    } catch (err) {
      addNotification(err.message || 'Failed to register blueprint', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter by category group
  const filteredCatalog = catalog.filter((item) => {
    if (activeGroup === 'ALL') return true;
    if (activeGroup === 'WEAPONS') return ['Assault Rifle', 'SMG', 'Sniper Rifle'].includes(item.category);
    if (activeGroup === 'GEAR') return ['Combat Helmet', 'Tactical Vest', 'Tactical Gear'].includes(item.category);
    if (activeGroup === 'COSMETICS') return ['Weapon Skin', 'Operator Skin'].includes(item.category);
    if (activeGroup === 'SUPPLIES') return ['Supply Crate'].includes(item.category);
    return true;
  });

  const getRarityColor = (r) => {
    switch (r?.toLowerCase()) {
      case 'mythic': return 'var(--rarity-mythic)';
      case 'legendary': return 'var(--rarity-legendary)';
      case 'epic': return 'var(--rarity-epic)';
      case 'rare': return 'var(--rarity-rare)';
      case 'uncommon': return 'var(--rarity-uncommon)';
      default: return 'var(--rarity-common)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="tech-tag">ITEM BLUEPRINTS</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>// CENTRAL REPOSITORY</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '0.04em', margin: 0, color: 'var(--text-primary)' }}>
            ITEM CATALOG
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Official military blueprints and equipment specifications from which all field gear is derived.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setShowAdminModal(true)}
            className="tactical-btn tactical-btn-primary"
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            <PlusCircle size={15} />
            REGISTER BLUEPRINT
          </button>
        </div>
      </div>

      {/* Category Pills & View Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'ALL ITEMS' },
            { id: 'WEAPONS', label: 'WEAPONS' },
            { id: 'GEAR', label: 'GEAR & ARMOR' },
            { id: 'COSMETICS', label: 'COSMETICS' },
            { id: 'SUPPLIES', label: 'CRATES' },
          ].map((grp) => (
            <button
              key={grp.id}
              onClick={() => setActiveGroup(grp.id)}
              className="tactical-btn tactical-btn-secondary"
              style={{
                fontSize: '11px',
                padding: '6px 14px',
                backgroundColor: activeGroup === grp.id ? 'rgba(255, 133, 0, 0.14)' : 'transparent',
                borderColor: activeGroup === grp.id ? 'var(--accent-primary)' : 'var(--border-dim)',
                color: activeGroup === grp.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: activeGroup === grp.id ? 700 : 500,
              }}
            >
              {grp.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            onClick={() => setViewMode('grid')}
            className="tactical-btn tactical-btn-secondary"
            style={{
              padding: '6px 10px',
              borderColor: viewMode === 'grid' ? 'var(--accent-primary)' : 'var(--border-dim)',
              color: viewMode === 'grid' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            }}
            title="Grid View"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className="tactical-btn tactical-btn-secondary"
            style={{
              padding: '6px 10px',
              borderColor: viewMode === 'table' ? 'var(--accent-primary)' : 'var(--border-dim)',
              color: viewMode === 'table' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            }}
            title="Table View"
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className="tactical-panel"
        style={{
          padding: '14px 16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          alignItems: 'center',
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
            placeholder="Search blueprints by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="tactical-input"
            style={{ width: '100%', paddingLeft: '32px', fontSize: '13px' }}
          />
        </div>

        <select
          value={rarity}
          onChange={(e) => setRarity(e.target.value)}
          className="tactical-select"
          style={{ fontSize: '13px' }}
        >
          <option value="ALL">All Rarities</option>
          <option value="Common">Common</option>
          <option value="Uncommon">Uncommon</option>
          <option value="Rare">Rare</option>
          <option value="Epic">Epic</option>
          <option value="Legendary">Legendary</option>
          <option value="Mythic">Mythic</option>
        </select>

        <select
          value={tradable}
          onChange={(e) => setTradable(e.target.value)}
          className="tactical-select"
          style={{ fontSize: '13px' }}
        >
          <option value="ALL">All Tradability</option>
          <option value="true">Tradable Items Only</option>
          <option value="false">Non-Tradable / Locked</option>
        </select>
      </div>

      {/* Items Rendering */}
      {filteredCatalog.length === 0 ? (
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
          <BookOpen size={36} color="var(--text-muted)" style={{ opacity: 0.5 }} />
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
            No Matching Item Blueprints
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
            Adjust your filters or requisition a new blueprint into the armory catalog.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredCatalog.map((item) => {
            const rarityColor = getRarityColor(item.rarity);

            return (
              <div
                key={item.item_type_id}
                className="tactical-panel"
                style={{
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: `3px solid ${rarityColor}`,
                  position: 'relative',
                  backgroundColor: 'var(--bg-panel)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                      #{item.item_type_id} // {item.category?.toUpperCase()}
                    </span>
                    <span className={`rarity-badge rarity-${item.rarity}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                      {item.rarity}
                    </span>
                  </div>

                  <div style={{ margin: '8px 0 10px 0' }}>
                    <ItemVisual item={item} size="md" />
                  </div>

                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '4px 0 6px 0', color: 'var(--text-primary)' }}>
                    {item.item_name}
                  </h3>

                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      margin: 0,
                      minHeight: '36px',
                    }}
                  >
                    {item.description || 'Standard military specification archetype.'}
                  </p>
                </div>

                <div
                  style={{
                    marginTop: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-dim)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {item.is_tradable ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                        <Unlock size={12} /> TRADABLE
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                        <Lock size={12} /> MIL-LOCKED
                      </span>
                    )}
                  </div>

                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                    SPAWNED: <span style={{ color: 'var(--text-accent)', fontWeight: 700 }}>{item.total_instances_in_game || 0}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="tactical-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-medium)' }}>
                <th style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                  ID // DESIGNATION
                </th>
                <th style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                  RARITY
                </th>
                <th style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                  CATEGORY
                </th>
                <th style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                  BASE SPEC
                </th>
                <th style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                  TRADABILITY
                </th>
                <th style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textAlign: 'right' }}>
                  INSTANCES SPAWNED
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCatalog.map((item) => (
                <tr
                  key={item.item_type_id}
                  style={{
                    borderBottom: '1px solid var(--border-dim)',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                        #{item.item_type_id}
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                          {item.item_name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', maxWidth: '320px' }}>
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`rarity-badge rarity-${item.rarity}`} style={{ fontSize: '9px' }}>
                      {item.rarity}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {item.category}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {item.base_durability}% MAX DUR
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: item.is_tradable ? '#10b981' : '#94a3b8',
                      }}
                    >
                      {item.is_tradable ? 'TRADABLE' : 'MIL-LOCKED'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent-primary)', textAlign: 'right', fontWeight: 700 }}>
                    {item.total_instances_in_game || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Admin Blueprint Registration Modal */}
      {showAdminModal && (
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
          onClick={() => setShowAdminModal(false)}
        >
          <div
            className="tactical-panel"
            style={{
              width: '100%',
              maxWidth: '500px',
              padding: '24px',
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--border-medium)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} color="var(--accent-primary)" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  REGISTER BLUEPRINT
                </h3>
              </div>
              <button
                onClick={() => setShowAdminModal(false)}
                className="tactical-btn tactical-btn-secondary"
                style={{ padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBlueprint} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                  BLUEPRINT DESIGNATION / NAME
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. M4A1 Nightstalker"
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  className="tactical-input"
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                    RARITY TIER
                  </label>
                  <select
                    value={formData.rarity}
                    onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                    className="tactical-select"
                    style={{ width: '100%', fontSize: '13px' }}
                  >
                    <option value="Common">Common</option>
                    <option value="Uncommon">Uncommon</option>
                    <option value="Rare">Rare</option>
                    <option value="Epic">Epic</option>
                    <option value="Legendary">Legendary</option>
                    <option value="Mythic">Mythic</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                    EQUIPMENT CATEGORY
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="tactical-select"
                    style={{ width: '100%', fontSize: '13px' }}
                  >
                    <option value="Assault Rifle">Assault Rifle</option>
                    <option value="SMG">SMG</option>
                    <option value="Sniper Rifle">Sniper Rifle</option>
                    <option value="Combat Helmet">Combat Helmet</option>
                    <option value="Tactical Vest">Tactical Vest</option>
                    <option value="Weapon Skin">Weapon Skin</option>
                    <option value="Operator Skin">Operator Skin</option>
                    <option value="Supply Crate">Supply Crate</option>
                    <option value="Tactical Gear">Tactical Gear</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                  TECHNICAL DESCRIPTION
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter weapon frame details or operational specifications..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="tactical-input"
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                <input
                  type="checkbox"
                  id="tradable-chk"
                  checked={formData.is_tradable}
                  onChange={(e) => setFormData({ ...formData, is_tradable: e.target.checked })}
                  style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
                <label htmlFor="tradable-chk" style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Permit peer-to-peer exchange and marketplace trading
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="tactical-btn tactical-btn-secondary"
                  style={{ flex: 1, padding: '8px' }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="tactical-btn tactical-btn-primary"
                  style={{ flex: 2, padding: '8px' }}
                >
                  {submitting ? 'COMMITTING...' : 'REGISTER BLUEPRINT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ItemCatalog;
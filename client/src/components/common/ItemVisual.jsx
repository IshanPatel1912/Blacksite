import React, { useState } from 'react';

/**
 * ItemVisual Component
 * Renders complete, uncropped game asset imagery using object-fit: contain.
 * Preserves original aspect ratios with appropriate internal padding,
 * controlled rarity accents, and dark tactical surface backgrounds.
 */
export function ItemVisual({
  item,
  category: propCategory,
  rarity: propRarity,
  assetKey: propAssetKey,
  name: propName,
  size = 'md', // 'sm' (85px), 'md' (140px), 'lg' (190px), 'hero' (250px)
  showRarityGlow = true,
  className = '',
}) {
  const [imgError, setImgError] = useState(false);

  const category = (item?.category || propCategory || 'Tactical Gear').toLowerCase();
  const rarity = (item?.rarity || propRarity || 'Common').toLowerCase();
  const assetKey = (item?.asset_key || propAssetKey || '').toLowerCase();
  const name = (item?.item_name || propName || '').toLowerCase();

  // Controlled, non-neon rarity color specification
  const rarityColors = {
    mythic: { primary: '#D65050', glow: 'rgba(214, 80, 80, 0.25)', bg: 'rgba(214, 80, 80, 0.08)' },
    legendary: { primary: '#D99A3D', glow: 'rgba(217, 154, 61, 0.25)', bg: 'rgba(217, 154, 61, 0.08)' },
    epic: { primary: '#9D68D9', glow: 'rgba(157, 104, 217, 0.22)', bg: 'rgba(157, 104, 217, 0.08)' },
    rare: { primary: '#4D8DF7', glow: 'rgba(77, 141, 247, 0.22)', bg: 'rgba(77, 141, 247, 0.08)' },
    uncommon: { primary: '#45B889', glow: 'rgba(69, 184, 137, 0.22)', bg: 'rgba(69, 184, 137, 0.08)' },
    common: { primary: '#9AA8B5', glow: 'rgba(154, 168, 181, 0.15)', bg: 'rgba(154, 168, 181, 0.04)' },
  };

  const theme = rarityColors[rarity] || rarityColors.common;

  // Sizing definitions designed for proportional card display
  const heights = {
    sm: '85px',
    md: '140px',
    lg: '190px',
    hero: '250px',
  };

  const paddings = {
    sm: '6px 8px',
    md: '10px 14px',
    lg: '14px 18px',
    hero: '18px 24px',
  };

  const currentHeight = heights[size] || heights.md;
  const currentPadding = paddings[size] || paddings.md;

  // Resolve matching image path
  const resolveImagePath = () => {
    // 1. Direct asset_key matching
    const knownKeys = [
      'rifle_phantom', 'skin_nightwatch', 'smg_vector', 'helmet_ghost',
      'vest_ironclad', 'skin_redline', 'gear_pulse', 'crate_blackout',
      'sniper_vanguard', 'rifle_apex', 'gear_boots', 'vest_aegis',
      'skin_cryo', 'helmet_standard', 'smg_havoc', 'gear_medal'
    ];

    if (assetKey && knownKeys.includes(assetKey)) {
      return `/images/items/${assetKey}.jpg`;
    }

    // 2. Name-based heuristics
    if (name.includes('prototype') || name.includes('phantom prototype')) return '/images/items/rifle_phantom.jpg';
    if (name.includes('phantom')) return '/images/items/rifle_phantom.jpg';
    if (name.includes('vector')) return '/images/items/smg_vector.jpg';
    if (name.includes('vanguard') || name.includes('m24') || name.includes('sniper')) return '/images/items/sniper_vanguard.jpg';
    if (name.includes('ghost') && name.includes('protocol')) return '/images/items/helmet_ghost.jpg';
    if (name.includes('ironclad')) return '/images/items/vest_ironclad.jpg';
    if (name.includes('redline')) return '/images/items/skin_redline.jpg';
    if (name.includes('pulse')) return '/images/items/gear_pulse.jpg';
    if (name.includes('blackout') || name.includes('cache') || name.includes('crate')) return '/images/items/crate_blackout.jpg';
    if (name.includes('apex') || name.includes('viper')) return '/images/items/rifle_apex.jpg';
    if (name.includes('nightwatch')) return '/images/items/skin_nightwatch.jpg';
    if (name.includes('walker') || name.includes('boot')) return '/images/items/gear_boots.jpg';
    if (name.includes('aegis')) return '/images/items/vest_aegis.jpg';
    if (name.includes('cryo')) return '/images/items/skin_cryo.jpg';
    if (name.includes('breacher')) return '/images/items/helmet_standard.jpg';
    if (name.includes('havoc')) return '/images/items/smg_havoc.jpg';
    if (name.includes('founder') || name.includes('token') || name.includes('medal')) return '/images/items/gear_medal.jpg';

    // 3. Category Fallbacks
    if (category.includes('sniper')) return '/images/items/sniper_vanguard.jpg';
    if (category.includes('smg')) return '/images/items/smg_vector.jpg';
    if (category.includes('assault') || category.includes('rifle')) return '/images/items/rifle_phantom.jpg';
    if (category.includes('helmet')) return '/images/items/helmet_ghost.jpg';
    if (category.includes('vest')) return '/images/items/vest_ironclad.jpg';
    if (category.includes('crate')) return '/images/items/crate_blackout.jpg';
    if (category.includes('skin')) return '/images/items/skin_redline.jpg';
    if (category.includes('gear')) return '/images/items/gear_pulse.jpg';

    return '/images/items/rifle_phantom.jpg';
  };

  const imageSrc = resolveImagePath();

  return (
    <div
      className={`item-visual-container ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: currentHeight,
        backgroundColor: '#101419',
        border: '1px solid #303B45',
        borderBottom: `3px solid ${theme.primary}`,
        borderRadius: 'var(--radius-xs)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        boxShadow: showRarityGlow ? `inset 0 0 20px rgba(0, 0, 0, 0.7), 0 2px 8px ${theme.glow}` : 'none',
      }}
    >
      {/* Background Subtle Radial Gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 50%, ${theme.bg} 0%, rgba(16, 20, 25, 0.9) 80%)`,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* Real Uncropped High-Definition Item Artwork with contain fit */}
      {!imgError ? (
        <img
          src={imageSrc}
          alt={item?.item_name || propName || 'Game Equipment Asset'}
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'center',
            padding: currentPadding,
            boxSizing: 'border-box',
            position: 'relative',
            zIndex: 2,
            transition: 'transform 0.2s ease',
            filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.6))',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        />
      ) : (
        /* Clean fallback if image fails to load */
        <div style={{ zIndex: 2, textAlign: 'center', padding: '12px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: theme.primary, fontWeight: 700, letterSpacing: '0.04em' }}>
            {category.toUpperCase()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '4px' }}>
            {item?.item_name || propName}
          </div>
        </div>
      )}

      {/* Subtle Corner Reticle Brackets */}
      <div
        style={{
          position: 'absolute',
          top: 4,
          left: 4,
          width: 5,
          height: 5,
          borderTop: '1px solid #445362',
          borderLeft: '1px solid #445362',
          zIndex: 3,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 4,
          right: 4,
          width: 5,
          height: 5,
          borderBottom: `1px solid ${theme.primary}`,
          borderRight: `1px solid ${theme.primary}`,
          zIndex: 3,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

export default ItemVisual;

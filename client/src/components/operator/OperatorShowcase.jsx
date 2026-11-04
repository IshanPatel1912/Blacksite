import React from 'react';
import {
  Shield,
  Crosshair,
  Radio,
  Zap,
  ChevronRight,
  Sparkles,
  Layers,
  Award
} from 'lucide-react';

/**
 * OperatorShowcase Component
 * Displays the complete tactical operator avatar with uncropped framing (object-fit: contain).
 * Features authentic military telemetry, equipment status, and active loadout specs.
 */
export function OperatorShowcase({ equippedItems = [], activePlayer, onNavigate }) {
  const username = activePlayer?.username || 'OPERATOR_GHOST';

  // Extract equipped gear names or default loadouts
  const primaryWeapon = equippedItems.find(
    (i) => i.category?.toLowerCase().includes('weapon') || i.category?.toLowerCase().includes('rifle') || i.category?.toLowerCase().includes('smg')
  );
  const headgear = equippedItems.find(
    (i) => i.category?.toLowerCase().includes('helmet') || i.category?.toLowerCase().includes('headgear')
  );
  const bodyArmor = equippedItems.find(
    (i) => i.category?.toLowerCase().includes('armor') || i.category?.toLowerCase().includes('vest')
  );

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-dim)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Telemetry Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-dim)',
          background: 'var(--bg-surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'var(--color-success)',
              boxShadow: '0 0 6px rgba(69, 184, 137, 0.4)',
            }}
          />
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--accent-olive)',
                letterSpacing: '0.05em',
              }}
            >
              OPERATOR DOSSIER // TF-141
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '0.03em',
              }}
            >
              {username.toUpperCase()}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              padding: '3px 8px',
              borderRadius: '2px',
              backgroundColor: 'rgba(69, 184, 137, 0.12)',
              border: '1px solid rgba(69, 184, 137, 0.3)',
              fontFamily: 'var(--font-display)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--color-success)',
              letterSpacing: '0.04em',
            }}
          >
            ACTIVE INFIL
          </span>
          {onNavigate && (
            <button
              onClick={() => onNavigate('inventory')}
              className="tactical-btn tactical-btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11px' }}
              title="Equip and modify your operator's gear"
            >
              MODIFY LOADOUT
            </button>
          )}
        </div>
      </div>

      {/* Main Visual Display Area — Full Operator Avatar Visible Without Cropping */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '380px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#101419',
          padding: '8px',
        }}
      >
        {/* Full Uncropped Operator JPG Render with contain fit */}
        <img
          src="/images/operators/operator_ghost.jpg"
          alt="Tactical Spec Ops Operator"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'center',
            filter: 'contrast(1.05) brightness(0.98)',
            position: 'relative',
            zIndex: 1,
          }}
        />

        {/* Tactical HUD Reticle Corner Accents */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 12,
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            color: 'var(--accent-olive)',
            opacity: 0.85,
            lineHeight: 1,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          ┌ SEC-01 [SPECOPS]
        </div>
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 12,
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            opacity: 0.85,
            lineHeight: 1,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          SYS: COMBAT READY ┐
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            left: 12,
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            opacity: 0.8,
            lineHeight: 1,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          └ NVG: THERMAL/OPTIC
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            right: 12,
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            color: 'var(--accent-primary)',
            opacity: 0.85,
            lineHeight: 1,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          ARMOR: CLASS-IV ┘
        </div>

        {/* Overlay Callout: Primary Equipped Gear Floating Tags */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 12,
            right: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            background: 'rgba(23, 29, 36, 0.92)',
            border: '1px solid var(--border-dim)',
            borderRadius: 'var(--radius-xs)',
            padding: '7px 12px',
            backdropFilter: 'blur(6px)',
            zIndex: 3,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Crosshair size={14} color="var(--accent-primary)" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-display)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                PRIMARY WEAPON
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {primaryWeapon?.item_name || 'Vanguard M24 Sniper'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={14} color="var(--accent-olive)" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-display)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                TACTICAL RIG
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {bodyArmor?.item_name || 'Ironclad Assault Rig'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={14} color="var(--rarity-epic)" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-display)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                GEAR LOADED
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                {equippedItems.length} SLOTS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Operator Combat Telemetry Footer */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          backgroundColor: 'var(--border-dim)',
          borderTop: '1px solid var(--border-dim)',
        }}
      >
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-display)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            SURVIVABILITY
          </span>
          <span
            style={{
              fontSize: '13px',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              color: 'var(--color-success)',
            }}
          >
            100% ARMOR
          </span>
        </div>

        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-display)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            MOBILITY INDEX
          </span>
          <span
            style={{
              fontSize: '13px',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            92 / 100 PTS
          </span>
        </div>

        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-display)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            NET ENCRYPTION
          </span>
          <span
            style={{
              fontSize: '13px',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              color: 'var(--accent-olive)',
            }}
          >
            AES-256 GCM
          </span>
        </div>
      </div>
    </div>
  );
}

export default OperatorShowcase;

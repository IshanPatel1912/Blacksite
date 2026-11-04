import React, { useState, useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import { ItemVisual } from '../components/common/ItemVisual';
import {
  Compass,
  Coins,
  Shield,
  Zap,
  Award,
  Sparkles,
  AlertTriangle,
  History,
  Lock,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Eye,
  Info,
  Flame,
  ArrowRight
} from 'lucide-react';

/**
 * LuckRoyale Component
 * Tactical Black Market rare-item reward wheel with server-side weighted probability,
 * strict atomic scarcity cap enforcement, and instant Black Market tradeability.
 */
export function LuckRoyale({ onNavigate }) {
  const { activePlayerId, activePlayer, wallets, refreshPlayerData, dbStatus } = usePlayer();
  const { addNotification } = useNotification();

  const [wheelData, setWheelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);

  // Modals & Panels
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [revealedReward, setRevealedReward] = useState(null);
  const [selectedRewardDetail, setSelectedRewardDetail] = useState(null);

  const canvasRef = useRef(null);

  const loadWheelState = async () => {
    try {
      setLoading(true);
      const res = await api.getWheelState(activePlayerId);
      if (res.success) {
        setWheelData(res);
      }
    } catch (err) {
      console.error('Failed to load Luck Royale state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWheelState();
  }, [activePlayerId, dbStatus.connected]);

  const event = wheelData?.event;
  const rewards = wheelData?.rewards || [];
  const player = wheelData?.player;
  const recentWinners = wheelData?.recentWinners || [];

  // Find exclusive reward (Phantom Prototype)
  const exclusiveReward = rewards.find((r) => r.is_exclusive);
  const isExclusiveSoldOut = exclusiveReward?.is_sold_out;

  // Draw the Tactical Wheel on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || rewards.length === 0) return;

    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 12;
    const numSlices = rewards.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    ctx.clearRect(0, 0, size, size);

    // Draw Wheel Outer Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius + 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#171D24';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#303B45';
    ctx.stroke();

    // Draw Slices
    rewards.forEach((r, i) => {
      const startAngle = i * sliceAngle - Math.PI / 2;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();

      // Slice background alternating tactical slate
      if (r.is_sold_out) {
        ctx.fillStyle = '#14181F';
      } else if (r.is_exclusive) {
        ctx.fillStyle = i % 2 === 0 ? '#221915' : '#2A1F19';
      } else {
        ctx.fillStyle = i % 2 === 0 ? '#1C242C' : '#222C36';
      }
      ctx.fill();

      // Inner divider line
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#303B45';
      ctx.stroke();

      // Outer Rarity Accent Rim
      ctx.beginPath();
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.lineWidth = 5;
      if (r.is_sold_out) {
        ctx.strokeStyle = '#4A5563';
      } else {
        const rarityStroke = {
          Mythic: '#D65050',
          Legendary: '#D99A3D',
          Epic: '#9D68D9',
          Rare: '#4D8DF7',
          Uncommon: '#45B889',
          Common: '#9AA8B5',
        }[r.rarity] || '#D99A3D';
        ctx.strokeStyle = rarityStroke;
      }
      ctx.stroke();

      // Text Label along the slice
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      // Item Name
      ctx.font = r.is_exclusive ? 'bold 12px "Barlow Condensed", sans-serif' : '600 11px "Barlow Condensed", sans-serif';
      ctx.fillStyle = r.is_sold_out ? '#6B7B8B' : r.is_exclusive ? '#D99A3D' : '#E8EDF2';
      
      const label = r.is_sold_out ? `${r.item_name} [SOLD OUT]` : r.item_name;
      // Truncate if long
      const displayLabel = label.length > 18 ? label.substring(0, 16) + '..' : label;
      ctx.fillText(displayLabel.toUpperCase(), radius - 18, 0);

      ctx.restore();
    });

    // Center Hub Rim
    ctx.beginPath();
    ctx.arc(center, center, 44, 0, 2 * Math.PI);
    ctx.fillStyle = '#171D24';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#D99A3D';
    ctx.stroke();

    ctx.restore();
  }, [rewards]);

  // Request Confirmation Handler
  const handleInitiateSpin = () => {
    if (spinning) return;
    if (!player?.canAfford) {
      addNotification(`Insufficient ${event?.currencyName || 'balance'} to spin. Required: ${event?.spinCost} ${event?.currencySymbol}`, 'error');
      return;
    }
    setShowConfirmModal(true);
  };

  // Authoritative Backend Spin Execution
  const handleConfirmSpin = async () => {
    setShowConfirmModal(false);
    if (spinning) return;

    try {
      setSpinning(true);
      setRevealedReward(null);

      // Unique idempotency key to prevent double charging
      const idempotencyKey = `spin_${activePlayerId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // 1. Authoritative Backend determines reward
      const res = await api.spinWheel(activePlayerId, idempotencyKey);

      if (!res.success) {
        setSpinning(false);
        addNotification(res.error || 'Spin authorization declined by server.', 'error');
        return;
      }

      const wonReward = res.reward;

      // 2. Locate winning slice index
      const winningIndex = rewards.findIndex(
        (r) => r.reward_id === wonReward.reward_id || r.item_type_id === wonReward.item_type_id
      );

      const sliceCount = rewards.length || 9;
      const sliceAngleDeg = 360 / sliceCount;

      // Slice 0 is at -90deg (top). To land on slice i at top indicator:
      // Slice center angle = (i + 0.5) * sliceAngleDeg
      // Target rotation brings that angle to top (0 mod 360)
      const targetSliceOffset = 360 - (winningIndex + 0.5) * sliceAngleDeg;
      const fullRotations = 360 * 6; // 6 full dramatic spins
      const currentMod = rotationAngle % 360;
      const finalAngle = rotationAngle + (360 - currentMod) + fullRotations + targetSliceOffset;

      setRotationAngle(finalAngle);

      // 3. Complete animation after 4.2 seconds
      setTimeout(() => {
        setSpinning(false);
        setRevealedReward(wonReward);
        refreshPlayerData();
        loadWheelState();

        if (wonReward.is_exclusive) {
          addNotification(`CLASSIFIED ACQUISITION! You obtained the exclusive ${wonReward.item_name}!`, 'success');
        } else {
          addNotification(`Reward Unlocked: ${wonReward.item_name} added to Armory.`, 'success');
        }
      }, 4200);
    } catch (err) {
      setSpinning(false);
      addNotification(err.message || 'Network anomaly during spin execution.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '24px 28px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* 1. Header with Scarcity Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--accent-primary)',
                letterSpacing: '0.06em',
              }}
            >
              BLACK MARKET // LIMITED REWARD ECONOMY
            </span>
            <span style={{ color: 'var(--border-strong)' }}>|</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
              CLASSIFIED REQUISITION
            </span>
          </div>

          <h1 style={{ fontSize: '26px', color: 'var(--text-primary)', margin: 0 }}>
            LUCK ROYALE // WHEEL OF FORTUNE
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 4, maxWidth: '800px' }}>
            High-stakes tactical reward wheel engineered for genuine rare-item scarcity. Limited drops awarded here can be freely sold or traded to other operators through the Black Market exchange.
          </p>
        </div>

        {/* Currency Balance Pill */}
        <div
          className="tactical-panel"
          style={{
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <Coins size={18} color="var(--accent-primary)" />
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>
              AVAILABLE {event?.currencyName || 'COMBAT CREDITS'}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
              {parseFloat(player?.balance || 0).toLocaleString()} {event?.currencySymbol || 'CR'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Exclusive Trophy Showcase: PHANTOM PROTOTYPE */}
      {exclusiveReward && (
        <div
          className="tactical-panel"
          style={{
            padding: '18px 24px',
            background: isExclusiveSoldOut
              ? 'linear-gradient(135deg, rgba(28, 36, 44, 0.95) 0%, rgba(20, 24, 31, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(34, 25, 21, 0.95) 0%, rgba(28, 36, 44, 0.95) 100%)',
            borderLeft: isExclusiveSoldOut ? '4px solid #6B7B8B' : '4px solid var(--accent-primary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: '120px', flexShrink: 0 }}>
              <ItemVisual item={exclusiveReward} size="sm" showRarityGlow={false} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`rarity-badge rarity-${exclusiveReward.rarity}`}>
                  {exclusiveReward.rarity}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    color: isExclusiveSoldOut ? 'var(--color-error)' : 'var(--accent-primary)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {isExclusiveSoldOut ? '● GLOBAL SUPPLY EXHAUSTED' : '● CLASSIFIED LIMITED DROP'}
                </span>
              </div>

              <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginTop: 4 }}>
                {exclusiveReward.item_name}
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 2, maxWidth: '600px' }}>
                {exclusiveReward.description}
              </p>
            </div>
          </div>

          {/* Scarcity Gauge */}
          <div
            style={{
              padding: '12px 18px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-dim)',
              borderRadius: 'var(--radius-xs)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 4,
            }}
          >
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
              GLOBAL SUPPLY CAP
            </span>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '20px',
                fontWeight: 700,
                color: isExclusiveSoldOut ? 'var(--color-error)' : 'var(--color-success)',
              }}
            >
              {exclusiveReward.remaining_supply !== null ? exclusiveReward.remaining_supply : '—'} / {exclusiveReward.max_supply} REMAINING
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Base Chance: {exclusiveReward.base_percentage} | Live Probability: {exclusiveReward.effective_percentage}
            </span>
          </div>
        </div>
      )}

      {/* 3. Main Center: Tactical Wheel & Probabilities */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(340px, 1fr) minmax(320px, 1.1fr)',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* Left: Interactive Wheel Arena */}
        <div
          className="tactical-panel"
          style={{
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Wheel Frame Indicator Pin (Top Down Pointer) */}
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '12px solid transparent',
                borderRight: '12px solid transparent',
                borderTop: '20px solid var(--accent-primary)',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
              }}
            />
          </div>

          {/* Rotating Wheel Canvas */}
          <div
            style={{
              position: 'relative',
              width: '380px',
              height: '380px',
              margin: '16px auto',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                transform: `rotate(${rotationAngle}deg)`,
                transition: spinning ? 'transform 4.2s cubic-bezier(0.12, 0.8, 0.2, 1)' : 'none',
              }}
            >
              <canvas
                ref={canvasRef}
                width={380}
                height={380}
                style={{ width: '100%', height: '100%', display: 'block' }}
              />
            </div>

            {/* Central Tactical Spin Button (Static in Center Hub) */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 8,
              }}
            >
              <button
                onClick={handleInitiateSpin}
                disabled={spinning || !player?.canAfford}
                style={{
                  width: '82px',
                  height: '82px',
                  borderRadius: '50%',
                  backgroundColor: spinning ? 'var(--bg-elevated)' : 'var(--accent-primary)',
                  color: spinning ? 'var(--text-muted)' : '#101419',
                  border: '3px solid #303B45',
                  boxShadow: spinning ? 'none' : '0 0 16px rgba(217, 154, 61, 0.35)',
                  cursor: spinning || !player?.canAfford ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-display)',
                  transition: 'all 0.15s ease',
                }}
                title={player?.canAfford ? 'Confirm Requisition Spin' : 'Insufficient balance'}
              >
                {spinning ? (
                  <RefreshCw size={22} className="spin" color="var(--accent-primary)" />
                ) : (
                  <>
                    <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.04em', lineHeight: 1 }}>
                      SPIN
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 700, marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                      {event?.spinCost} {event?.currencySymbol}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action Bar Beneath Wheel */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 16,
              borderTop: '1px solid var(--border-dim)',
              marginTop: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: 'var(--text-muted)' }}>
              <Shield size={14} color="var(--accent-olive)" />
              <span>Atomic Server-Side Verification Active</span>
            </div>

            <button
              onClick={handleInitiateSpin}
              disabled={spinning || !player?.canAfford}
              className="tactical-btn tactical-btn-primary"
              style={{ padding: '8px 20px', fontSize: '12px' }}
            >
              <Zap size={14} />
              {spinning ? 'PROCESSING DROP...' : `REQUISITION (${event?.spinCost || 500} ${event?.currencySymbol || 'CR'})`}
            </button>
          </div>
        </div>

        {/* Right: Live Probabilities & Scarcity Ledger */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="tactical-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <span className="tech-tag">TRANSPARENT REWARD MATRIX</span>
                <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginTop: 2 }}>
                  REWARD PROBABILITIES & SUPPLY STATUS
                </h3>
              </div>

              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {rewards.length} REGISTERED DROPS
              </span>
            </div>

            {/* Probability Redistribution Notice */}
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: 'var(--bg-surface)',
                borderLeft: '3px solid var(--accent-olive)',
                borderRadius: 'var(--radius-xs)',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                marginBottom: 14,
                lineHeight: 1.4,
              }}
            >
              <strong>Redistribution Rule:</strong> When an exclusive reward hits its global cap, its probability is automatically redistributed proportionally among the remaining active drops.
            </div>

            {/* Rewards Table List */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                maxHeight: '340px',
                overflowY: 'auto',
                paddingRight: 4,
              }}
            >
              {rewards.map((r) => {
                const isSelected = selectedRewardDetail?.reward_id === r.reward_id;
                return (
                  <div
                    key={r.reward_id}
                    onClick={() => setSelectedRewardDetail(r)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: isSelected ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                      border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-dim)',
                      borderRadius: 'var(--radius-xs)',
                      cursor: 'pointer',
                      opacity: r.is_sold_out ? 0.6 : 1,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className={`rarity-badge rarity-${r.rarity}`} style={{ fontSize: '10px' }}>
                        {r.rarity}
                      </span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: r.is_sold_out ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                          {r.item_name}
                          {r.is_exclusive && (
                            <span style={{ fontSize: '10px', color: 'var(--accent-primary)', marginLeft: 6, fontWeight: 700 }}>
                              [LIMITED CAP: {r.max_supply}]
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {r.category}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {r.is_sold_out ? (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-error)' }}>
                          SOLD OUT
                        </span>
                      ) : (
                        <>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>
                            {r.effective_percentage}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            Base: {r.base_percentage}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Global Winners Feed */}
          <div className="tactical-panel" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <History size={15} color="var(--accent-olive)" />
              <h3 style={{ fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
                RECENT BLACK MARKET DROPS
              </h3>
            </div>

            {recentWinners.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '160px', overflowY: 'auto' }}>
                {recentWinners.slice(0, 5).map((w, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px',
                      padding: '5px 8px',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-xs)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                        {w.username}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>acquired</span>
                      <span style={{ color: 'var(--text-accent)', fontWeight: 600 }}>
                        {w.item_name}
                      </span>
                    </div>

                    <span className={`rarity-badge rarity-${w.rarity}`} style={{ fontSize: '9px' }}>
                      {w.rarity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
                No recent spins recorded. Be the first operator to requisition a drop.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Confirmation Modal */}
      {showConfirmModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 16,
          }}
        >
          <div
            className="tactical-panel"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '24px',
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--border-strong)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent-primary)', marginBottom: 8 }}>
              <Zap size={18} />
              <h3 style={{ fontSize: '17px', margin: 0, color: 'var(--text-primary)' }}>
                CONFIRM BLACK MARKET REQUISITION
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '8px 0 16px' }}>
              Spinning the tactical wheel will deduct <strong>{event?.spinCost} {event?.currencyName || 'Credits'}</strong> from your active wallet. Drops are guaranteed authentic and automatically stored in your Armory.
            </p>

            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-dim)',
                borderRadius: 'var(--radius-xs)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                marginBottom: 20,
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Current Balance:</span>
              <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {parseFloat(player?.balance || 0).toLocaleString()} {event?.currencySymbol}
              </strong>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="tactical-btn tactical-btn-secondary"
                style={{ padding: '8px 14px' }}
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirmSpin}
                className="tactical-btn tactical-btn-primary"
                style={{ padding: '8px 18px' }}
              >
                AUTHORIZE SPIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Reveal Reward Modal */}
      {revealedReward && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.82)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 16,
          }}
        >
          <div
            className="tactical-panel"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '28px',
              backgroundColor: 'var(--bg-panel)',
              border: `2px solid ${revealedReward.is_exclusive ? 'var(--accent-primary)' : 'var(--border-strong)'}`,
              boxShadow: '0 12px 32px rgba(0,0,0,0.8)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Sparkles size={16} color="var(--accent-primary)" />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary)', letterSpacing: '0.08em' }}>
                {revealedReward.is_exclusive ? 'CLASSIFIED EXCLUSIVE DROP!' : 'REQUISITION REWARD ACQUIRED'}
              </span>
            </div>

            <h2 style={{ fontSize: '24px', color: 'var(--text-primary)', margin: '4px 0 12px' }}>
              {revealedReward.item_name}
            </h2>

            {/* Full Uncropped Item Visual */}
            <div style={{ width: '220px', margin: '0 auto 16px' }}>
              <ItemVisual item={revealedReward} size="lg" />
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <span className={`rarity-badge rarity-${revealedReward.rarity}`}>
                {revealedReward.rarity}
              </span>
              <span className="tech-tag" style={{ padding: '2px 8px', background: 'var(--bg-surface)' }}>
                {revealedReward.category}
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.4 }}>
              {revealedReward.description}
            </p>

            {revealedReward.is_exclusive && (
              <div
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(217, 154, 61, 0.1)',
                  border: '1px solid var(--accent-primary)',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '12px',
                  color: 'var(--accent-primary)',
                  marginBottom: 18,
                  lineHeight: 1.4,
                }}
              >
                ★ <strong>High-Value Asset:</strong> This is a limited supply item. You may equip it directly or list it on the Black Market for significant profit!
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, width: '100%' }}>
              <button
                onClick={() => {
                  setRevealedReward(null);
                  if (onNavigate) onNavigate('inventory');
                }}
                className="tactical-btn tactical-btn-secondary"
                style={{ flex: 1, padding: '10px' }}
              >
                VIEW IN ARMORY
              </button>

              <button
                onClick={() => {
                  setRevealedReward(null);
                  if (onNavigate) onNavigate('marketplace');
                }}
                className="tactical-btn tactical-btn-primary"
                style={{ flex: 1, padding: '10px' }}
              >
                TRADE ON MARKET
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LuckRoyale;

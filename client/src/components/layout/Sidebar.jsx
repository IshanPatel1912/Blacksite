import React from 'react';
import { usePlayer } from '../../context/PlayerContext';
import {
  LayoutDashboard,
  Shield,
  ShoppingBag,
  ArrowLeftRight,
  Repeat,
  Wallet,
  BookOpen,
  UserCheck,
  FileText,
  Terminal,
  Compass,
  ChevronLeft,
  ChevronRight,
  Crown,
  Package,
  Layers,
  Sparkles
} from 'lucide-react';

export function Sidebar({ currentTab, setCurrentTab, isCollapsed, onToggleCollapse }) {
  const { authRole } = usePlayer();
  const isAdmin = authRole === 'admin';

  // Navigation for Player (Section 3: Dashboard, Inventory, Store, Marketplace, Luck Royale, Trades, Wallet, Catalog, Profile, Activity Logs, Database Lab)
  const playerMainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Shield },
    { id: 'store', label: 'Store', icon: ShoppingBag },
    { id: 'marketplace', label: 'Marketplace', icon: ArrowLeftRight },
    { id: 'luck-royale', label: 'Luck Royale', icon: Compass, badge: 'HOT', highlight: true },
    { id: 'trades', label: 'Trades', icon: Repeat },
    { id: 'wallets', label: 'Wallet', icon: Wallet },
  ];

  const playerAdditionalNav = [
    { id: 'catalog', label: 'Catalog', icon: BookOpen },
    { id: 'profile', label: 'Profile', icon: UserCheck },
    { id: 'audit', label: 'Activity Logs', icon: FileText },
    { id: 'db-lab', label: 'Database Lab', icon: Terminal },
  ];

  // Navigation for Admin
  const adminMainNav = [
    { id: 'admin-dashboard', label: 'Command Hub', icon: Crown, highlight: true },
    { id: 'luck-royale', label: 'Luck Royale Wheel', icon: Compass },
    { id: 'catalog', label: 'Item Catalog', icon: BookOpen },
    { id: 'store', label: 'Store Operations', icon: ShoppingBag },
    { id: 'marketplace', label: 'Marketplace', icon: ArrowLeftRight },
    { id: 'audit', label: 'Activity Logs', icon: FileText },
  ];

  const adminSecondaryNav = [
    { id: 'inventory', label: 'Player Inventory', icon: Shield },
    { id: 'profile', label: 'Personnel Roster', icon: UserCheck },
    { id: 'db-lab', label: 'Database Lab', icon: Terminal },
  ];

  const activeMainList = isAdmin ? adminMainNav : playerMainNav;
  const activeSecondaryList = isAdmin ? adminSecondaryNav : playerAdditionalNav;

  return (
    <aside
      style={{
        width: isCollapsed ? '64px' : '220px',
        backgroundColor: 'var(--bg-surface)',
        borderRight: `1px solid ${isAdmin ? 'rgba(227, 93, 93, 0.3)' : 'var(--border-dim)'}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0,
        height: 'calc(100vh - 56px)',
        position: 'sticky',
        top: '56px',
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 40,
      }}
    >
      {/* Navigation List */}
      <nav style={{ padding: isCollapsed ? '16px 8px' : '16px 12px', overflowY: 'auto' }}>
        {/* MAIN SECTION */}
        <div style={{ marginBottom: '18px' }}>
          {!isCollapsed && (
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '11px',
                fontWeight: 700,
                color: isAdmin ? 'var(--color-error)' : 'var(--text-muted)',
                letterSpacing: '0.06em',
                marginBottom: '8px',
                paddingLeft: '10px',
              }}
            >
              {isAdmin ? 'COMMAND OPERATIONS' : 'MAIN'}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {activeMainList.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isCollapsed ? '0' : '12px',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    padding: isCollapsed ? '10px' : '9px 12px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: isActive
                      ? isAdmin
                        ? 'rgba(227, 93, 93, 0.16)'
                        : 'rgba(217, 154, 61, 0.14)'
                      : 'transparent',
                    color: isActive
                      ? isAdmin
                        ? 'var(--color-error)'
                        : 'var(--accent-primary)'
                      : 'var(--text-secondary)',
                    borderLeft: isActive && !isCollapsed
                      ? `3px solid ${isAdmin ? 'var(--color-error)' : 'var(--accent-primary)'}`
                      : '3px solid transparent',
                    borderTop: 'none',
                    borderRight: 'none',
                    borderBottom: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '0.02em',
                    fontWeight: isActive ? 700 : 500,
                    width: '100%',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    size={17}
                    color={
                      isActive
                        ? isAdmin
                          ? 'var(--color-error)'
                          : 'var(--accent-primary)'
                        : 'var(--text-secondary)'
                    }
                  />
                  {!isCollapsed && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span>{item.label}</span>
                      {item.badge && (
                        <span
                          style={{
                            fontSize: '9px',
                            fontFamily: 'var(--font-display)',
                            padding: '1px 5px',
                            borderRadius: '2px',
                            backgroundColor: 'rgba(217, 154, 61, 0.2)',
                            color: 'var(--accent-primary)',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ADDITIONAL SECTION */}
        <div>
          {!isCollapsed && (
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.06em',
                marginBottom: '8px',
                paddingLeft: '10px',
              }}
            >
              {isAdmin ? 'INSPECTION & TOOLS' : 'ADDITIONAL'}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {activeSecondaryList.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isCollapsed ? '0' : '12px',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    padding: isCollapsed ? '10px' : '9px 12px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: isActive
                      ? 'rgba(163, 179, 107, 0.16)'
                      : 'transparent',
                    color: isActive ? 'var(--accent-olive)' : 'var(--text-secondary)',
                    borderLeft: isActive && !isCollapsed
                      ? '3px solid var(--accent-olive)'
                      : '3px solid transparent',
                    borderTop: 'none',
                    borderRight: 'none',
                    borderBottom: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '0.02em',
                    fontWeight: isActive ? 700 : 500,
                    width: '100%',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    size={17}
                    color={isActive ? 'var(--accent-olive)' : 'var(--text-secondary)'}
                  />
                  {!isCollapsed && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span>{item.label}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div
        style={{
          padding: isCollapsed ? '12px 6px' : '12px 14px',
          borderTop: '1px solid var(--border-dim)',
          backgroundColor: 'var(--bg-panel)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {!isCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
            <span>BLACKSITE OS v2.5</span>
            <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>● DEPLOYED</span>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="tactical-btn tactical-btn-secondary"
          style={{
            width: '100%',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '11px',
          }}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <ChevronRight size={14} /> : (
            <>
              <ChevronLeft size={14} />
              <span>COLLAPSE</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;

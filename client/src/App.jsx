import React, { useState, useEffect } from 'react';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { NotificationProvider } from './context/NotificationContext';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { DbStatusBanner } from './components/layout/DbStatusBanner';
import { NotificationToast } from './components/layout/NotificationToast';

import { AuthGateway } from './pages/AuthGateway';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ArmoryInventory } from './pages/ArmoryInventory';
import { ItemCatalog } from './pages/ItemCatalog';
import { SupplyDepot } from './pages/SupplyDepot';
import { Marketplace } from './pages/Marketplace';
import { Trades } from './pages/Trades';
import { Wallets } from './pages/Wallets';
import { PlayerProfile } from './pages/PlayerProfile';
import { AuditLogs } from './pages/AuditLogs';
import { LuckRoyale } from './pages/LuckRoyale';
import { DatabaseLab } from './pages/DatabaseLab';

function AppContent() {
  const { isAuthenticated, authRole } = usePlayer();
  const isAdmin = authRole === 'admin';

  const [currentTab, setCurrentTab] = useState(isAdmin ? 'admin-dashboard' : 'dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Automatically update tab default when role switches
  useEffect(() => {
    if (isAdmin && currentTab === 'dashboard') {
      setCurrentTab('admin-dashboard');
    } else if (!isAdmin && currentTab === 'admin-dashboard') {
      setCurrentTab('dashboard');
    }
  }, [isAdmin]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  // If user is not yet logged in, show AuthGateway
  if (!isAuthenticated) {
    return <AuthGateway />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'inventory':
        return <ArmoryInventory />;
      case 'catalog':
        return <ItemCatalog />;
      case 'store':
        return <SupplyDepot />;
      case 'marketplace':
        return <Marketplace onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'luck-royale':
        return <LuckRoyale onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'trades':
        return <Trades />;
      case 'wallets':
        return <Wallets />;
      case 'profile':
        return <PlayerProfile />;
      case 'audit':
        return <AuditLogs />;
      case 'db-lab':
        return <DatabaseLab />;
      default:
        return isAdmin ? (
          <AdminDashboard onNavigate={(tab) => setCurrentTab(tab)} />
        ) : (
          <Dashboard onNavigate={(tab) => setCurrentTab(tab)} />
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Top Bar */}
      <TopBar
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={toggleSidebar}
      />

      {/* Database Health Diagnostic Alert Banner */}
      <DbStatusBanner />

      {/* Layout Body: Sidebar + Main Content */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />

        <main
          style={{
            flex: 1,
            minWidth: 0,
            overflowY: 'auto',
            height: 'calc(100vh - 56px)',
          }}
        >
          {renderContent()}
        </main>
      </div>

      {/* Toast Notification Container */}
      <NotificationToast />
    </div>
  );
}

export function App() {
  return (
    <NotificationProvider>
      <PlayerProvider>
        <AppContent />
      </PlayerProvider>
    </NotificationProvider>
  );
}

export default App;
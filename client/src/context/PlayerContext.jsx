import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  // Stored Session State
  const initialRole = localStorage.getItem('blacksite_role') || 'player';
  const initialAuth = localStorage.getItem('blacksite_authenticated') === 'true';
  const initialPlayerId = parseInt(localStorage.getItem('blacksite_player_id') || '1', 10);

  const [authRole, setAuthRole] = useState(initialRole); // 'player' | 'admin'
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuth);
  const [activePlayerId, setActivePlayerId] = useState(initialPlayerId);
  const [playersList, setPlayersList] = useState([]);
  const [activePlayer, setActivePlayer] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [dbStatus, setDbStatus] = useState({
    connected: false,
    checking: true,
    error: null,
    database: 'blacksite_armory',
  });
  const [loading, setLoading] = useState(true);

  const adminUser = {
    username: 'COMMAND_OVERSEER',
    callsign: 'OVERSEER // 01',
    role: 'ADMIN',
    clearance: 'LEVEL-5 TOP SECRET',
    status: 'active',
  };

  // Probe Database Health
  const checkHealth = useCallback(async () => {
    try {
      const res = await api.getHealth();
      setDbStatus({
        ...res.data,
        checking: false,
      });
      return res.data;
    } catch (err) {
      setDbStatus((prev) => ({
        ...prev,
        connected: false,
        checking: false,
        error: err.message || 'Cannot reach backend server',
      }));
      return { connected: false };
    }
  }, []);

  // Fetch Available Demonstration Players
  const fetchPlayers = useCallback(async () => {
    try {
      const res = await api.getPlayers();
      if (res.success && Array.isArray(res.data)) {
        setPlayersList(res.data);
      }
    } catch (err) {
      // Ignored if DB is disconnected
    }
  }, []);

  // Fetch Active Player Details & Wallets
  const fetchPlayerData = useCallback(async (playerId) => {
    try {
      setLoading(true);
      const res = await api.getPlayer(playerId);
      if (res.success) {
        setActivePlayer(res.data.player);
        setWallets(res.data.wallets || []);
      }
    } catch (err) {
      // Handled in UI
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    let intervalId;

    async function init() {
      const health = await checkHealth();
      if (health.connected) {
        await fetchPlayers();
        if (activePlayerId) {
          await fetchPlayerData(activePlayerId);
        }
      } else {
        setLoading(false);
      }
    }

    init();

    // Check health every 15s
    intervalId = setInterval(async () => {
      const health = await checkHealth();
      if (health.connected && playersList.length === 0) {
        fetchPlayers();
        if (activePlayerId) fetchPlayerData(activePlayerId);
      }
    }, 15000);

    return () => clearInterval(intervalId);
  }, [checkHealth, fetchPlayers, fetchPlayerData, activePlayerId]);

  // Player Login
  const loginAsPlayer = (playerId = 1) => {
    const pId = parseInt(playerId, 10);
    setActivePlayerId(pId);
    setAuthRole('player');
    setIsAuthenticated(true);
    localStorage.setItem('blacksite_role', 'player');
    localStorage.setItem('blacksite_authenticated', 'true');
    localStorage.setItem('blacksite_player_id', String(pId));
    fetchPlayerData(pId);
  };

  // Admin Login
  const loginAsAdmin = (passcode = '') => {
    setAuthRole('admin');
    setIsAuthenticated(true);
    localStorage.setItem('blacksite_role', 'admin');
    localStorage.setItem('blacksite_authenticated', 'true');
  };

  // Logout
  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('blacksite_authenticated');
  };

  // Switch between roles
  const switchRole = (newRole) => {
    const role = newRole === 'admin' ? 'admin' : 'player';
    setAuthRole(role);
    localStorage.setItem('blacksite_role', role);
    if (role === 'player' && activePlayerId) {
      fetchPlayerData(activePlayerId);
    }
  };

  // When player changes
  const switchPlayer = (playerId) => {
    const pId = parseInt(playerId, 10);
    setActivePlayerId(pId);
    localStorage.setItem('blacksite_player_id', String(pId));
    fetchPlayerData(pId);
  };

  const refreshPlayerData = () => {
    checkHealth();
    fetchPlayers();
    if (activePlayerId) fetchPlayerData(activePlayerId);
  };

  return (
    <PlayerContext.Provider
      value={{
        authRole,
        isAuthenticated,
        adminUser,
        activePlayerId,
        activePlayer,
        wallets,
        playersList,
        dbStatus,
        loading,
        loginAsPlayer,
        loginAsAdmin,
        logout,
        switchRole,
        switchPlayer,
        refreshPlayerData,
        checkHealth,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}

export default PlayerContext;
const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const json = await res.json().catch(() => ({
      success: false,
      error: 'PARSE_ERROR',
      message: 'Failed to parse JSON response from server.',
    }));

    if (!res.ok) {
      const error = new Error(json.message || json.error || `HTTP ${res.status}`);
      error.status = res.status;
      error.data = json;
      throw error;
    }

    return json;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const error = new Error('Cannot connect to backend server. Please ensure the backend is running on port 5000.');
      error.isNetworkError = true;
      throw error;
    }
    throw err;
  }
}

export const api = {
  // Health
  getHealth: () => request('/health'),

  // Players
  getPlayers: () => request('/players'),
  getPlayer: (id) => request(`/players/${id}`),
  updatePlayerStatus: (id, data) =>
    request(`/players/${id}/status`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Dashboard & Admin
  getDashboard: (playerId) => request(`/dashboard?playerId=${playerId}`),
  getAdminMetrics: () => request('/admin/metrics'),

  // Wallets & Currencies
  getCurrencies: () => request('/currencies'),
  getWallets: (playerId) => request(`/wallets?playerId=${playerId}`),
  fundWallet: (data) => request('/wallets/fund', { method: 'POST', body: JSON.stringify(data) }),
  getWalletTransactions: (playerId) => request(`/wallets/transactions?playerId=${playerId}`),

  // Armory Inventory
  getInventory: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/inventory?${query}`);
  },
  equipItem: (itemInstanceId, playerId) =>
    request('/inventory/equip', {
      method: 'POST',
      body: JSON.stringify({ itemInstanceId, playerId }),
    }),
  repairItem: (itemInstanceId, playerId) =>
    request('/inventory/repair', {
      method: 'POST',
      body: JSON.stringify({ itemInstanceId, playerId }),
    }),

  // Item Catalog
  getCatalog: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/catalog?${query}`);
  },
  createCatalogItem: (item) =>
    request('/catalog', {
      method: 'POST',
      body: JSON.stringify(item),
    }),

  // Supply Depot / Store
  getStoreOffers: () => request('/store'),
  createStoreOffer: (data) =>
    request('/store', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateStoreOffer: (id, data) =>
    request(`/store/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  purchaseStoreOffer: (playerId, offerId) =>
    request('/store/purchase', {
      method: 'POST',
      body: JSON.stringify({ playerId, offerId }),
    }),

  // Marketplace
  getMarketplace: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/marketplace?${query}`);
  },
  createMarketListing: (sellerId, itemInstanceId, currencyId, price) =>
    request('/marketplace/list', {
      method: 'POST',
      body: JSON.stringify({ sellerId, itemInstanceId, currencyId, price }),
    }),
  cancelMarketListing: (listingId, sellerId) =>
    request('/marketplace/cancel', {
      method: 'POST',
      body: JSON.stringify({ listingId, sellerId }),
    }),
  buyMarketListing: (buyerId, listingId) =>
    request('/marketplace/buy', {
      method: 'POST',
      body: JSON.stringify({ buyerId, listingId }),
    }),

  // Trades
  getTrades: (playerId, status = 'ALL') =>
    request(`/trades?playerId=${playerId}&status=${status}`),
  createTrade: (payload) =>
    request('/trades', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  acceptTrade: (tradeId, acceptorId) =>
    request(`/trades/${tradeId}/accept`, {
      method: 'POST',
      body: JSON.stringify({ acceptorId }),
    }),
  declineTrade: (tradeId, playerId) =>
    request(`/trades/${tradeId}/decline`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    }),
  cancelTrade: (tradeId, playerId) =>
    request(`/trades/${tradeId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    }),

  // Audit Logs
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/audit-logs?${query}`);
  },

  // Black Market // Luck Royale
  getWheelState: (playerId) => request(`/wheel/state?playerId=${playerId || ''}`),
  spinWheel: (playerId, idempotencyKey) =>
    request('/wheel/spin', {
      method: 'POST',
      body: JSON.stringify({ playerId, idempotencyKey }),
    }),
  getAdminWheelConfig: () => request('/wheel/admin/config'),
  updateWheelReward: (rewardId, data) =>
    request(`/wheel/admin/reward/${rewardId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateWheelEvent: (data) =>
    request('/wheel/admin/event', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getWheelSpinHistory: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/wheel/admin/history?${query}`);
  },

  // Database Lab
  getLabCategories: () => request('/db-lab/categories'),
  executeLabQuery: (queryId) =>
    request('/db-lab/execute', {
      method: 'POST',
      body: JSON.stringify({ queryId }),
    }),
};

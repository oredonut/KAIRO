/**
 * KAIRO — API Configuration
 * ─────────────────────────────────────────────
 * Central source of truth for all API endpoints and config.
 * Swap BASE_URL to your deployed FastAPI backend when ready.
 *
 * PRD §19 — API Modules reference:
 *   /api/v1/wallets   → balance, fund, send, withdraw, history
 *   /api/v1/scores    → current, history, explain
 *   /api/v1/transactions → list, detail, insights
 *   /api/v1/auth      → refresh
 */

// ─── Base URL ─────────────────────────────────────────────────────────────────
// Change this to your FastAPI backend URL.
// For local dev: http://localhost:8000
// For staging:   https://api-staging.kairo.app
// For prod:      https://api.kairo.app

export const API_BASE_URL = 'https://api.kairo.app';
export const API_VERSION   = 'v1';
export const API_ROOT      = `${API_BASE_URL}/api/${API_VERSION}`;

// ─── Endpoints ────────────────────────────────────────────────────────────────

export const ENDPOINTS = {
  // Auth
  auth: {
    refresh:  `${API_ROOT}/auth/refresh`,
    logout:   `${API_ROOT}/auth/logout`,
  },

  // Wallet (Squad-backed)
  wallet: {
    balance:  `${API_ROOT}/wallets/balance`,
    fund:     `${API_ROOT}/wallets/fund`,
    send:     `${API_ROOT}/wallets/send`,
    withdraw: `${API_ROOT}/wallets/withdraw`,
    history:  `${API_ROOT}/wallets/history`,
  },

  // Transactions
  transactions: {
    list:     `${API_ROOT}/transactions`,
    insights: `${API_ROOT}/transactions/insights`,
  },

  // Trust Score
  scores: {
    current:  `${API_ROOT}/scores/current`,
    history:  `${API_ROOT}/scores/history`,
    explain:  `${API_ROOT}/scores/explain`,
    simulate: `${API_ROOT}/scores/simulate`,
  },
} as const;

// ─── Request timeouts ─────────────────────────────────────────────────────────
export const TIMEOUT_MS = 10_000; // 10 seconds

// ─── Polling intervals ────────────────────────────────────────────────────────
export const POLL_INTERVAL = {
  wallet:     30_000,   // refresh balance every 30s
  trustScore: 60_000,   // refresh score every 60s
} as const;

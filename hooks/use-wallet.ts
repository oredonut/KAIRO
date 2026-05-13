/**
 * KAIRO — useWallet hook
 * ─────────────────────────────────────────────
 * Fetches wallet balance + transaction history from the Squad-backed API.
 * Falls back to mock data when the API is unreachable (demo / offline mode).
 *
 * Usage:
 *   const { balance, transactions, loading, error, refetch, sendMoney } = useWallet();
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError, NetworkError } from '@/services/apiClient';
import { ENDPOINTS, POLL_INTERVAL } from '@/constants/api';

// ─── API response types (Squad-shaped) ───────────────────────────────────────

export interface WalletBalance {
  balance: number;           // naira
  currency: 'NGN';
  account_number: string;
  bank_name: string;
  kyc_tier: 1 | 2 | 3;
  is_active: boolean;
}

export type TxnType = 'credit' | 'debit' | 'savings';

export interface WalletTransaction {
  id: string;
  type: TxnType;
  amount: number;
  description: string;
  counterparty: string;
  category: string;
  icon: string;
  timestamp: string;         // ISO 8601
  balance_after: number;
  reference: string;
}

interface TransactionListResponse {
  transactions: WalletTransaction[];
  total: number;
  page: number;
  has_more: boolean;
}

export interface SendMoneyPayload {
  recipient_account: string;
  bank_code: string;
  amount: number;
  narration?: string;
}

export interface SendMoneyResult {
  reference: string;
  status: 'success' | 'pending' | 'failed';
  message: string;
}

// ─── Mock fallback data ───────────────────────────────────────────────────────

const MOCK_BALANCE: WalletBalance = {
  balance: 42350,
  currency: 'NGN',
  account_number: '8021483560',
  bank_name: 'Wema Bank (Squad)',
  kyc_tier: 2,
  is_active: true,
};

const MOCK_TRANSACTIONS: WalletTransaction[] = [
  { id: 'txn_001', type: 'credit',  amount: 15000, description: 'Gig payment received',  counterparty: 'Emeka Okafor',       category: 'Income',   icon: '💼', timestamp: new Date(Date.now() - 2.7e6).toISOString(),  balance_after: 42350, reference: 'KR240513001' },
  { id: 'txn_002', type: 'debit',   amount: 3500,  description: 'Food & supplies',        counterparty: "Mama's Kitchen",     category: 'Food',     icon: '🍲', timestamp: new Date(Date.now() - 1.08e7).toISOString(), balance_after: 27350, reference: 'KR240513002' },
  { id: 'txn_003', type: 'savings', amount: 5000,  description: 'Savings deposit',        counterparty: 'Emergency Fund',     category: 'Savings',  icon: '🏦', timestamp: new Date(Date.now() - 2.16e7).toISOString(), balance_after: 30850, reference: 'KR240513003' },
  { id: 'txn_004', type: 'credit',  amount: 20000, description: 'Wallet funding',         counterparty: 'GTBank •• 4421',     category: 'Funding',  icon: '⬇️', timestamp: new Date(Date.now() - 8.64e7).toISOString(), balance_after: 35850, reference: 'KR240512001' },
  { id: 'txn_005', type: 'debit',   amount: 5000,  description: 'Transfer to bank',       counterparty: 'First Bank •• 8821', category: 'Transfer', icon: '🏧', timestamp: new Date(Date.now() - 9.36e7).toISOString(), balance_after: 15850, reference: 'KR240512002' },
  { id: 'txn_006', type: 'credit',  amount: 8000,  description: 'Service payment',        counterparty: 'Adaeze Nwosu',       category: 'Income',   icon: '⚙️', timestamp: new Date(Date.now() - 1.728e8).toISOString(), balance_after: 20850, reference: 'KR240511001' },
  { id: 'txn_007', type: 'debit',   amount: 500,   description: 'Airtime purchase',       counterparty: 'MTN Nigeria',        category: 'Utilities',icon: '📱', timestamp: new Date(Date.now() - 1.8e8).toISOString(),  balance_after: 12850, reference: 'KR240511002' },
  { id: 'txn_008', type: 'debit',   amount: 1200,  description: 'Market purchase',        counterparty: 'Balogun Market',     category: 'Shopping', icon: '🛒', timestamp: new Date(Date.now() - 2.592e8).toISOString(), balance_after: 13350, reference: 'KR240510001' },
  { id: 'txn_009', type: 'savings', amount: 2000,  description: 'Savings deposit',        counterparty: 'Device Fund',        category: 'Savings',  icon: '🏦', timestamp: new Date(Date.now() - 3.456e8).toISOString(), balance_after: 14550, reference: 'KR240509001' },
  { id: 'txn_010', type: 'credit',  amount: 12500, description: 'Gig payment received',  counterparty: 'Chukwudi Builders',  category: 'Income',   icon: '🏗', timestamp: new Date(Date.now() - 4.32e8).toISOString(),  balance_after: 16550, reference: 'KR240508001' },
];

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseWalletReturn {
  balance: WalletBalance | null;
  transactions: WalletTransaction[];
  loading: boolean;
  txnLoading: boolean;
  error: string | null;
  isOffline: boolean;        // true = showing mock data
  refetch: () => Promise<void>;
  sendMoney: (payload: SendMoneyPayload) => Promise<SendMoneyResult>;
  isSending: boolean;
}

export function useWallet(): UseWalletReturn {
  const [balance, setBalance]           = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [txnLoading, setTxnLoading]     = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [isOffline, setIsOffline]       = useState(false);
  const [isSending, setIsSending]       = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchBalance = useCallback(async () => {
    try {
      const data = await api.get<WalletBalance>(ENDPOINTS.wallet.balance);
      setBalance(data);
      setIsOffline(false);
      setError(null);
    } catch (err) {
      if (err instanceof NetworkError) {
        // Offline — use mock data silently
        setBalance(MOCK_BALANCE);
        setIsOffline(true);
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setBalance(MOCK_BALANCE);
        setIsOffline(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const data = await api.get<TransactionListResponse>(
        `${ENDPOINTS.transactions.list}?page=1&limit=20`,
      );
      setTransactions(data.transactions);
    } catch {
      // Silently fall back to mock transactions
      setTransactions(MOCK_TRANSACTIONS);
    } finally {
      setTxnLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    setTxnLoading(true);
    await Promise.all([fetchBalance(), fetchTransactions()]);
  }, [fetchBalance, fetchTransactions]);

  // Initial fetch + polling
  useEffect(() => {
    fetchBalance();
    fetchTransactions();

    pollRef.current = setInterval(fetchBalance, POLL_INTERVAL.wallet);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const sendMoney = useCallback(async (payload: SendMoneyPayload): Promise<SendMoneyResult> => {
    setIsSending(true);
    try {
      const result = await api.post<SendMoneyResult>(ENDPOINTS.wallet.send, payload);
      // Optimistically refresh balance after send
      await fetchBalance();
      await fetchTransactions();
      return result;
    } finally {
      setIsSending(false);
    }
  }, [fetchBalance, fetchTransactions]);

  return { balance, transactions, loading, txnLoading, error, isOffline, refetch, sendMoney, isSending };
}

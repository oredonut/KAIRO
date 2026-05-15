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
import { useOnboardingStore } from '@/store/onboarding-store';

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
  balance: 0,
  currency: 'NGN',
  account_number: '—',
  bank_name: 'Squad',
  kyc_tier: 1,
  is_active: true,
};

const MOCK_TRANSACTIONS: WalletTransaction[] = [];

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
  const { fullName } = useOnboardingStore();

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
      const personalized = MOCK_TRANSACTIONS.map(t => 
        t.id === 'txn_004' ? { ...t, description: `Funding for ${fullName || 'User'}` } : t
      );
      setTransactions(personalized);
    } finally {
      setTxnLoading(false);
    }
  }, [fullName]);

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

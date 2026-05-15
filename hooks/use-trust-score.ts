/**
 * KAIRO — useTrustScore hook
 * ─────────────────────────────────────────────
 * Fetches the user's Trust Score, signal breakdown, score history,
 * and SHAP explanation from the AI inference microservice.
 * Falls back to mock data when the API is unreachable.
 *
 * Usage:
 *   const { score, band, signals, history, explanation, loading, refetch } = useTrustScore();
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, NetworkError } from '@/services/apiClient';
import { ENDPOINTS, POLL_INTERVAL } from '@/constants/api';
import { useOnboardingStore } from '@/store/onboarding-store';

// ─── API response types ───────────────────────────────────────────────────────

export type ScoreBand = 'Emerging' | 'Developing' | 'Established' | 'Trusted' | 'Elite';

export interface ScoreSignal {
  key: string;
  label: string;
  weight: number;    // 0–1
  value: number;     // 0–1 (normalised fill)
  color: string;
}

export interface TrustScoreResponse {
  score: number;                 // 0–1000
  band: ScoreBand;
  signals: ScoreSignal[];
  model_version: string;
  computed_at: string;           // ISO 8601
  next_update_in_seconds: number;
}

export interface ScoreHistoryPoint {
  score: number;
  delta: number;
  event: string;
  timestamp: string;
}

export interface ScoreExplanation {
  delta: number;
  text: string;
  signal_key: string;
  computed_at: string;
}

// ─── Mock fallback data ───────────────────────────────────────────────────────

const MOCK_SCORE: TrustScoreResponse = {
  score: 420,
  band: 'Developing',
  signals: [
    { key: 'txn',        label: 'Transaction Consistency', weight: 0.30, value: 0.55, color: '#D4A017' },
    { key: 'repay',      label: 'Repayment Reliability',   weight: 0.25, value: 0.60, color: '#22C55E' },
    { key: 'savings',    label: 'Savings Behaviour',       weight: 0.15, value: 0.40, color: '#3B82F6' },
    { key: 'gig',        label: 'Work & Gig Completion',   weight: 0.15, value: 0.50, color: '#F59E0B' },
    { key: 'community',  label: 'Community Trust',         weight: 0.10, value: 0.35, color: '#8B5CF6' },
    { key: 'engagement', label: 'Platform Engagement',     weight: 0.05, value: 0.70, color: '#666666' },
  ],
  model_version: 'rule-based-v1',
  computed_at: new Date().toISOString(),
  next_update_in_seconds: 3600,
};

const MOCK_HISTORY: ScoreHistoryPoint[] = [];

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseTrustScoreReturn {
  score: number;
  band: ScoreBand;
  signals: ScoreSignal[];
  history: ScoreHistoryPoint[];
  explanation: ScoreExplanation | null;
  modelVersion: string;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  refetch: () => Promise<void>;
  /** Simulate an action locally (for demo) and update score optimistically */
  simulateAction: (delta: number, signalKey: string, explanationText: string) => void;
}

export function useTrustScore(): UseTrustScoreReturn {
  const { fullName, skills, voiceBio, walletCreated, bvnVerified } = useOnboardingStore();
  
  // Calculate initial score based on onboarding progress
  const initialScore = useMemo(() => {
    let base = 350; // Starting point
    if (fullName) base += 20;
    if (skills.length > 0) base += 30;
    if (bvnVerified) base += 100; // Big boost for BVN!
    if (voiceBio) base += 50;
    if (walletCreated) base += 50;
    return base;
  }, [fullName, skills, voiceBio, walletCreated, bvnVerified]);

  const historyPoints = useMemo(() => {
    const points: ScoreHistoryPoint[] = [];
    let current = 350;
    
    points.push({ score: 350, delta: 0, event: 'Identity Created', timestamp: 'May 01' });
    
    if (fullName) {
      current += 20;
      points.push({ score: current, delta: 20, event: 'Basic Info Added', timestamp: 'May 02' });
    }
    if (skills.length > 0) {
      current += 30;
      points.push({ score: current, delta: 30, event: 'Skills Defined', timestamp: 'May 05' });
    }
    if (voiceBio) {
      current += 50;
      points.push({ score: current, delta: 50, event: 'Voice Identity Linked', timestamp: 'May 10' });
    }
    if (bvnVerified) {
      current += 100;
      points.push({ score: current, delta: 100, event: 'BVN Verification Boost', timestamp: 'May 14' });
    }
    
    return points.reverse(); // Newest first for the list
  }, [fullName, skills, voiceBio, bvnVerified]);

  const [scoreData, setScoreData]       = useState<TrustScoreResponse>({
    ...MOCK_SCORE,
    score: initialScore,
    band: initialScore >= 500 ? 'Established' : 'Developing'
  });
  const [history, setHistory]           = useState<ScoreHistoryPoint[]>(historyPoints);
  const [explanation, setExplanation]   = useState<ScoreExplanation | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [isOffline, setIsOffline]       = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchScore = useCallback(async () => {
    try {
      const data = await api.get<TrustScoreResponse>(ENDPOINTS.scores.current);
      setScoreData(data);
      setIsOffline(false);
      setError(null);
    } catch (err) {
      if (err instanceof NetworkError) {
        setScoreData(MOCK_SCORE);
        setIsOffline(true);
      } else {
        setError('Could not load Trust Score');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await api.get<ScoreHistoryPoint[]>(ENDPOINTS.scores.history);
      setHistory(data);
    } catch {
      setHistory(historyPoints);
    }
  }, [historyPoints]);

  const fetchExplanation = useCallback(async () => {
    try {
      const data = await api.get<ScoreExplanation>(ENDPOINTS.scores.explain);
      setExplanation(data);
    } catch {
      // Explanation is optional — don't show error
    }
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchScore(), fetchHistory(), fetchExplanation()]);
  }, [fetchScore, fetchHistory, fetchExplanation]);

  // Initial fetch + polling
  useEffect(() => {
    fetchScore();
    fetchHistory();
    fetchExplanation();

    pollRef.current = setInterval(fetchScore, POLL_INTERVAL.trustScore);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  /**
   * Optimistically applies a score delta locally (for the live simulator).
   * In production this would be replaced by a webhook-triggered refetch
   * after the real action event hits the AI pipeline.
   */
  const simulateAction = useCallback((
    delta: number,
    signalKey: string,
    explanationText: string,
  ) => {
    const newScore = Math.min(1000, Math.max(0, scoreData.score + delta));

    setScoreData((prev) => {
      // Update the relevant signal fill
      const updatedSignals = prev.signals.map((s) => {
        if (s.key !== signalKey) return s;
        const bump = delta > 0 ? 0.08 : -0.12;
        return { ...s, value: Math.min(1, Math.max(0.02, s.value + bump)) };
      });

      // Determine new band
      const band = newScore >= 850 ? 'Elite'
        : newScore >= 700 ? 'Trusted'
        : newScore >= 500 ? 'Established'
        : newScore >= 300 ? 'Developing'
        : 'Emerging';

      return { ...prev, score: newScore, band, signals: updatedSignals };
    });

    setHistory((prev) => {
      const newPoint: ScoreHistoryPoint = {
        score: newScore,
        delta,
        event: explanationText,
        timestamp: new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }),
      };
      return [newPoint, ...prev.slice(0, 5)];
    });

    setExplanation({
      delta,
      text: explanationText,
      signal_key: signalKey,
      computed_at: new Date().toISOString(),
    });
  }, []);

  return {
    score:        scoreData.score,
    band:         scoreData.band,
    signals:      scoreData.signals,
    history,
    explanation,
    modelVersion: scoreData.model_version,
    loading,
    error,
    isOffline,
    refetch,
    simulateAction,
  };
}

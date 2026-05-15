/**
 * KAIRO — SquadWallet
 * ─────────────────────────────────────────────
 * Frontend B — Squad wallet screen + transaction list
 *
 * Sections:
 *  1. Balance hero card (dark-gold gradient)
 *  2. Virtual account chip + copy
 *  3. Quick actions: Add Money / Send / Receive / Withdraw
 *  4. Savings goal progress card
 *  5. Transaction list with filter tabs (All / In / Out / Savings)
 *  6. Cash-flow insight strip
 *
 * Data is mock-shaped to the Squad API response contract so the
 * real API can be dropped in with minimal changes.
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Palette, Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { useWallet } from '@/hooks/use-wallet';
import type { WalletTransaction } from '@/hooks/use-wallet';

const C = Colors.light;


// Savings goals
interface SavingsGoal {
  id: string;
  label: string;
  icon: string;
  target: number;
  current: number;
  dueDate: string;
}

const SAVINGS_GOALS: SavingsGoal[] = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  '\u20a6' + n.toLocaleString('en-NG', { minimumFractionDigits: 0 });

/** Accepts ISO 8601 string or Date */
function relativeTime(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

type FilterKey = 'all' | 'credit' | 'debit' | 'savings';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',     label: 'All' },
  { key: 'credit',  label: 'Money In' },
  { key: 'debit',   label: 'Money Out' },
  { key: 'savings', label: 'Savings' },
];

// ─── Transaction row ──────────────────────────────────────────────────────────

function TxnRow({ txn }: { txn: WalletTransaction }) {
  const isCredit  = txn.type === 'credit';
  const isSavings = txn.type === 'savings';
  const amountColor = isCredit ? C.success : isSavings ? Palette.status.infoBlue : C.error;
  const prefix = isCredit ? '+' : isSavings ? '→' : '-';

  return (
    <View style={styles.txnRow}>
      <View style={styles.txnIcon}>
        <Text style={styles.txnIconText}>{txn.icon}</Text>
      </View>

      <View style={styles.txnMiddle}>
        <Text style={styles.txnDesc} numberOfLines={1}>{txn.description}</Text>
        <Text style={styles.txnCounterparty} numberOfLines={1}>{txn.counterparty}</Text>
      </View>

      <View style={styles.txnRight}>
        <Text style={[styles.txnAmount, { color: amountColor }]}>
          {prefix}{fmt(txn.amount)}
        </Text>
        <Text style={styles.txnTime}>{relativeTime(txn.timestamp)}</Text>
      </View>
    </View>
  );
}

// ─── Quick action button ──────────────────────────────────────────────────────

function ActionBtn({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.75 }]}
      accessibilityLabel={label}
    >
      <View style={styles.actionIconWrap}>
        <Text style={styles.actionIcon}>{icon}</Text>
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

// ─── Savings goal card ────────────────────────────────────────────────────────

function GoalCard({ goal }: { goal: SavingsGoal }) {
  const pct = goal.current / goal.target;
  const animPct = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animPct, { toValue: pct, duration: 900, useNativeDriver: false }).start();
  }, []);

  const fillWidth = animPct.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.goalCard}>
      <View style={styles.goalHeader}>
        <Text style={styles.goalIcon}>{goal.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.goalLabel}>{goal.label}</Text>
          <Text style={styles.goalDue}>Target by {goal.dueDate}</Text>
        </View>
        <Text style={styles.goalAmt}>{fmt(goal.current)}<Text style={styles.goalTarget}> / {fmt(goal.target)}</Text></Text>
      </View>
      <View style={styles.goalTrack}>
        <Animated.View style={[styles.goalFill, { width: fillWidth }]} />
      </View>
      <Text style={styles.goalPct}>{Math.round(pct * 100)}% saved</Text>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SquadWallet() {
  // ── Live data from Squad-backed API (mock fallback when offline) ───────────
  const { balance, transactions, loading, txnLoading, isOffline, refetch } = useWallet();

  const [filter, setFilter]         = useState<FilterKey>('all');
  const [balanceVisible, setVisible] = useState(true);

  // Derived values from live data
  const acctRaw   = balance?.account_number ?? '8021483560';
  const acctFmt   = acctRaw.replace(/(\d{4})(\d{4})(\d{2})/, '$1 $2 $3');
  const bankName  = balance?.bank_name ?? 'Wema Bank (Squad)';
  const kycTier   = balance?.kyc_tier  ?? 2;
  const liveBal   = balance?.balance   ?? 0;

  const filtered = useMemo(() =>
    filter === 'all'
      ? transactions
      : transactions.filter((t) => t.type === filter),
    [filter, transactions]
  );

  // Cash-flow stats from real transaction history
  const totalIn  = transactions.filter((t) => t.type === 'credit' ).reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter((t) => t.type === 'debit'  ).reduce((s, t) => s + t.amount, 0);
  const saved    = transactions.filter((t) => t.type === 'savings').reduce((s, t) => s + t.amount, 0);

  const copyAccount = useCallback(() => {
    Alert.alert('Copied', `Account number ${acctFmt} copied to clipboard.`);
  }, [acctFmt]);

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

      {/* ── Offline indicator ── */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>⚡ Showing cached data — connect to refresh</Text>
        </View>
      )}

      {/* ── Balance hero card ── */}
      <View style={styles.heroCard}>
        {/* KYC badge */}
        <View style={styles.kyc}>
          <View style={styles.kycDot} />
          <Text style={styles.kycText}>Tier {kycTier} · Verified</Text>
        </View>

        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Pressable onPress={() => setVisible((v) => !v)}>
          <Text style={styles.balanceAmount}>
            {loading ? '₦ ···' : balanceVisible ? fmt(liveBal) : '₦ ••••••'}
          </Text>
        </Pressable>

        {/* Virtual account */}
        <Pressable onPress={copyAccount} style={styles.acctChip}>
          <Text style={styles.acctNum}>{acctFmt}</Text>
          <Text style={styles.acctBank}>{bankName}</Text>
          <Text style={styles.copyIcon}>⎘</Text>
        </Pressable>
      </View>

      {/* ── Quick actions ── */}
      <View style={styles.actionsCard}>
        <ActionBtn icon="⬇️"  label="Add Money" onPress={() => Alert.alert('Add Money', 'Fund via bank transfer or USSD.')} />
        <ActionBtn icon="➡️"  label="Send"       onPress={() => Alert.alert('Send',      'Enter recipient details.')} />
        <ActionBtn icon="📲"  label="Receive"    onPress={() => Alert.alert('Receive',   'Share your payment link.')} />
        <ActionBtn icon="🏧"  label="Withdraw"   onPress={() => Alert.alert('Withdraw',  'Transfer to your bank account.')} />
      </View>

      {/* ── Savings goals ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Savings Goals</Text>
          <Pressable onPress={() => router.push('/wallet/new-goal')}>
            <Text style={styles.sectionLink}>+ New goal</Text>
          </Pressable>
        </View>
        {SAVINGS_GOALS.map((g) => <GoalCard key={g.id} goal={g} />)}
      </View>

      {/* ── Cash-flow insight ── */}
      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>30-Day Cash Flow</Text>
        <View style={styles.insightRow}>
          {[
            { label: 'Total In',  value: fmt(totalIn),  color: C.success },
            { label: 'Total Out', value: fmt(totalOut), color: C.error   },
            { label: 'Saved',     value: fmt(saved),    color: Palette.status.infoBlue },
          ].map(({ label, value, color }) => (
            <View key={label} style={styles.insightItem}>
              <Text style={[styles.insightValue, { color }]}>{value}</Text>
              <Text style={styles.insightLabel}>{label}</Text>
            </View>
          ))}
        </View>
        {/* Savings rate bar */}
        <View style={styles.savingsRateRow}>
          <Text style={styles.savingsRateLabel}>Savings rate</Text>
          <View style={styles.savingsRateTrack}>
            <View style={[styles.savingsRateFill, { width: `${Math.round((saved / totalIn) * 100)}%` }]} />
          </View>
          <Text style={styles.savingsRatePct}>{Math.round((saved / totalIn) * 100)}%</Text>
        </View>
      </View>

      {/* ── Transactions ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transactions</Text>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
            >
              <Text style={[styles.filterTabText, filter === f.key && styles.filterTabTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* List */}
        <View style={styles.txnList}>
          {filtered.map((txn, i) => (
            <View key={txn.id}>
              <TxnRow txn={txn} />
              {i < filtered.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: Spacing[8] }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  content: { paddingBottom: Spacing[12] },

  // Offline banner
  offlineBanner: {
    marginHorizontal: Spacing[4],
    marginTop: Spacing[3],
    backgroundColor: Palette.status.warningAmber + '22',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderWidth: 1,
    borderColor: Palette.status.warningAmber + '55',
  },
  offlineText: {
    fontSize: Typography.size.xs,
    color: Palette.status.warningAmber,
    fontWeight: Typography.weight.medium,
    textAlign: 'center',
  },

  // Hero
  heroCard: {
    backgroundColor: Palette.dark[900],
    marginHorizontal: Spacing[4],
    marginTop: Spacing[3],
    borderRadius: Radius.xl,
    padding: Spacing[5],
    ...Shadows.lg,
    // Gold gradient shimmer via border
    borderWidth: 1,
    borderColor: Palette.gold[800],
  },
  kyc: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[1],
    marginBottom: Spacing[4],
  },
  kycDot: { width: 6, height: 6, borderRadius: Radius.full, backgroundColor: C.success },
  kycText: { fontSize: Typography.size.xs, color: Palette.dark[200], fontWeight: Typography.weight.medium },
  balanceLabel: { fontSize: Typography.size.sm, color: Palette.dark[300], marginBottom: Spacing[1] },
  balanceAmount: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontSize: 40,
    fontWeight: Typography.weight.bold,
    color: Palette.gold[400],
    letterSpacing: -1,
    marginBottom: Spacing[4],
  },
  acctChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Palette.dark[800],
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    gap: Spacing[3],
    borderWidth: 1, borderColor: Palette.dark[600],
    alignSelf: 'flex-start',
  },
  acctNum: { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: Palette.white.pure, letterSpacing: 1 },
  acctBank: { fontSize: Typography.size.xs, color: Palette.dark[300] },
  copyIcon: { fontSize: 14, color: Palette.gold[400] },

  // Actions
  actionsCard: {
    flexDirection: 'row',
    backgroundColor: C.backgroundElevated,
    marginHorizontal: Spacing[4],
    marginTop: Spacing[4],
    borderRadius: Radius.xl,
    padding: Spacing[4],
    ...Shadows.sm,
    borderWidth: 1, borderColor: C.border,
    justifyContent: 'space-between',
  },
  actionBtn: { alignItems: 'center', gap: Spacing[2], flex: 1 },
  actionIconWrap: {
    width: 48, height: 48,
    borderRadius: Radius.lg,
    backgroundColor: C.brandLight,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Palette.gold[200],
  },
  actionIcon: { fontSize: 20 },
  actionLabel: { fontSize: Typography.size.xs, color: C.textSecondary, fontWeight: Typography.weight.medium },

  // Sections
  section: {
    marginTop: Spacing[5],
    marginHorizontal: Spacing[4],
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[3] },
  sectionTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: C.textPrimary,
  },
  sectionLink: { fontSize: Typography.size.sm, color: C.brand, fontWeight: Typography.weight.semibold },

  // Savings goals
  goalCard: {
    backgroundColor: C.backgroundElevated,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    ...Shadows.sm,
    borderWidth: 1, borderColor: C.border,
  },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], marginBottom: Spacing[3] },
  goalIcon: { fontSize: 22 },
  goalLabel: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: C.textPrimary },
  goalDue: { fontSize: Typography.size.xs, color: C.textMuted },
  goalAmt: { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: C.brand },
  goalTarget: { fontSize: Typography.size.xs, fontWeight: Typography.weight.regular, color: C.textMuted },
  goalTrack: { height: 8, backgroundColor: C.backgroundCard, borderRadius: Radius.full, overflow: 'hidden' },
  goalFill: { height: '100%', backgroundColor: C.brand, borderRadius: Radius.full },
  goalPct: { fontSize: Typography.size.xs, color: C.textMuted, marginTop: Spacing[2], textAlign: 'right' },

  // Insight
  insightCard: {
    backgroundColor: C.backgroundElevated,
    marginHorizontal: Spacing[4],
    marginTop: Spacing[5],
    borderRadius: Radius.xl,
    padding: Spacing[4],
    ...Shadows.sm,
    borderWidth: 1, borderColor: C.border,
  },
  insightTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: C.textSecondary,
    marginBottom: Spacing[3],
  },
  insightRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing[3] },
  insightItem: { alignItems: 'center' },
  insightValue: { fontSize: Typography.size.md, fontWeight: Typography.weight.bold },
  insightLabel: { fontSize: Typography.size.xs, color: C.textMuted, marginTop: 2 },
  savingsRateRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  savingsRateLabel: { fontSize: Typography.size.xs, color: C.textMuted, width: 70 },
  savingsRateTrack: { flex: 1, height: 6, backgroundColor: C.backgroundCard, borderRadius: Radius.full, overflow: 'hidden' },
  savingsRateFill: { height: '100%', backgroundColor: Palette.status.infoBlue, borderRadius: Radius.full },
  savingsRatePct: { fontSize: Typography.size.xs, fontWeight: Typography.weight.bold, color: Palette.status.infoBlue, width: 28, textAlign: 'right' },

  // Filters
  filterRow: {
    flexDirection: 'row',
    backgroundColor: C.backgroundCard,
    borderRadius: Radius.lg,
    padding: 3,
    marginBottom: Spacing[3],
    borderWidth: 1, borderColor: C.border,
  },
  filterTab: { flex: 1, alignItems: 'center', paddingVertical: Spacing[2], borderRadius: Radius.md },
  filterTabActive: { backgroundColor: C.backgroundElevated, ...Shadows.sm },
  filterTabText: { fontSize: Typography.size.xs, color: C.textMuted, fontWeight: Typography.weight.medium },
  filterTabTextActive: { color: C.textPrimary, fontWeight: Typography.weight.bold },

  // Transactions
  txnList: {
    backgroundColor: C.backgroundElevated,
    borderRadius: Radius.xl,
    ...Shadows.sm,
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
  },
  txnRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[4],
    gap: Spacing[3],
  },
  txnIcon: {
    width: 40, height: 40,
    borderRadius: Radius.lg,
    backgroundColor: C.backgroundCard,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  txnIconText: { fontSize: 18 },
  txnMiddle: { flex: 1 },
  txnDesc: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: C.textPrimary },
  txnCounterparty: { fontSize: Typography.size.xs, color: C.textMuted, marginTop: 2 },
  txnRight: { alignItems: 'flex-end' },
  txnAmount: { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold },
  txnTime: { fontSize: Typography.size.xs, color: C.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: C.divider, marginLeft: Spacing[4] + 40 + Spacing[3] },
});

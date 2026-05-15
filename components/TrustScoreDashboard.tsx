/**
 * KAIRO — TrustScoreDashboard
 * ─────────────────────────────────────────────
 * Frontend B — Trust score dashboard + live simulation
 *
 * Sections:
 *  1. Animated SVG arc ring (0–1000 score)
 *  2. Score band chip + delta badge
 *  3. Signal breakdown — 6 weighted bars
 *  4. Live simulator — tap actions, watch score update
 *  5. SHAP-style plain-language explanation card
 *  6. Score history sparkline (last 7 events)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
// No SVG dependency — ring built with pure React Native Views
import { Palette, Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { useTrustScore } from '@/hooks/use-trust-score';

// ─── Theme shorthand ──────────────────────────────────────────────────────────
const C = Colors.light;

// ─── Score bands ──────────────────────────────────────────────────────────────
const BANDS = [
  { label: 'Emerging',    min: 0,   max: 299,  color: Palette.dark[300] },
  { label: 'Developing',  min: 300, max: 499,  color: Palette.status.infoBlue },
  { label: 'Established', min: 500, max: 699,  color: Palette.status.warningAmber },
  { label: 'Trusted',     min: 700, max: 849,  color: Palette.gold[500] },
  { label: 'Elite',       min: 850, max: 1000, color: Palette.status.successGreen },
] as const;

const getBand = (score: number) =>
  BANDS.find((b) => score >= b.min && score <= b.max) ?? BANDS[0];

// ─── Signal categories (PRD §9.1a) ───────────────────────────────────────────
const SIGNALS = [
  { key: 'txn',        label: 'Transaction Consistency', weight: 0.30, color: Palette.gold[500] },
  { key: 'repay',      label: 'Repayment Reliability',   weight: 0.25, color: Palette.status.successGreen },
  { key: 'savings',    label: 'Savings Behaviour',       weight: 0.15, color: Palette.status.infoBlue },
  { key: 'gig',        label: 'Work & Gig Completion',   weight: 0.15, color: Palette.status.warningAmber },
  { key: 'community',  label: 'Community Trust',         weight: 0.10, color: Palette.status.trustPurple },
  { key: 'engagement', label: 'Platform Engagement',     weight: 0.05, color: Palette.dark[400] },
] as const;

// ─── Simulation actions ───────────────────────────────────────────────────────
type SimAction = {
  icon: string;
  label: string;
  delta: number;
  signal: (typeof SIGNALS)[number]['key'];
  explanation: string;
};

const SIM_ACTIONS: SimAction[] = [
  {
    icon: '💳', label: 'Send payment',    delta: +8,
    signal: 'txn',
    explanation: 'Your score grew by {d} pts — transaction frequency improved this week.',
  },
  {
    icon: '✅', label: 'Complete a gig',  delta: +12,
    signal: 'gig',
    explanation: 'Your score grew by {d} pts — gig completion rate is now above average.',
  },
  {
    icon: '💰', label: 'Add to savings',  delta: +6,
    signal: 'savings',
    explanation: 'Your score grew by {d} pts — consistent saving builds economic trust.',
  },
  {
    icon: '⭐', label: 'Receive review',  delta: +10,
    signal: 'community',
    explanation: 'Your score grew by {d} pts — a new employer rating boosted your community trust.',
  },
  {
    icon: '❌', label: 'Miss repayment',  delta: -20,
    signal: 'repay',
    explanation: 'Your score dropped by {d} pts — a missed repayment hurt your reliability score.',
  },
  {
    icon: '📱', label: 'Daily check-in',  delta: +2,
    signal: 'engagement',
    explanation: 'Your score grew by {d} pts — staying active keeps your profile visible.',
  },
];

// ─── Pure-RN Arc Ring (no SVG, works on web + native) ────────────────────────
// Technique: two half-circle Views with overflow:hidden act as masks.
// The inner colored circle rotates within each mask to reveal the arc.
// A 270° arc is achieved by mapping score→rotation, then rotating the
// whole container 135° to set the start position (bottom-left).
const RING_SIZE = 200;
const STROKE_W = 14;
const HALF = RING_SIZE / 2;

interface ScoreRingProps { score: number; animValue: Animated.Value }

function ScoreRing({ score, animValue }: ScoreRingProps) {
  const band = getBand(score);

  // Right half: sweeps 0→180° for score 0→500, then stays at 180°
  const rightRotation = animValue.interpolate({
    inputRange: [0, 500, 1000],
    outputRange: ['-180deg', '0deg', '0deg'],
    extrapolate: 'clamp',
  });

  // Left half: stays hidden until score>500, then sweeps 0→90° (giving total 270°)
  const leftRotation = animValue.interpolate({
    inputRange: [0, 500, 1000],
    outputRange: ['-180deg', '-180deg', '-90deg'],
    extrapolate: 'clamp',
  });

  // Live score counter
  const [display, setDisplay] = useState(score);
  useEffect(() => {
    const id = animValue.addListener(({ value }) => setDisplay(Math.round(value)));
    return () => animValue.removeListener(id);
  }, [animValue]);

  return (
    <View style={styles.ringContainer}>
      {/* Whole ring rotated 135° to set arc start position */}
      <View style={styles.ringRotator}>
        {/* Background track */}
        <View style={styles.ringTrack} />

        {/* Right half mask */}
        <View style={[styles.halfMask, { right: 0 }]}>
          <Animated.View
            style={[
              styles.halfCircle,
              styles.halfCircleRight,
              { transform: [{ rotate: rightRotation }] },
            ]}
          />
        </View>

        {/* Left half mask */}
        <View style={[styles.halfMask, { left: 0 }]}>
          <Animated.View
            style={[
              styles.halfCircle,
              styles.halfCircleLeft,
              { transform: [{ rotate: leftRotation }] },
            ]}
          />
        </View>

        {/* Gold cap dots at arc ends */}
        <View style={styles.capStart} />
      </View>

      {/* Centre content — not rotated */}
      <View style={styles.ringCenter} pointerEvents="none">
        <Text style={styles.scoreNumber}>{display}</Text>
        <Text style={styles.scoreOf}>/1000</Text>
        <View style={[styles.bandChip, { backgroundColor: band.color + '22', borderColor: band.color + '55' }]}>
          <Text style={[styles.bandLabel, { color: band.color }]}>{band.label}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Signal bar ───────────────────────────────────────────────────────────────
interface SignalBarProps {
  label: string;
  weight: number;
  fill: number; // 0–1
  color: string;
  animated?: boolean;
}

function SignalBar({ label, weight, fill, color, animated: pulse }: SignalBarProps) {
  const anim = useRef(new Animated.Value(fill)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: fill,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [fill]);

  const pct = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.signalRow}>
      <Text style={styles.signalLabel} numberOfLines={1}>{label}</Text>
      <View style={styles.signalTrack}>
        <Animated.View style={[styles.signalFill, { width: pct, backgroundColor: color }]} />
      </View>
      <Text style={styles.signalWeight}>{(weight * 100).toFixed(0)}%</Text>
    </View>
  );
}

// ─── Explanation card ─────────────────────────────────────────────────────────
interface ExplainCardProps { text: string; delta: number }

function ExplainCard({ text, delta }: ExplainCardProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(8);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [text]);

  const isPositive = delta >= 0;

  return (
    <Animated.View style={[styles.explainCard, { opacity, transform: [{ translateY }] }]}>
      <View style={[styles.explainIcon, { backgroundColor: isPositive ? C.success + '22' : C.error + '22' }]}>
        <Text style={{ fontSize: 16 }}>{isPositive ? '📈' : '📉'}</Text>
      </View>
      <Text style={styles.explainText}>{text}</Text>
    </Animated.View>
  );
}

import { ScoreHistoryPoint } from '@/hooks/use-trust-score';

// ─── Growth Timeline ──────────────────────────────────────────────────────────
function GrowthTimeline({ history }: { history: ScoreHistoryPoint[] }) {
  return (
    <View style={styles.timelineContainer}>
      <Text style={styles.sectionTitle}>Trust Growth Story</Text>
      <Text style={styles.sectionSub}>How your economic identity has evolved</Text>
      
      <View style={styles.timelineList}>
        {history.map((point, i) => (
          <View key={i} style={styles.timelineItem}>
            <View style={styles.timelineLeft}>
              <View style={[styles.timelineDot, i === 0 && styles.activeDot]} />
              {i < history.length - 1 && <View style={styles.timelineLine} />}
            </View>
            <View style={styles.timelineRight}>
              <View style={styles.timelineRow}>
                <Text style={styles.timelineEvent}>{point.event}</Text>
                <Text style={styles.timelineDate}>{point.timestamp}</Text>
              </View>
              <Text style={styles.timelineDelta}>
                {point.delta > 0 ? '+' : ''}{point.delta} Points · Total: {point.score}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ history }: { history: ScoreHistoryPoint[] }) {
  if (history.length < 2) return null;
  const scores = history.map(h => h.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = Math.max(max - min, 1);

  return (
    <View style={styles.sparkContainer}>
      <Text style={styles.sparkTitle}>Recent Momentum</Text>
      <View style={styles.sparkBars}>
        {[...history].reverse().map((h, i) => {
          const val = h.score;
          const barH = ((val - min) / range) * 44 + 6;
          const isLast = i === history.length - 1;
          return (
            <View key={i} style={styles.sparkBarWrap}>
              <View
                style={[
                  styles.sparkBar,
                  {
                    height: barH,
                    backgroundColor: isLast ? Palette.gold[500] : Palette.gold[200],
                  },
                ]}
              />
              {isLast && <Text style={styles.sparkVal}>{val}</Text>}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function TrustScoreDashboard() {
  // ── Real API data (falls back to mock when offline) ──────────────────────
  const {
    score,
    band: apiBand,
    signals,
    history,
    explanation: apiExplanation,
    isOffline,
    simulateAction,
  } = useTrustScore();

  // animScore drives the ring + counter animations
  const animScore = useRef(new Animated.Value(score)).current;
  const [cooldown, setCooldown] = useState<string | null>(null);

  // Keep animScore in sync when the API updates the score
  useEffect(() => {
    Animated.timing(animScore, {
      toValue: score,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [score]);

  // Map API signals to the fill Record the SignalBar components expect
  const fills: Record<string, number> = {};
  signals.forEach((s) => { fills[s.key] = s.value; });

  // Wrap the hook's simulateAction with local cooldown + Animated trigger
  const applyAction = useCallback((action: SimAction) => {
    if (cooldown === action.label) return;
    const absD = Math.abs(action.delta);
    simulateAction(
      action.delta,
      action.signal,
      action.explanation.replace('{d}', String(absD)),
    );
    setCooldown(action.label);
    setTimeout(() => setCooldown(null), 1200);
  }, [cooldown, simulateAction]);

  // Explanation from hook (includes both API-pushed and sim-triggered)
  const explanation = apiExplanation
    ? { text: apiExplanation.text, delta: apiExplanation.delta }
    : null;

  const band = getBand(score);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Score ring ── */}
      <View style={styles.card}>
        <ScoreRing score={score} animValue={animScore} />

        {/* Next band progress hint */}
        {score < 1000 && (
          <Text style={styles.nextBandHint}>
            {1000 - score <= 150
              ? `${Math.ceil((BANDS[BANDS.findIndex(b => b.label === band.label) + 1]?.min ?? 1000) - score)} pts to next level`
              : `Keep building your economic identity`}
          </Text>
        )}
      </View>

      {/* ── Signal breakdown ── */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Score Signals</Text>
        <Text style={styles.sectionSub}>What's driving your Trust Score</Text>
        <View style={styles.signalList}>
          {SIGNALS.map((s) => (
            <SignalBar
              key={s.key}
              label={s.label}
              weight={s.weight}
              fill={fills[s.key]}
              color={s.color}
            />
          ))}
        </View>
      </View>

      {/* ── Live simulator ── */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Live Simulation</Text>
        <Text style={styles.sectionSub}>Tap an action — see your score update instantly</Text>
        <View style={styles.simGrid}>
          {SIM_ACTIONS.map((action) => {
            const isNeg = action.delta < 0;
            const onCD = cooldown === action.label;
            return (
              <Pressable
                key={action.label}
                onPress={() => applyAction(action)}
                style={({ pressed }) => [
                  styles.simBtn,
                  isNeg && styles.simBtnNeg,
                  (pressed || onCD) && { opacity: 0.6 },
                ]}
                accessibilityLabel={action.label}
              >
                <Text style={styles.simBtnIcon}>{action.icon}</Text>
                <Text style={[styles.simBtnLabel, isNeg && styles.simBtnLabelNeg]}>
                  {action.label}
                </Text>
                <Text style={[styles.simBtnDelta, isNeg && { color: C.error }]}>
                  {action.delta > 0 ? '+' : ''}{action.delta} pts
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── SHAP explanation ── */}
      {explanation && (
        <ExplainCard text={explanation.text} delta={explanation.delta} />
      )}

      {/* ── Sparkline history ── */}
      <View style={styles.card}>
        <Sparkline history={history} />
      </View>

      {/* ── Growth Timeline ── */}
      <View style={styles.card}>
        <GrowthTimeline history={history} />
      </View>

      {/* ── Band reference ── */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Score Bands</Text>
        {BANDS.map((b) => {
          const active = b.label === band.label;
          return (
            <View
              key={b.label}
              style={[styles.bandRow, active && { backgroundColor: b.color + '14' }]}
            >
              <View style={[styles.bandDot, { backgroundColor: b.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.bandRowLabel, active && { color: b.color, fontWeight: Typography.weight.bold }]}>
                  {b.label}
                </Text>
                <Text style={styles.bandRowRange}>{b.min}–{b.max}</Text>
              </View>
              {active && <Text style={[styles.hereBadge, { color: b.color }]}>← you</Text>}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  content: { padding: Spacing[4], gap: Spacing[4], paddingBottom: Spacing[12] },

  card: {
    backgroundColor: C.backgroundElevated,
    borderRadius: Radius.xl,
    padding: Spacing[5],
    ...Shadows.md,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },

  // Ring — half-circle masking technique
  ringContainer: { width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' },
  ringRotator: {
    position: 'absolute',
    width: RING_SIZE, height: RING_SIZE,
    transform: [{ rotate: '135deg' }],
  },
  ringTrack: {
    position: 'absolute',
    width: RING_SIZE, height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: STROKE_W,
    borderColor: Palette.white.mist,
  },
  halfMask: {
    position: 'absolute',
    width: RING_SIZE / 2,
    height: RING_SIZE,
    overflow: 'hidden',
  },
  halfCircle: {
    position: 'absolute',
    width: RING_SIZE, height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: STROKE_W,
    borderColor: Palette.gold[500],
  },
  halfCircleRight: { right: 0 },
  halfCircleLeft:  { left: 0 },
  capStart: {
    position: 'absolute',
    width: STROKE_W, height: STROKE_W,
    borderRadius: STROKE_W / 2,
    backgroundColor: Palette.gold[300],
    // Positioned at start of arc (bottom-left corner of the rotated container ≈ x=0, y=HALF)
    bottom: RING_SIZE / 2 - STROKE_W / 2,
    left: 0,
  },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  scoreNumber: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontSize: 52,
    fontWeight: Typography.weight.bold,
    color: C.textPrimary,
    lineHeight: 56,
    letterSpacing: -1,
  },
  scoreOf: { fontSize: Typography.size.sm, color: C.textMuted, marginTop: -2, marginBottom: Spacing[2] },
  bandChip: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing[3],
    paddingVertical: 3,
  },
  bandLabel: { fontSize: Typography.size.xs, fontWeight: Typography.weight.bold, letterSpacing: 0.5 },
  nextBandHint: { fontSize: Typography.size.xs, color: C.textMuted, marginTop: Spacing[3] },

  // Section
  sectionTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: C.textPrimary,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  sectionSub: { fontSize: Typography.size.sm, color: C.textSecondary, alignSelf: 'flex-start', marginBottom: Spacing[4] },

  // Signals
  signalList: { width: '100%', gap: Spacing[3] },
  signalRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  signalLabel: { width: 155, fontSize: Typography.size.xs, color: C.textSecondary },
  signalTrack: {
    flex: 1, height: 6, backgroundColor: C.backgroundCard,
    borderRadius: Radius.full, overflow: 'hidden',
  },
  signalFill: { height: '100%', borderRadius: Radius.full },
  signalWeight: { width: 30, fontSize: Typography.size.xs, color: C.textMuted, textAlign: 'right' },

  // Simulator
  simGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], width: '100%' },
  simBtn: {
    flex: 1, minWidth: '46%',
    backgroundColor: C.brandLight,
    borderRadius: Radius.lg,
    padding: Spacing[3],
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: Palette.gold[200],
  },
  simBtnNeg: { backgroundColor: C.error + '10', borderColor: C.error + '40' },
  simBtnIcon: { fontSize: 22 },
  simBtnLabel: { fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold, color: C.brandDark, textAlign: 'center' },
  simBtnLabelNeg: { color: C.error },
  simBtnDelta: { fontSize: Typography.size.xs, fontWeight: Typography.weight.bold, color: C.brand },

  // Explanation
  explainCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.backgroundElevated,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    gap: Spacing[3],
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: C.border,
    width: '100%',
  },
  explainIcon: { width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  explainText: { flex: 1, fontSize: Typography.size.sm, color: C.textSecondary, lineHeight: 18 },

  // Sparkline
  sparkContainer: { width: '100%' },
  sparkTitle: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: C.textSecondary, marginBottom: Spacing[3] },
  sparkBars: { flexDirection: 'row', alignItems: 'flex-end', height: 56, gap: 5 },
  sparkBarWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  sparkBar: { width: '100%', borderRadius: Radius.xs },
  sparkVal: { fontSize: Typography.size.xs, color: Palette.gold[600], marginTop: 3, fontWeight: Typography.weight.bold },

  // Timeline
  timelineContainer: { width: '100%' },
  timelineList: { marginTop: Spacing[4], gap: 0 },
  timelineItem: { flexDirection: 'row', gap: Spacing[4] },
  timelineLeft: { width: 12, alignItems: 'center' },
  timelineRight: { flex: 1, paddingBottom: Spacing[6] },
  timelineDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: Palette.gold[200],
    zIndex: 2,
  },
  activeDot: {
    backgroundColor: Palette.gold[500],
    borderWidth: 2,
    borderColor: Palette.white.pure,
    ...Shadows.sm,
  },
  timelineLine: {
    position: 'absolute',
    top: 12, bottom: -Spacing[6] + 12,
    width: 2, backgroundColor: Palette.gold[100],
  },
  timelineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  timelineEvent: { fontSize: Typography.size.sm, fontWeight: 'bold', color: C.textPrimary },
  timelineDate: { fontSize: 10, color: C.textMuted },
  timelineDelta: { fontSize: Typography.size.xs, color: Palette.gold[600], fontWeight: '600' },

  // Band reference
  bandRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    paddingVertical: Spacing[2], paddingHorizontal: Spacing[2],
    borderRadius: Radius.md, width: '100%',
  },
  bandDot: { width: 10, height: 10, borderRadius: Radius.full },
  bandRowLabel: { fontSize: Typography.size.sm, color: C.textPrimary },
  bandRowRange: { fontSize: Typography.size.xs, color: C.textMuted },
  hereBadge: { fontSize: Typography.size.xs, fontWeight: Typography.weight.bold },
});

/**
 * KAIRO — EconomicHeatmap
 * ─────────────────────────────────────────────
 * Frontend B — Economic heatmap / Mapbox integration (demo layer)
 *
 * Architecture note:
 *  This component renders a geo-approximate Nigeria state grid with
 *  Kairo economic activity data. It is designed to be swapped for a
 *  real @rnmapbox/maps or mapbox-gl layer in production once the app
 *  moves to a bare/dev-client workflow. The data contract (GRID_CELLS,
 *  SectorKey, time filters) is already production-shaped.
 *
 * Features:
 *  - Nigeria 37-state geographic grid (geo-approximate layout)
 *  - Heat color scale: activity 0–100 → dark amber → bright gold
 *  - Animated pulse on top-3 hotspots
 *  - Sector filter: All / Trade / Transport / Services / Construction
 *  - Time period: Today / 7 Days / 30 Days / 3 Months
 *  - Tap state → detail panel with sector breakdown
 *  - Summary stats strip: total activity, top region, avg growth
 *  - Legend bar
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Palette, Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';

import { useHeatmap, SectorKey, TimeKey, StateCell } from '@/hooks/use-heatmap';

const C = Colors.light;
const SCREEN_W = Dimensions.get('window').width;

// ─── Heat color from activity 0–100 ──────────────────────────────────────────
function heatColor(activity: number): string {
  if (activity >= 85) return Palette.gold[400];    // vivid gold
  if (activity >= 70) return Palette.gold[500];    // rich gold
  if (activity >= 55) return Palette.gold[600];    // dark gold
  if (activity >= 40) return Palette.gold[700];    // deep gold
  if (activity >= 25) return Palette.gold[800];    // dark amber
  return '#2a1c00';                                 // near-black
}

function heatOpacity(activity: number): number {
  return 0.25 + (activity / 100) * 0.75;
}

// ─── Grid cell layout ─────────────────────────────────────────────────────────
const COLS = 9;
const ROWS = 8;
const MAP_PADDING = Spacing[4];
const CELL_GAP = 3;
const CELL_SIZE = Math.floor((SCREEN_W - MAP_PADDING * 2 - CELL_GAP * (COLS - 1)) / COLS);

// ─── Animated hotspot pulse ───────────────────────────────────────────────────
function HotspotPulse({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1.5, duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0,   duration: 900, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: CELL_SIZE, height: CELL_SIZE,
        borderRadius: Radius.xs,
        backgroundColor: color,
        transform: [{ scale }],
        opacity,
      }}
    />
  );
}

// ─── Single cell ──────────────────────────────────────────────────────────────
interface CellProps {
  cell: StateCell;
  activity: number;
  isHot: boolean;
  isSelected: boolean;
  onPress: (cell: StateCell) => void;
}

function Cell({ cell, activity, isHot, isSelected, onPress }: CellProps) {
  const bg = heatColor(activity);
  const op = heatOpacity(activity);

  return (
    <Pressable
      onPress={() => onPress(cell)}
      style={[
        styles.cell,
        { backgroundColor: bg, opacity: op },
        isSelected && styles.cellSelected,
      ]}
      accessibilityLabel={`${cell.label} — activity ${Math.round(activity)}`}
    >
      {isHot && <HotspotPulse color={bg} />}
      {(CELL_SIZE > 28 || isSelected) && (
        <Text style={styles.cellLabel} numberOfLines={1}>
          {cell.label.split(' ')[0]}
        </Text>
      )}
    </Pressable>
  );
}

// ─── Sector filter chips ──────────────────────────────────────────────────────
const SECTORS: { key: SectorKey; label: string; icon: string }[] = [
  { key: 'all',          label: 'All',          icon: '🌍' },
  { key: 'trade',        label: 'Trade',        icon: '🛒' },
  { key: 'transport',    label: 'Transport',    icon: '🚛' },
  { key: 'services',     label: 'Services',     icon: '⚙️' },
  { key: 'construction', label: 'Construction', icon: '🏗' },
];

const TIME_FILTERS: { key: TimeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d',    label: '7 Days' },
  { key: '30d',   label: '30 Days' },
  { key: '3m',    label: '3 Months' },
];

const TIME_MULT: Record<TimeKey, number> = { today: 0.75, '7d': 0.88, '30d': 1.0, '3m': 1.12 };

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EconomicHeatmap() {
  const { sector, setSector, period, setPeriod, activities, hotIds, gridCells } = useHeatmap();
  const [selected, setSelected] = useState<StateCell | null>(null);

  // Build a lookup: `${row}-${col}` → StateCell
  const cellMap = useMemo(() => {
    const out: Record<string, StateCell> = {};
    gridCells.forEach((c) => { out[`${c.row}-${c.col}`] = c; });
    return out;
  }, [gridCells]);

  // Summary stats
  const totalActivity = useMemo(() =>
    Math.round(gridCells.reduce((s, c) => s + (activities[c.id] ?? 0), 0) / gridCells.length),
    [activities, gridCells]
  );
  const topRegion = useMemo(() =>
    gridCells.find((c) => c.id === hotIds[0])?.label ?? '—',
    [hotIds, gridCells]
  );

  const handleCellPress = useCallback((cell: StateCell) => {
    setSelected((prev) => prev?.id === cell.id ? null : cell);
  }, []);

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>

      {/* ── Sector filter ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sectorScroll} contentContainerStyle={styles.sectorRow}>
        {SECTORS.map((s) => (
          <Pressable
            key={s.key}
            onPress={() => setSector(s.key)}
            style={[styles.chip, sector === s.key && styles.chipActive]}
          >
            <Text style={styles.chipIcon}>{s.icon}</Text>
            <Text style={[styles.chipText, sector === s.key && styles.chipTextActive]}>{s.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ── Time filter ── */}
      <View style={styles.timeRow}>
        {TIME_FILTERS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setPeriod(t.key)}
            style={[styles.timeBtn, period === t.key && styles.timeBtnActive]}
          >
            <Text style={[styles.timeBtnText, period === t.key && styles.timeBtnTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── Map grid ── */}
      <View style={styles.mapContainer}>
        {/* Map label */}
        <Text style={styles.mapLabel}>Nigeria — Economic Activity</Text>

        {/* Grid */}
        <View style={styles.grid}>
          {Array.from({ length: ROWS }).map((_, row) => (
            <View key={row} style={styles.gridRow}>
              {Array.from({ length: COLS }).map((_, col) => {
                const cell = cellMap[`${row}-${col}`];
                if (!cell) {
                  return <View key={col} style={styles.cellEmpty} />;
                }
                const activity = activities[cell.id] ?? 0;
                return (
                  <Cell
                    key={col}
                    cell={cell}
                    activity={activity}
                    isHot={hotIds.includes(cell.id)}
                    isSelected={selected?.id === cell.id}
                    onPress={handleCellPress}
                  />
                );
              })}
            </View>
          ))}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendLabel}>Low</Text>
          <View style={styles.legendBar}>
            {[0, 20, 40, 60, 80, 100].map((v) => (
              <View key={v} style={[styles.legendSeg, { backgroundColor: heatColor(v) }]} />
            ))}
          </View>
          <Text style={styles.legendLabel}>High</Text>
        </View>
      </View>

      {/* ── Selected state detail ── */}
      {selected && (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View>
              <Text style={styles.detailState}>{selected.label}</Text>
              <Text style={styles.detailSub}>Economic activity breakdown</Text>
            </View>
            <View style={[styles.detailScore, { backgroundColor: heatColor(activities[selected.id] ?? 0) + '33' }]}>
              <Text style={[styles.detailScoreNum, { color: heatColor(activities[selected.id] ?? 0) }]}>
                {activities[selected.id]}
              </Text>
              <Text style={styles.detailScoreLabel}>/100</Text>
            </View>
          </View>

          {/* Sector bars */}
          <View style={styles.sectorBars}>
            {SECTORS.filter((s) => s.key !== 'all').map((s) => {
              const val = Math.min(100, Math.round(selected.base[s.key] * TIME_MULT[period]));
              return (
                <View key={s.key} style={styles.sectorBarRow}>
                  <Text style={styles.sectorBarLabel}>{s.icon} {s.label}</Text>
                  <View style={styles.sectorBarTrack}>
                    <View style={[styles.sectorBarFill, { width: `${val}%`, backgroundColor: heatColor(val) }]} />
                  </View>
                  <Text style={styles.sectorBarVal}>{val}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* ── Summary stats ── */}
      <View style={styles.statsRow}>
        {[
          { label: 'Avg Activity',  value: `${totalActivity}`,       sub: 'across all states' },
          { label: 'Top Region',    value: topRegion,                  sub: `${activities[hotIds[0]]} activity index` },
          { label: 'Active States', value: `${gridCells.filter((c) => (activities[c.id] ?? 0) > 50).length}`, sub: 'above 50 index' },
        ].map(({ label, value, sub }) => (
          <View key={label} style={styles.statCard}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statSub}>{sub}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: Spacing[12] }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },

  // Filters
  sectorScroll: { flexGrow: 0, marginTop: Spacing[3] },
  sectorRow: { paddingHorizontal: Spacing[4], gap: Spacing[2] },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    backgroundColor: C.backgroundCard,
    borderWidth: 1, borderColor: C.border,
  },
  chipActive: { backgroundColor: C.brandLight, borderColor: Palette.gold[400] },
  chipIcon: { fontSize: 13 },
  chipText: { fontSize: Typography.size.xs, fontWeight: Typography.weight.medium, color: C.textSecondary },
  chipTextActive: { color: C.brandDark, fontWeight: Typography.weight.bold },

  timeRow: {
    flexDirection: 'row', marginHorizontal: Spacing[4], marginTop: Spacing[3],
    backgroundColor: C.backgroundCard,
    borderRadius: Radius.lg, padding: 3,
    borderWidth: 1, borderColor: C.border,
  },
  timeBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing[2], borderRadius: Radius.md },
  timeBtnActive: { backgroundColor: C.backgroundElevated, ...Shadows.sm },
  timeBtnText: { fontSize: Typography.size.xs, color: C.textMuted, fontWeight: Typography.weight.medium },
  timeBtnTextActive: { color: C.textPrimary, fontWeight: Typography.weight.bold },

  // Map
  mapContainer: {
    backgroundColor: '#0d0d0d',
    marginHorizontal: Spacing[4],
    marginTop: Spacing[4],
    borderRadius: Radius.xl,
    padding: MAP_PADDING,
    ...Shadows.lg,
  },
  mapLabel: {
    fontSize: Typography.size.xs,
    color: Palette.dark[300],
    fontWeight: Typography.weight.semibold,
    letterSpacing: 1,
    marginBottom: Spacing[3],
    textTransform: 'uppercase',
  },
  grid: { gap: CELL_GAP },
  gridRow: { flexDirection: 'row', gap: CELL_GAP },
  cell: {
    width: CELL_SIZE, height: CELL_SIZE,
    borderRadius: Radius.xs,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'visible',
  },
  cellEmpty: { width: CELL_SIZE, height: CELL_SIZE },
  cellSelected: { borderWidth: 2, borderColor: Palette.white.pure, opacity: 1 },
  cellLabel: {
    fontSize: 7, color: Palette.white.pure,
    fontWeight: Typography.weight.bold,
    textAlign: 'center',
  },

  // Legend
  legend: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    marginTop: Spacing[3],
  },
  legendBar: { flex: 1, flexDirection: 'row', height: 6, borderRadius: Radius.full, overflow: 'hidden' },
  legendSeg: { flex: 1 },
  legendLabel: { fontSize: Typography.size.xs, color: Palette.dark[400] },

  // Detail card
  detailCard: {
    backgroundColor: C.backgroundElevated,
    borderRadius: Radius.xl,
    marginHorizontal: Spacing[4],
    marginTop: Spacing[4],
    padding: Spacing[4],
    ...Shadows.md,
    borderWidth: 1, borderColor: C.border,
  },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing[4] },
  detailState: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: C.textPrimary,
  },
  detailSub: { fontSize: Typography.size.xs, color: C.textSecondary, marginTop: 2 },
  detailScore: { borderRadius: Radius.lg, paddingHorizontal: Spacing[3], paddingVertical: Spacing[2], alignItems: 'center' },
  detailScoreNum: { fontSize: Typography.size.xl, fontWeight: Typography.weight.extrabold, lineHeight: 28 },
  detailScoreLabel: { fontSize: Typography.size.xs, color: C.textMuted },

  sectorBars: { gap: Spacing[3] },
  sectorBarRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  sectorBarLabel: { width: 105, fontSize: Typography.size.xs, color: C.textSecondary },
  sectorBarTrack: { flex: 1, height: 6, backgroundColor: C.backgroundCard, borderRadius: Radius.full, overflow: 'hidden' },
  sectorBarFill: { height: '100%', borderRadius: Radius.full },
  sectorBarVal: { width: 24, fontSize: Typography.size.xs, color: C.textMuted, textAlign: 'right' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing[4],
    marginTop: Spacing[4],
    gap: Spacing[3],
  },
  statCard: {
    flex: 1,
    backgroundColor: C.backgroundElevated,
    borderRadius: Radius.lg,
    padding: Spacing[3],
    alignItems: 'center',
    ...Shadows.sm,
    borderWidth: 1, borderColor: C.border,
  },
  statValue: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: C.brand,
  },
  statLabel: { fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold, color: C.textPrimary, marginTop: 2 },
  statSub: { fontSize: 9, color: C.textMuted, textAlign: 'center', marginTop: 2 },
});

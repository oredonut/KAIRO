/**
 * KAIRO — Economic Heatmap Screen
 * Frontend B — Economic heatmap / Mapbox integration
 */
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EconomicHeatmap from '@/components/EconomicHeatmap';
import { Colors, Palette, Spacing, Typography, Radius } from '@/constants/theme';

const C = Colors.light;

export default function HeatmapScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>ECONOMIC INTELLIGENCE</Text>
          </View>
          <Text style={styles.heading}>Activity Heatmap</Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>🇳🇬 Nigeria</Text>
        </View>
      </View>
      <EconomicHeatmap />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[1],
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.status.infoBlue + '18',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Palette.status.infoBlue + '44',
    marginBottom: Spacing[1],
  },
  pillText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Palette.status.infoBlue,
    letterSpacing: 1.2,
  },
  heading: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: C.textPrimary,
    letterSpacing: -0.5,
  },
  tag: {
    backgroundColor: C.backgroundCard,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderWidth: 1,
    borderColor: C.border,
  },
  tagText: { fontSize: Typography.size.xs, fontWeight: Typography.weight.medium, color: C.textSecondary },
});

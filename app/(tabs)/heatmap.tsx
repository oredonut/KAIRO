/**
 * KAIRO — Economic Heatmap Screen
 * Frontend B — Economic heatmap / Mapbox integration
 */
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EconomicHeatmap from '@/components/EconomicHeatmap';
import { Colors, Palette, Spacing, Typography, Radius, Shadows } from '@/constants/theme';

const C = Colors.light;

export default function HeatmapScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
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
        <Text style={styles.subheading}>Live local market velocity & volume</Text>
      </View>
      <View style={styles.mapWrapper}>
        <EconomicHeatmap />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  headerContainer: {
    backgroundColor: Palette.dark[900],
    paddingTop: Spacing[6],
    paddingBottom: Spacing[14], // Extra padding for overlap
    paddingHorizontal: Spacing[5],
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    marginBottom: Spacing[4],
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing[3],
  },
  pill: {
    alignSelf: 'flex-start',
    marginBottom: Spacing[2],
  },
  pillText: {
    fontSize: Typography.size.sm,
    fontWeight: '900',
    color: Palette.gold[400],
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  heading: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: Palette.white.pure,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: Typography.size.sm,
    color: Palette.dark[200],
    lineHeight: 20,
  },
  tag: {
    backgroundColor: Palette.dark[800],
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderWidth: 1,
    borderColor: Palette.dark[600],
  },
  tagText: { fontSize: Typography.size.xs, fontWeight: Typography.weight.medium, color: Palette.dark[100] },
  mapWrapper: {
    flex: 1,
    marginTop: -40, // overlap
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    overflow: 'hidden',
    zIndex: 10,
    marginHorizontal: Spacing[4],
    backgroundColor: C.backgroundCard,
    ...Shadows.lg,
  },
});

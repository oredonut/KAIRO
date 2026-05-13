/**
 * KAIRO — Trust Score Screen
 * Frontend B — Trust score dashboard + live simulation
 */
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TrustScoreDashboard from '@/components/TrustScoreDashboard';
import { Colors, Palette, Spacing, Typography, Radius } from '@/constants/theme';

const C = Colors.light;

export default function TrustScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Page header */}
      <View style={styles.header}>
        <View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>TRUST SCORE</Text>
          </View>
          <Text style={styles.heading}>Economic Identity</Text>
        </View>
        <View style={styles.liveTag}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </View>

      <TrustScoreDashboard />
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
    paddingBottom: Spacing[2],
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.status.trustPurple + '18',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Palette.status.trustPurple + '44',
    marginBottom: Spacing[1],
  },
  pillText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Palette.status.trustPurple,
    letterSpacing: 1.2,
  },
  heading: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: C.textPrimary,
    letterSpacing: -0.5,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.light.success + '18',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.light.success + '44',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.success,
  },
  liveText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.light.success,
  },
});

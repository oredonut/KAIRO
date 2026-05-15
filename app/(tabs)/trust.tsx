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
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
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
        <Text style={styles.subheading}>Your AI-verified reliability rating</Text>
      </View>

      <View style={styles.dashboardWrapper}>
        <TrustScoreDashboard />
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
  dashboardWrapper: {
    flex: 1,
    marginTop: -40, // overlap
    zIndex: 10,
  },
});

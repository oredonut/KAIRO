/**
 * KAIRO — Wallet Screen
 * Frontend B — Squad wallet screen + transaction list
 */
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SquadWallet from '@/components/SquadWallet';
import { Colors, Palette, Spacing, Typography, Radius } from '@/constants/theme';

const C = Colors.light;

export default function WalletScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>SQUAD WALLET</Text>
          </View>
          <Text style={styles.heading}>My Wallet</Text>
        </View>
        <View style={styles.notifBtn}>
          <Text style={styles.notifIcon}>🔔</Text>
          <View style={styles.notifBadge} />
        </View>
      </View>
      <SquadWallet />
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
    backgroundColor: Palette.gold[100],
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Palette.gold[300],
    marginBottom: Spacing[1],
  },
  pillText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Palette.gold[700],
    letterSpacing: 1.2,
  },
  heading: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: C.textPrimary,
    letterSpacing: -0.5,
  },
  notifBtn: { position: 'relative' },
  notifIcon: { fontSize: 24 },
  notifBadge: {
    position: 'absolute',
    top: 0, right: 0,
    width: 8, height: 8,
    borderRadius: Radius.full,
    backgroundColor: C.error,
    borderWidth: 1.5, borderColor: C.background,
  },
});

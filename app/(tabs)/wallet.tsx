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
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
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
        <Text style={styles.subheading}>Manage your earnings & savings goals</Text>
      </View>
      <View style={styles.walletWrapper}>
        <SquadWallet />
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
  notifBtn: { position: 'relative' },
  notifIcon: { fontSize: 24 },
  notifBadge: {
    position: 'absolute',
    top: 0, right: 0,
    width: 8, height: 8,
    borderRadius: Radius.full,
    backgroundColor: C.error,
    borderWidth: 1.5, borderColor: Palette.dark[900],
  },
  walletWrapper: {
    flex: 1,
    marginTop: -40, // overlap
    zIndex: 10,
  },
});

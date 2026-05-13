/**
 * KAIRO — Voice Introduction Screen
 * Preview screen for the VoiceRecorderCard component (Frontend B)
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import VoiceRecorderCard from '@/components/VoiceRecorderCard';
import { Colors, Palette, Spacing, Typography, Radius } from '@/constants/theme';

const C = Colors.light;

export default function VoiceScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page header ── */}
        <View style={styles.header}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>PROFILE</Text>
          </View>
          <Text style={styles.heading}>Your Economic Identity</Text>
          <Text style={styles.subheading}>
            A voice intro helps employers know the real you — before you even meet.
          </Text>
        </View>

        {/* ── Card ── */}
        <VoiceRecorderCard
          onSave={(uri) => console.log('[Kairo] Voice saved at:', uri)}
          onDelete={() => console.log('[Kairo] Voice deleted')}
        />

        {/* ── Info strip ── */}
        <View style={styles.infoStrip}>
          {[
            { icon: '🔒', text: 'Encrypted & stored securely' },
            { icon: '👁', text: 'Only verified employers see this' },
            { icon: '🗑', text: 'Delete anytime from settings' },
          ].map(({ icon, text }) => (
            <View key={text} style={styles.infoItem}>
              <Text style={styles.infoIcon}>{icon}</Text>
              <Text style={styles.infoText}>{text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  scroll: {
    paddingTop: Spacing[4],
    paddingBottom: Spacing[12],
    gap: Spacing[6],
  },
  header: {
    paddingHorizontal: Spacing[5],
    gap: Spacing[2],
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: C.brandLight,
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
    color: C.brandDark,
    letterSpacing: 1.2,
  },
  heading: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: C.textPrimary,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: Typography.size.base,
    color: C.textSecondary,
    lineHeight: 22,
  },
  infoStrip: {
    marginHorizontal: Spacing[4],
    backgroundColor: C.backgroundCard,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    gap: Spacing[3],
    borderWidth: 1,
    borderColor: C.border,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  infoIcon: { fontSize: 16 },
  infoText: {
    fontSize: Typography.size.sm,
    color: C.textSecondary,
  },
});

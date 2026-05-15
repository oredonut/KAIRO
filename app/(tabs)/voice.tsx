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
        {/* ── Premium Dark Header ── */}
        <View style={styles.headerContainer}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>PROFILE</Text>
          </View>
          <Text style={styles.heading}>Your Economic Identity</Text>
          <Text style={styles.subheading}>
            A voice intro helps employers know the real you — before you even meet.
          </Text>
        </View>

        {/* ── Card (Overlapping the header) ── */}
        <View style={styles.cardWrapper}>
          <VoiceRecorderCard
            onSave={(uri) => console.log('[Kairo] Voice saved at:', uri)}
            onDelete={() => console.log('[Kairo] Voice deleted')}
          />
        </View>

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
    paddingBottom: Spacing[12],
    gap: Spacing[6],
  },
  headerContainer: {
    backgroundColor: Palette.dark[900],
    paddingTop: Spacing[6],
    paddingBottom: Spacing[14], // Extra padding for overlap
    paddingHorizontal: Spacing[5],
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
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
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.bold,
    color: Palette.white.pure,
    letterSpacing: -0.5,
    marginBottom: Spacing[2],
  },
  subheading: {
    fontSize: Typography.size.md,
    color: Palette.dark[200],
    lineHeight: 24,
  },
  cardWrapper: {
    marginTop: -40, // Negative margin to overlap the dark header
    zIndex: 10,
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

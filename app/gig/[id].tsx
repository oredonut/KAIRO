import React, { useState, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Pressable, 
  Platform, 
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { useOpportunities } from '@/hooks/use-opportunities';
import { useTrustScore } from '@/hooks/use-trust-score';

const C = Colors.light;

export default function GigDetailScreen() {
  const { id } = useLocalSearchParams();
  const { opportunities, loading: opLoading } = useOpportunities();
  const { score: userScore } = useTrustScore();
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const gig = useMemo(() => {
    return opportunities.find(op => op.id === id);
  }, [opportunities, id]);

  const isQualified = gig ? userScore >= gig.trustScoreRequired : false;

  const handleApply = () => {
    if (!isQualified) return;
    setApplying(true);
    // Simulate application processing
    setTimeout(() => {
      setApplying(false);
      setApplied(true);
    }, 2000);
  };

  if (opLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Palette.gold[500]} size="large" />
      </View>
    );
  }

  if (!gig) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Gig not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Gig Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Job Hero */}
        <View style={styles.hero}>
          <View style={styles.iconBox}>
            <Text style={styles.heroIconText}>{gig.icon}</Text>
          </View>
          <Text style={styles.heroTitle}>{gig.title}</Text>
          <Text style={styles.heroCompany}>{gig.company}</Text>
          
          <View style={styles.payBadge}>
            <Text style={styles.payText}>{gig.pay}</Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Location</Text>
            <Text style={styles.statValue}>{gig.location}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Category</Text>
            <Text style={styles.statValue}>{gig.category}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Posted</Text>
            <Text style={styles.statValue}>{new Date(gig.postedAt).toLocaleDateString()}</Text>
          </View>
        </View>

        {/* Trust Score Requirement */}
        <View style={[styles.trustBox, { borderColor: isQualified ? '#e6f4ea' : '#fce8e6' }]}>
          <View style={styles.trustHeader}>
            <Text style={styles.trustTitle}>Trust Requirement</Text>
            <View style={[styles.trustPill, { backgroundColor: isQualified ? '#e6f4ea' : '#fce8e6' }]}>
              <Text style={[styles.trustLabel, { color: isQualified ? '#1e8e3e' : '#d93025' }]}>
                {gig.trustScoreRequired} Required
              </Text>
            </View>
          </View>
          
          <Text style={styles.trustDesc}>
            {isQualified 
              ? "You are fully qualified for this role! Your Kairo ID and Trust Score will be shared with the employer."
              : `Your current Trust Score is ${userScore}. You need ${gig.trustScoreRequired - userScore} more points to unlock this role.`}
          </Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Role Description</Text>
          <Text style={styles.sectionBody}>{gig.description}</Text>
        </View>

        {/* Tags */}
        <View style={styles.tagWrapper}>
          {gig.tags.map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.footer}>
        {applied ? (
          <View style={styles.successBox}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successText}>Application Sent!</Text>
          </View>
        ) : (
          <Pressable 
            onPress={handleApply}
            disabled={!isQualified || applying}
            style={({ pressed }) => [
              styles.applyBtn,
              (!isQualified || applying) && { backgroundColor: C.border },
              pressed && isQualified && { transform: [{ scale: 0.98 }] }
            ]}
          >
            {applying ? (
              <ActivityIndicator color={C.textOnDark} />
            ) : (
              <Text style={[styles.applyBtnText, !isQualified && { color: C.textMuted }]}>
                {isQualified ? 'Apply with Kairo ID' : 'Score Too Low'}
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.background },
  errorText: { fontSize: Typography.size.md, color: C.textSecondary, marginBottom: Spacing[4] },
  backLink: { color: C.brand, fontWeight: 'bold' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 20, color: C.textPrimary },
  headerTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: C.textPrimary,
  },

  content: { padding: Spacing[5] },
  
  hero: {
    alignItems: 'center',
    paddingVertical: Spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginBottom: Spacing[6],
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: Radius.xl,
    backgroundColor: C.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[4],
    borderWidth: 1,
    borderColor: C.border,
  },
  heroIconText: { fontSize: 40 },
  heroTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: C.textPrimary,
    textAlign: 'center',
  },
  heroCompany: {
    fontSize: Typography.size.base,
    color: C.brand,
    fontWeight: Typography.weight.semibold,
    marginTop: 4,
  },
  payBadge: {
    backgroundColor: Palette.gold[50],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    marginTop: Spacing[4],
    borderWidth: 1,
    borderColor: Palette.gold[200],
  },
  payText: {
    color: Palette.gold[900],
    fontWeight: Typography.weight.bold,
    fontSize: Typography.size.sm,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing[8],
  },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: {
    fontSize: 10,
    color: C.textMuted,
    fontWeight: Typography.weight.bold,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: Typography.size.xs,
    color: C.textPrimary,
    fontWeight: Typography.weight.semibold,
  },

  trustBox: {
    padding: Spacing[4],
    borderRadius: Radius.xl,
    backgroundColor: C.backgroundCard,
    borderWidth: 1,
    marginBottom: Spacing[8],
  },
  trustHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  trustTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: C.textPrimary,
  },
  trustPill: {
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  trustLabel: {
    fontSize: 10,
    fontWeight: Typography.weight.bold,
  },
  trustDesc: {
    fontSize: Typography.size.xs,
    color: C.textSecondary,
    lineHeight: 20,
  },

  section: { marginBottom: Spacing[8] },
  sectionTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: C.textPrimary,
    marginBottom: Spacing[3],
  },
  sectionBody: {
    fontSize: Typography.size.sm,
    color: C.textSecondary,
    lineHeight: 24,
  },

  tagWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: C.backgroundCard,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: C.border,
  },
  tagText: {
    fontSize: Typography.size.xs,
    color: C.textMuted,
    fontWeight: Typography.weight.semibold,
  },

  footer: {
    padding: Spacing[5],
    paddingTop: Spacing[3],
    backgroundColor: C.background,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  applyBtn: {
    backgroundColor: Palette.dark[900],
    height: 56,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  applyBtnText: {
    color: Palette.white.pure,
    fontSize: Typography.size.base,
    fontWeight: '900',
    letterSpacing: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    backgroundColor: '#e6f4ea',
    borderRadius: Radius.full,
    gap: 10,
  },
  successIcon: { fontSize: 20 },
  successText: {
    color: '#1e8e3e',
    fontSize: Typography.size.base,
    fontWeight: 'bold',
  },
});

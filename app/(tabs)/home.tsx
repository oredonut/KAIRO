import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Pressable, 
  Platform,
  Dimensions 
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Palette, Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useTrustScore } from '@/hooks/use-trust-score';
import { useWallet } from '@/hooks/use-wallet';
import { useTranslation } from '@/hooks/use-translation';
import { useNotifications } from '@/hooks/use-notifications';
import { useInsights } from '@/hooks/use-insights';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';

const C = Colors.light;

// ─── Components ───────────────────────────────────────────────────────────────

function QuickAction({ icon, label, onPress, disabled = false }: { icon: string; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable 
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionBtn, 
        pressed && !disabled && { transform: [{ scale: 0.95 }] },
        disabled && { opacity: 0.5 }
      ]}
    >
      <View style={styles.actionIconBox}>
        <Text style={styles.actionIcon}>{icon}</Text>
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
      {disabled && (
        <View style={styles.soonBadge}>
          <Text style={styles.soonText}>SOON</Text>
        </View>
      )}
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { fullName, profileImage, bvnVerified } = useOnboardingStore();
  const { score, band } = useTrustScore();
  const { balance } = useWallet();
  const { pulse, advice, jobMatches, loading: insightsLoading } = useInsights();

  const { t, language, toggleLanguage } = useTranslation();
  const { unreadCount } = useNotifications();
  const firstName = fullName.split(' ')[0] || 'Kairo User';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t('greeting')}</Text>
            <Text style={styles.userName}>{firstName} ✨</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing[3], alignItems: 'center' }}>
            <Pressable 
              onPress={() => router.push('/notifications')}
              style={styles.langBtn}
            >
              <Text style={styles.langText}>🔔</Text>
              {unreadCount > 0 && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </Pressable>
            <Pressable 
              onPress={toggleLanguage}
              style={styles.langBtn}
            >
              <Text style={styles.langText}>{language === 'en' ? '🇳🇬' : '🇬🇧'}</Text>
            </Pressable>
            <Pressable 
              onPress={() => router.push('/profile/edit')}
              style={styles.profileBtn}
            >
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.headerProfilePic} />
              ) : (
                <Text style={styles.profileIcon}>👤</Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* Main Trust Card */}
        <Pressable 
          onPress={() => router.push('/(tabs)/trust')}
          style={styles.trustCard}
        >
          <View style={styles.trustCardHeader}>
            <Text style={styles.trustCardTitle}>{t('trust_card_title')}</Text>
            <View style={styles.bandPill}>
              <Text style={styles.bandText}>{band}</Text>
            </View>
          </View>
          
          <View style={styles.scoreRow}>
            <View>
              <Text style={styles.scoreValue}>{score}</Text>
              <Text style={styles.scoreLabel}>{t('trust_points')}</Text>
            </View>
            <View style={styles.divider} />
            <View>
              <Text style={styles.scoreValue}>₦{(balance?.balance ?? 0).toLocaleString()}</Text>
              <Text style={styles.scoreLabel}>{t('wallet_balance')}</Text>
            </View>
          </View>

          <View style={styles.progressBg}>
            <View style={[styles.progressBar, { width: `${(score / 1000) * 100}%` }]} />
          </View>
          
          <Text style={styles.trustSub}>
            You're in the top <Text style={{ fontWeight: 'bold', color: Palette.gold[500] }}>15%</Text> of informal earners in your area.
          </Text>
        </Pressable>

        {/* AI Consultant Hero */}
        <Animated.View 
          entering={FadeInUp.delay(100)}
          style={styles.consultantHero}
        >
          <View style={styles.consultantRow}>
            <View style={styles.consultantTextCol}>
              <View style={styles.aiBadgeSmall}>
                <Text style={styles.aiBadgeTextSmall}>AI CONSULTANT</Text>
              </View>
              <Text style={styles.consultantTitle}>
                I've found {jobMatches.length} jobs that fit your profile.
              </Text>
              <Pressable 
                onPress={() => router.push('/consultant' as any)}
                style={styles.consultantLink}
              >
                <Text style={styles.consultantLinkText}>VIEW SMART MATCHES →</Text>
              </Pressable>
            </View>
            <View style={styles.consultantIconBox}>
              <Text style={styles.consultantIcon}>🤖</Text>
            </View>
          </View>
        </Animated.View>

        {/* Loan Offer Unlock (Demo Hero) */}
        {score >= 550 && (
          <Animated.View 
            entering={ZoomIn.duration(800)}
            style={styles.loanOfferCard}
          >
            <View style={styles.loanOfferHeader}>
              <View style={styles.loanLockIcon}>
                <Text style={{ fontSize: 24 }}>🔓</Text>
              </View>
              <View style={styles.loanTag}>
                <Text style={styles.loanTagText}>UNLOCKED</Text>
              </View>
            </View>
            
            <Text style={styles.loanTitle}>Congrats! You're Eligible</Text>
            <Text style={styles.loanBody}>
              Based on your <Text style={{ fontWeight: 'bold' }}>{score}</Text> Trust Score, you can now access up to <Text style={{ fontWeight: 'bold' }}>₦50,000</Text> in micro-loans.
            </Text>

            <Pressable 
              onPress={() => alert("Redirecting to Loan Partner...")}
              style={({ pressed }) => [styles.loanBtn, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.loanBtnText}>CLAIM OFFER — 2% INT.</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Market Insights */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('market_pulse')}</Text>
          <Pressable onPress={() => router.push('/(tabs)/heatmap')}>
            <Text style={styles.sectionLink}>View Map</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.insightScroll} contentContainerStyle={styles.insightContent}>
          {pulse.map((item) => (
            <View key={item.id} style={[styles.insightCardSmall, { backgroundColor: item.color, borderColor: item.borderColor }]}>
              <Text style={styles.insightIcon}>{item.icon}</Text>
              <Text style={styles.insightText}>{item.description}</Text>
            </View>
          ))}
        </ScrollView>

        {advice && (
          <Animated.View 
            entering={FadeInUp.delay(200)}
            style={styles.insightCard}
          >
            <View style={styles.insightHeader}>
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>AI COACH</Text>
              </View>
              <Text style={styles.insightTitle}>{advice.title}</Text>
            </View>
            
            <Text style={styles.insightBody}>
              {advice.body}
            </Text>

            <Pressable 
              onPress={() => router.push(advice.actionRoute as any)}
              style={styles.insightBtn}
            >
              <Text style={styles.insightBtnText}>{advice.actionLabel} →</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing[6], marginBottom: Spacing[4], paddingHorizontal: Spacing[5] }]}>
          {t('quick_actions')}
        </Text>
        <View style={styles.actionsGrid}>
          <QuickAction 
            icon="💼" 
            label={t('find_gigs')} 
            onPress={() => router.push('/(tabs)/explore')} 
          />
          <QuickAction 
            icon="💸" 
            label={t('send_money')} 
            onPress={() => router.push('/(tabs)/wallet')} 
          />
          <QuickAction 
            icon="📊" 
            label={t('my_insights')} 
            onPress={() => router.push('/(tabs)/trust')} 
          />
          <QuickAction 
            icon="🏦" 
            label={t('micro_loan')} 
            onPress={() => {}} 
            disabled 
          />
        </View>

        {/* Promotion / Tip */}
        <View style={styles.promoBox}>
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTitle}>{t('boost_trust')}</Text>
            <Text style={styles.promoDesc}>{t('boost_desc')}</Text>
            <Pressable 
              onPress={() => router.push('/portfolio')}
              style={styles.promoBtn}
            >
              <Text style={styles.promoBtnText}>{t('link_portfolio')}</Text>
            </Pressable>
          </View>
          <Text style={styles.promoIcon}>📂</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  content: { paddingTop: Spacing[4] },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    marginBottom: Spacing[6],
  },
  greeting: {
    fontSize: Typography.size.sm,
    color: C.textSecondary,
    fontWeight: Typography.weight.medium,
  },
  userName: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: C.textPrimary,
    marginTop: 2,
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  langBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  langText: { fontSize: 20 },
  headerBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Palette.gold[500],
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.backgroundCard,
  },
  headerBadgeText: {
    color: Palette.dark[900],
    fontSize: 8,
    fontWeight: '900',
  },
  profileIcon: { fontSize: 20 },
  headerProfilePic: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },

  // Trust Card
  trustCard: {
    backgroundColor: Palette.dark[900],
    marginHorizontal: Spacing[5],
    borderRadius: Radius['2xl'],
    padding: Spacing[5],
    ...Shadows.lg,
  },
  trustCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[5],
  },
  trustCardTitle: {
    color: Palette.dark[300],
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  bandPill: {
    backgroundColor: Palette.gold[500],
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  bandText: {
    color: Palette.dark[900],
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[5],
  },
  scoreValue: {
    color: Palette.white.pure,
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
  },
  scoreLabel: {
    color: Palette.dark[400],
    fontSize: 10,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: Palette.dark[700],
    marginHorizontal: Spacing[6],
  },
  progressBg: {
    height: 6,
    backgroundColor: Palette.dark[800],
    borderRadius: 3,
    marginBottom: Spacing[4],
  },
  progressBar: {
    height: '100%',
    backgroundColor: Palette.gold[500],
    borderRadius: 3,
  },
  trustSub: {
    color: Palette.dark[400],
    fontSize: 11,
    lineHeight: 16,
  },

  // Sections
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    marginTop: Spacing[8],
    marginBottom: Spacing[4],
  },
  sectionTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: C.textPrimary,
  },
  sectionLink: {
    fontSize: Typography.size.xs,
    color: C.brand,
    fontWeight: Typography.weight.bold,
  },

  // Insights
  insightScroll: { paddingLeft: Spacing[5] },
  insightContent: { paddingRight: Spacing[10] },
  insightCardSmall: {
    width: 260,
    padding: Spacing[4],
    borderRadius: Radius.xl,
    marginRight: Spacing[3],
    borderWidth: 1,
  },
  insightIcon: { fontSize: 24, marginBottom: Spacing[2] },
  insightText: {
    fontSize: Typography.size.xs,
    color: Palette.dark[700],
    lineHeight: 18,
  },

  // Actions
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing[5],
    gap: Spacing[3],
  },
  actionBtn: {
    width: (Dimensions.get('window').width - Spacing[5]*2 - Spacing[3]) / 2,
    backgroundColor: C.backgroundElevated,
    borderRadius: Radius.xl,
    padding: Spacing[4],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    position: 'relative',
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: C.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[3],
  },
  actionIcon: { fontSize: 24 },
  actionLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: C.textPrimary,
  },
  soonBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Palette.dark[800],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  soonText: { color: Palette.white.pure, fontSize: 8, fontWeight: '900' },

  // AI Insight
  insightCard: {
    backgroundColor: Palette.dark[900],
    marginHorizontal: Spacing[5],
    padding: Spacing[5],
    borderRadius: Radius['2xl'],
    marginTop: Spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.3)',
    ...Shadows.md,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing[3],
  },
  aiBadge: {
    backgroundColor: Palette.gold[500],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  aiBadgeText: {
    color: Palette.dark[900],
    fontSize: 8,
    fontWeight: '900',
  },
  insightTitle: {
    color: Palette.white.pure,
    fontSize: Typography.size.xs,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  insightBody: {
    color: Palette.dark[200],
    fontSize: Typography.size.sm,
    lineHeight: 22,
    marginBottom: Spacing[4],
  },
  insightBtn: {
    alignSelf: 'flex-start',
  },
  insightBtnText: {
    color: Palette.gold[500],
    fontSize: Typography.size.xs,
    fontWeight: 'bold',
  },

  // Promo
  promoBox: {
    margin: Spacing[5],
    marginTop: Spacing[8],
    padding: Spacing[5],
    backgroundColor: Palette.gold[50],
    borderRadius: Radius['2xl'],
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.gold[200],
  },
  promoTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: Palette.gold[900],
  },
  promoDesc: {
    fontSize: Typography.size.xs,
    color: Palette.gold[700],
    marginTop: 4,
    marginBottom: Spacing[4],
    lineHeight: 16,
  },
  promoBtn: {
    backgroundColor: Palette.gold[500],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  promoBtnText: {
    color: Palette.dark[900],
    fontSize: 10,
    fontWeight: '900',
  },
  promoIcon: { fontSize: 48, marginLeft: Spacing[4], opacity: 0.8 },
  
  // AI Consultant Hero
  consultantHero: {
    backgroundColor: Palette.white.pure,
    marginHorizontal: Spacing[5],
    marginTop: Spacing[4],
    padding: Spacing[5],
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Palette.dark[100],
    ...Shadows.sm,
  },
  consultantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[4],
  },
  consultantTextCol: { flex: 1 },
  aiBadgeSmall: {
    backgroundColor: Palette.gold[50],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Palette.gold[200],
  },
  aiBadgeTextSmall: {
    color: Palette.gold[900],
    fontSize: 8,
    fontWeight: '900',
  },
  consultantTitle: {
    fontSize: Typography.size.sm,
    fontWeight: 'bold',
    color: Palette.dark[900],
    marginBottom: 10,
    lineHeight: 18,
  },
  consultantLink: {
    alignSelf: 'flex-start',
  },
  consultantLinkText: {
    fontSize: 10,
    fontWeight: '900',
    color: Palette.gold[600],
    letterSpacing: 0.5,
  },
  consultantIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Palette.dark[900],
    alignItems: 'center',
    justifyContent: 'center',
  },
  consultantIcon: { fontSize: 24 },

  // Loan Offer
  loanOfferCard: {
    backgroundColor: Palette.gold[500],
    marginHorizontal: Spacing[5],
    marginTop: Spacing[6],
    borderRadius: Radius['2xl'],
    padding: Spacing[5],
    ...Shadows.lg,
    borderWidth: 2,
    borderColor: Palette.white.pure,
  },
  loanOfferHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  loanLockIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loanTag: {
    backgroundColor: Palette.dark[900],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  loanTagText: {
    color: Palette.gold[500],
    fontSize: 10,
    fontWeight: '900',
  },
  loanTitle: {
    color: Palette.dark[900],
    fontSize: Typography.size.lg,
    fontWeight: '900',
    marginBottom: 4,
  },
  loanBody: {
    color: Palette.dark[800],
    fontSize: Typography.size.xs,
    lineHeight: 18,
    marginBottom: Spacing[4],
  },
  loanBtn: {
    backgroundColor: Palette.dark[900],
    paddingVertical: Spacing[3],
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  loanBtnText: {
    color: Palette.gold[500],
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
});


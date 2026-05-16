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
import { useInsights } from '@/hooks/use-insights';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

const C = Colors.light;

export default function AIConsultantScreen() {
  const { jobMatches, loading } = useInsights();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>AI Hustle Consultant</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Consultant Persona */}
        <View style={styles.personaCard}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatar}>🤖</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.personaName}>Kairo AI Advisor</Text>
            <Text style={styles.personaSub}>Powered by Economic Identity Data</Text>
          </View>
        </View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.introBox}>
          <Text style={styles.introText}>
            "Hello! I've analyzed your skills and Trust Score. Based on current market demand in Lagos, here are the top opportunities tailored specifically for your profile."
          </Text>
        </Animated.View>

        {/* Job Matches */}
        <Text style={styles.sectionTitle}>Smart Matches for You</Text>

        {jobMatches.map((match, index) => (
          <Animated.View 
            key={match.id}
            entering={FadeInDown.delay(400 + index * 100)}
            style={styles.matchCard}
          >
            <View style={styles.matchHeader}>
              <View>
                <Text style={styles.matchRole}>{match.role}</Text>
                <Text style={styles.matchCompany}>{match.company}</Text>
              </View>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreLabel}>FIT SCORE</Text>
                <Text style={styles.scoreValue}>{match.fitScore}%</Text>
              </View>
            </View>

            <View style={styles.reasonBox}>
              <Text style={styles.reasonTitle}>💡 AI Reasoning</Text>
              <Text style={styles.reasonText}>{match.reason}</Text>
            </View>

            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>📍</Text>
                <Text style={styles.detailText}>{match.location}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>💰</Text>
                <Text style={styles.detailText}>{match.salary}</Text>
              </View>
            </View>

            <Pressable 
              onPress={() => alert('Opening Employer Connection...')}
              style={({ pressed }) => [styles.connectBtn, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.connectBtnText}>CONNECT WITH EMPLOYER</Text>
            </Pressable>
          </Animated.View>
        ))}

        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>Pro Tip from AI</Text>
          <Text style={styles.tipText}>
            Increasing your Trust Score to 900+ will unlock "Elite" status, granting you priority placement for high-budget infrastructure projects.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.white.pure },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Palette.white.mist,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 24, color: Palette.dark[900] },
  headerTitle: {
    fontSize: Typography.size.md,
    fontWeight: '900',
    color: Palette.dark[900],
  },
  content: { padding: Spacing[5] },
  
  personaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    marginBottom: Spacing[6],
  },
  avatarBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Palette.gold[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  avatar: { fontSize: 32 },
  personaName: {
    fontSize: Typography.size.lg,
    fontWeight: 'bold',
    color: Palette.dark[900],
  },
  personaSub: {
    fontSize: 12,
    color: Palette.dark[400],
  },

  introBox: {
    backgroundColor: Palette.dark[900],
    padding: Spacing[5],
    borderRadius: Radius['2xl'],
    marginBottom: Spacing[8],
  },
  introText: {
    color: Palette.white.pure,
    fontSize: Typography.size.sm,
    lineHeight: 22,
    fontStyle: 'italic',
  },

  sectionTitle: {
    fontSize: Typography.size.md,
    fontWeight: 'bold',
    color: Palette.dark[900],
    marginBottom: Spacing[4],
  },

  matchCard: {
    backgroundColor: Palette.white.pure,
    borderRadius: Radius['2xl'],
    padding: Spacing[5],
    marginBottom: Spacing[5],
    borderWidth: 1,
    borderColor: Palette.dark[100],
    ...Shadows.sm,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[4],
  },
  matchRole: {
    fontSize: Typography.size.md,
    fontWeight: 'bold',
    color: Palette.dark[900],
  },
  matchCompany: {
    fontSize: Typography.size.xs,
    color: Palette.dark[400],
    marginTop: 2,
  },
  scoreBadge: {
    alignItems: 'center',
    backgroundColor: Palette.gold[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Palette.gold[200],
  },
  scoreLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: Palette.gold[700],
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '900',
    color: Palette.gold[900],
  },

  reasonBox: {
    backgroundColor: Palette.white.mist,
    padding: Spacing[4],
    borderRadius: Radius.lg,
    marginBottom: Spacing[4],
  },
  reasonTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Palette.dark[500],
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 12,
    color: Palette.dark[700],
    lineHeight: 18,
  },

  detailsRow: {
    flexDirection: 'row',
    gap: Spacing[4],
    marginBottom: Spacing[5],
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailIcon: { fontSize: 12 },
  detailText: {
    fontSize: 11,
    color: Palette.dark[600],
    fontWeight: '500',
  },

  connectBtn: {
    backgroundColor: Palette.dark[900],
    paddingVertical: Spacing[3],
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  connectBtnText: {
    color: Palette.gold[500],
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },

  tipBox: {
    marginTop: Spacing[4],
    padding: Spacing[5],
    backgroundColor: '#FFFBEB',
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  tipTitle: {
    fontSize: Typography.size.sm,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 18,
  },
});

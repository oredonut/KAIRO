import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Pressable, 
  Share,
  Platform,
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { useTrustScore } from '@/hooks/use-trust-score';

const C = Colors.light;

const REFERRED_PEOPLE = [
  { id: '1', name: 'Tunde Adeyemi', status: 'verified', points: 50, role: 'Electrician' },
  { id: '2', name: 'Amina Yusuf', status: 'verified', points: 50, role: 'Caterer' },
  { id: '3', name: 'Ibrahim Bala', status: 'pending', points: 0, role: 'Driver' },
];

export default function ReferScreen() {
  const { simulateAction } = useTrustScore();
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    try {
      await Share.share({
        message: "Join me on Kairo! It's an AI network for professionals to build their trust score and unlock micro-loans. Use my link to join the inner circle: kairo.app/join/chidi-745",
      });
      // Simulate score boost for just sharing
      simulateAction(5, 'engagement', 'Referral link shared with network.');
    } catch (e) {}
    setSharing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Network Effect</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Area */}
        <View style={styles.hero}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>TRUST IS POWER</Text>
          </View>
          <Text style={styles.heroTitle}>Grow the Inner Circle</Text>
          <Text style={styles.heroDesc}>
            Invite other trusted professionals to Kairo. When they verify their identity, both your Trust Scores skyrocket.
          </Text>
        </View>

        {/* Action Card */}
        <View style={styles.actionCard}>
          <Text style={styles.cardTitle}>Your Referral Link</Text>
          <View style={styles.linkBox}>
            <Text style={styles.linkText}>kairo.app/join/chidi-745</Text>
          </View>
          <Pressable onPress={handleShare} style={styles.shareBtn}>
            {sharing ? (
              <ActivityIndicator color={Palette.dark[900]} />
            ) : (
              <Text style={styles.shareBtnText}>INVITE VIA WHATSAPP</Text>
            )}
          </Pressable>
          <Text style={styles.rewardText}>🎁 Earn +50 points for each verified referral</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>2</Text>
            <Text style={styles.statLab}>Verified</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>+100</Text>
            <Text style={styles.statLab}>Points Earned</Text>
          </View>
        </View>

        {/* Referral List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Referral History</Text>
          <View style={styles.list}>
            {REFERRED_PEOPLE.map(p => (
              <View key={p.id} style={styles.personRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{p.name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.personName}>{p.name}</Text>
                  <Text style={styles.personRole}>{p.role}</Text>
                </View>
                <View style={[styles.statusTag, p.status === 'verified' ? styles.statusVer : styles.statusPen]}>
                  <Text style={[styles.statusTagText, p.status === 'verified' ? styles.statusVerText : styles.statusPenText]}>
                    {p.status.toUpperCase()}
                  </Text>
                </View>
                {p.points > 0 && <Text style={styles.pointsEarned}>+{p.points}</Text>}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
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
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 24, color: Palette.dark[900] },
  headerTitle: { fontSize: Typography.size.md, fontWeight: 'bold', color: Palette.dark[900] },

  content: { padding: Spacing[5] },

  hero: { alignItems: 'center', marginBottom: Spacing[8] },
  badge: {
    backgroundColor: Palette.gold[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 12,
  },
  badgeText: { fontSize: 10, fontWeight: '900', color: Palette.gold[700] },
  heroTitle: { fontSize: 28, fontWeight: '900', color: Palette.dark[900], textAlign: 'center', marginBottom: 8 },
  heroDesc: { fontSize: 14, color: Palette.dark[500], textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },

  actionCard: {
    backgroundColor: Palette.dark[900],
    padding: Spacing[6],
    borderRadius: Radius['2xl'],
    ...Shadows.lg,
    marginBottom: Spacing[6],
  },
  cardTitle: { color: Palette.white.pure, fontSize: 12, fontWeight: 'bold', marginBottom: 12 },
  linkBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    height: 50,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[5],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  linkText: { color: Palette.gold[500], fontWeight: 'bold' },
  shareBtn: {
    backgroundColor: Palette.gold[500],
    height: 56,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnText: { color: Palette.dark[900], fontWeight: '900', fontSize: 14 },
  rewardText: { color: Palette.white.pure, fontSize: 10, textAlign: 'center', marginTop: 12, opacity: 0.8 },

  statsRow: { flexDirection: 'row', gap: Spacing[4], marginBottom: Spacing[8] },
  statBox: {
    flex: 1,
    backgroundColor: Palette.white.pure,
    padding: Spacing[4],
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  statVal: { fontSize: 24, fontWeight: '900', color: Palette.dark[900] },
  statLab: { fontSize: 10, color: Palette.dark[400], fontWeight: 'bold', textTransform: 'uppercase', marginTop: 2 },

  section: { marginBottom: Spacing[8] },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: Palette.dark[900], marginBottom: Spacing[4] },
  list: { gap: Spacing[3] },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.white.pure,
    padding: Spacing[3],
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.gold[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Palette.gold[700], fontWeight: 'bold' },
  personName: { fontSize: 14, fontWeight: 'bold', color: Palette.dark[900] },
  personRole: { fontSize: 10, color: Palette.dark[400] },
  statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusVer: { backgroundColor: '#DCFCE7' },
  statusPen: { backgroundColor: '#F1F5F9' },
  statusTagText: { fontSize: 8, fontWeight: '900' },
  statusVerText: { color: '#166534' },
  statusPenText: { color: Palette.dark[400] },
  pointsEarned: { fontSize: 14, fontWeight: '900', color: Palette.status.successGreen },
});

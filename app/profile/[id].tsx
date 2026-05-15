import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Pressable, 
  Platform,
  Linking
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';

const C = Colors.light;

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams();

  // Mock data for the public profile being viewed
  const profile = {
    name: id || 'Chidi Okafor',
    score: 745,
    band: 'Established',
    phone: '+234 803 123 4567',
    location: 'Lekki, Lagos',
    skills: ['Electrician', 'Solar Installer'],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    social: {
      linkedin: 'linkedin.com/in/chidi',
      instagram: '@chidi_electric',
      x: '@chidi_x'
    },
    workSamples: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1558444458-5f73797303c2?auto=format&fit=crop&q=80&w=400'
    ]
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Economic Identity</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable onPress={() => router.push({ pathname: '/chat/[id]', params: { id: profile.name, name: profile.name, avatar: profile.avatar } })}>
            <Text style={styles.callBtn}>Message</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(`tel:${profile.phone}`)}>
            <Text style={styles.callBtn}>Call</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.location}>📍 {profile.location}</Text>
          
          <View style={styles.scoreSection}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreVal}>{profile.score}</Text>
              <Text style={styles.scoreLabel}>Trust Score</Text>
            </View>
            <View style={styles.bandPill}>
              <Text style={styles.bandText}>{profile.band}</Text>
            </View>
          </View>
        </View>

        {/* Social Links */}
        <View style={styles.socialRow}>
          <Pressable style={styles.socialBtn}><Text style={styles.socialIcon}>🔗</Text></Pressable>
          <Pressable style={styles.socialBtn}><Text style={styles.socialIcon}>📸</Text></Pressable>
          <Pressable style={styles.socialBtn}><Text style={styles.socialIcon}>🐦</Text></Pressable>
        </View>

        {/* Skills */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills & Expertise</Text>
          <View style={styles.skillRow}>
            {profile.skills.map(skill => (
              <View key={skill} style={styles.skillBadge}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Portfolio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verified Work Samples</Text>
          <View style={styles.portfolioGrid}>
            {profile.workSamples.map((img, i) => (
              <Image key={i} source={{ uri: img }} style={styles.workThumb} />
            ))}
          </View>
        </View>

        <View style={styles.vouchBox}>
          <Text style={styles.vouchTitle}>Trusted by the Community</Text>
          <Text style={styles.vouchDesc}>Chidi has 24 active vouches from verified Kairo users.</Text>
          <Pressable style={styles.vouchBtn}>
            <Text style={styles.vouchBtnText}>VOUCH FOR CHIDI</Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
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
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: C.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  callBtn: {
    color: Palette.gold[600],
    fontWeight: 'bold',
    fontSize: Typography.size.sm,
  },

  content: { padding: Spacing[5] },

  profileCard: {
    alignItems: 'center',
    marginVertical: Spacing[6],
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Palette.gold[500],
    marginBottom: Spacing[4],
  },
  name: {
    fontSize: Typography.size.xl,
    fontWeight: 'bold',
    color: C.textPrimary,
  },
  location: {
    fontSize: Typography.size.sm,
    color: C.textSecondary,
    marginTop: 4,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing[5],
    gap: 12,
  },
  scoreBox: {
    backgroundColor: Palette.dark[900],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  scoreVal: {
    color: Palette.gold[500],
    fontSize: Typography.size.lg,
    fontWeight: '900',
  },
  scoreLabel: {
    color: Palette.white.pure,
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  bandPill: {
    backgroundColor: Palette.gold[50],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Palette.gold[200],
  },
  bandText: {
    color: Palette.gold[700],
    fontSize: 10,
    fontWeight: 'bold',
  },

  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing[4],
    marginBottom: Spacing[8],
  },
  socialBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.backgroundCard,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: { fontSize: 20 },

  section: { marginBottom: Spacing[8] },
  sectionTitle: {
    fontSize: Typography.size.xs,
    fontWeight: '900',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing[4],
  },
  skillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  skillText: {
    fontSize: Typography.size.xs,
    fontWeight: 'bold',
    color: '#475569',
  },

  portfolioGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  workThumb: {
    flex: 1,
    height: 120,
    borderRadius: Radius.lg,
    backgroundColor: '#F1F5F9',
  },

  vouchBox: {
    backgroundColor: Palette.dark[900],
    borderRadius: Radius['2xl'],
    padding: Spacing[6],
    alignItems: 'center',
    marginTop: Spacing[4],
  },
  vouchTitle: {
    color: Palette.white.pure,
    fontSize: Typography.size.md,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  vouchDesc: {
    color: Palette.dark[300],
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing[5],
  },
  vouchBtn: {
    backgroundColor: Palette.gold[500],
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    borderRadius: Radius.full,
  },
  vouchBtnText: {
    color: Palette.dark[900],
    fontSize: 12,
    fontWeight: '900',
  },
});

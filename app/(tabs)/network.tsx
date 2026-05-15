import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Pressable, 
  Platform,
  Dimensions,
  Share,
  Alert 
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Palette, Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';

const C = Colors.light;
const SCREEN_W = Dimensions.get('window').width;

const MOCK_POSTS = [
  {
    id: 'p1',
    user: {
      name: 'Chidi Okafor',
      score: 745,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    },
    workPhoto: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800',
    description: 'Just finished this wiring job for a new office in Victoria Island. Kairo AI verified my work sample! ⚡️',
    time: '2h ago',
    likes: 24,
  },
  {
    id: 'p2',
    user: {
      name: 'Amina Yusuf',
      score: 610,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    },
    workPhoto: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=800',
    description: 'Delivered 50 lunch boxes to the tech hub today. Clean kitchen, on-time delivery. Let’s keep moving! 🍲',
    time: '5h ago',
    likes: 18,
  },
  {
    id: 'p3',
    user: {
      name: 'Tunde Adeyemi',
      score: 890,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    },
    workPhoto: 'https://images.unsplash.com/photo-1589939705384-5185138a047a?auto=format&fit=crop&q=80&w=800',
    description: 'New tiling work completed in Lekki Phase 1. High precision, high Trust Score. Vouch for me! 🧱',
    time: 'Yesterday',
    likes: 56,
  }
];

function PostCard({ post }: { post: typeof MOCK_POSTS[0] }) {
  const [vouched, setVouched] = useState(false);

  const handleVouch = () => {
    if (vouched) return;
    setVouched(true);
    Alert.alert('Vouch Recorded!', `You have vouched for ${post.user.name}. This helps their Trust Score grow.`);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${post.user.name}'s verified work on Kairo! Trust Score: ${post.user.score}`,
      });
    } catch (error) {}
  };

  return (
    <View style={styles.card}>
      {/* User Header */}
      <Pressable 
        onPress={() => router.push({ pathname: '/profile/[id]', params: { id: post.user.name } })}
        style={styles.cardHeader}
      >
        <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{post.user.name}</Text>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>⭐ {post.user.score} Trust Score</Text>
          </View>
        </View>
        <Text style={styles.timeText}>{post.time}</Text>
      </Pressable>

      {/* Description */}
      <Text style={styles.descText}>{post.description}</Text>

      {/* Work Photo */}
      <Image source={{ uri: post.workPhoto }} style={styles.workImage} />

      {/* Footer / Actions */}
      <View style={styles.cardFooter}>
        <Pressable 
          onPress={handleVouch}
          style={[styles.actionBtn, vouched && { backgroundColor: Palette.gold[50] }]}
        >
          <Text style={styles.actionIcon}>{vouched ? '✅' : '🤝'}</Text>
          <Text style={[styles.actionText, vouched && { color: Palette.gold[700] }]}>
            {vouched ? 'Vouched' : 'Vouch'}
          </Text>
        </Pressable>
        <Pressable 
          style={styles.actionBtn}
          onPress={() => router.push({ pathname: '/chat/[id]', params: { id: post.user.name, name: post.user.name, avatar: post.user.avatar } })}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>Message</Text>
        </Pressable>
        <Pressable 
          style={styles.actionBtn}
          onPress={() => Alert.alert('Comments', 'Community discussions coming soon in Phase 2!')}
        >
          <Text style={styles.actionIcon}>💭</Text>
          <Text style={styles.actionText}>Comment</Text>
        </Pressable>
        <Pressable onPress={handleShare} style={styles.actionBtn}>
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionText}>Share</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function NetworkScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Kairo Network</Text>
          <Text style={styles.subtitle}>Social Proof & Skill Verification</Text>
        </View>
        <Pressable 
          onPress={() => router.push('/network/create')}
          style={styles.postBtn}
        >
          <Text style={styles.postBtnText}>Post Work</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Network Effect Promo */}
        <Pressable 
          onPress={() => router.push('/network/refer')}
          style={styles.promoCard}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTag}>TRUST BOOST 🎁</Text>
            <Text style={styles.promoTitle}>Grow the Circle</Text>
            <Text style={styles.promoDesc}>Invite other pros and get +50 points when they verify.</Text>
          </View>
          <View style={styles.promoIconBox}>
            <Text style={{ fontSize: 24 }}>🤝</Text>
          </View>
        </Pressable>

        {MOCK_POSTS.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    backgroundColor: Palette.white.pure,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: Typography.size.lg,
    fontWeight: '900',
    color: Palette.dark[900],
  },
  subtitle: {
    fontSize: 10,
    color: Palette.dark[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  postBtn: {
    backgroundColor: Palette.gold[500],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: Radius.lg,
  },
  postBtnText: {
    color: Palette.dark[900],
    fontSize: 12,
    fontWeight: 'bold',
  },

  scrollContent: { padding: Spacing[4] },
  
  promoCard: {
    backgroundColor: Palette.dark[900],
    borderRadius: Radius.xl,
    padding: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[5],
    ...Shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.3)',
  },
  promoTag: {
    color: Palette.gold[500],
    fontSize: 9,
    fontWeight: '900',
    marginBottom: 4,
  },
  promoTitle: {
    color: Palette.white.pure,
    fontSize: 16,
    fontWeight: '900',
  },
  promoDesc: {
    color: Palette.dark[300],
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  promoIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  card: {
    backgroundColor: Palette.white.pure,
    borderRadius: Radius['2xl'],
    marginBottom: Spacing[4],
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    padding: Spacing[4],
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: Spacing[3],
    backgroundColor: '#F1F5F9',
  },
  userName: {
    fontSize: Typography.size.sm,
    fontWeight: 'bold',
    color: Palette.dark[900],
  },
  scoreBadge: {
    marginTop: 2,
  },
  scoreText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Palette.gold[600],
  },
  timeText: {
    fontSize: 10,
    color: Palette.dark[400],
  },
  descText: {
    fontSize: Typography.size.sm,
    color: Palette.dark[700],
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[3],
    lineHeight: 20,
  },
  workImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#F1F5F9',
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    padding: Spacing[2],
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[2],
    gap: 6,
  },
  actionIcon: { fontSize: 16 },
  actionText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Palette.dark[600],
  },
});

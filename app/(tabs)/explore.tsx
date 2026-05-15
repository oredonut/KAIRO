import React, { useState, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Pressable, 
  TextInput, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { useOpportunities, Opportunity } from '@/hooks/use-opportunities';
import { useTrustScore } from '@/hooks/use-trust-score';

const C = Colors.light;

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'all',          label: 'All Gigs',      icon: '✨' },
  { id: 'construction', label: 'Construction',  icon: '🏗' },
  { id: 'transport',    label: 'Transport',     icon: '🏍' },
  { id: 'trade',        label: 'Trade',         icon: '🛒' },
  { id: 'services',     label: 'Services',      icon: '⚙️' },
];

// ─── Opportunity Card ─────────────────────────────────────────────────────────

function OpportunityCard({ item, userScore }: { item: Opportunity; userScore: number }) {
  const isQualified = userScore >= item.trustScoreRequired;
  
  return (
    <Pressable 
      onPress={() => router.push(`/gig/${item.id}`)}
      style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.98 }] }]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <Text style={styles.iconText}>{item.icon}</Text>
        </View>
        <View style={styles.titleBox}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardCompany}>{item.company}</Text>
        </View>
        <View style={[styles.trustPill, { backgroundColor: isQualified ? '#e6f4ea' : '#fce8e6' }]}>
          <Text style={[styles.trustLabel, { color: isQualified ? '#1e8e3e' : '#d93025' }]}>
            {item.trustScoreRequired}
          </Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>📍</Text>
          <Text style={styles.detailText}>{item.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>💰</Text>
          <Text style={styles.detailText}>{item.pay}</Text>
        </View>
      </View>

      <View style={styles.tagRow}>
        {item.tags.map(tag => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
        <Text style={styles.postedAt}>{new Date(item.postedAt).toLocaleDateString()}</Text>
      </View>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const { opportunities, loading } = useOpportunities();
  const { score: userScore } = useTrustScore();
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');

  const filtered = useMemo(() => {
    return opportunities.filter(op => {
      const matchSearch = op.title.toLowerCase().includes(search.toLowerCase()) || 
                          op.company.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCat === 'all' || op.category.toLowerCase() === activeCat.toLowerCase();
      return matchSearch && matchCat;
    });
  }, [opportunities, search, activeCat]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Opportunities</Text>
        <Text style={styles.headerSub}>AI-matched for your Trust Score</Text>
      </View>

      {/* Search & Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput 
            style={styles.searchInput}
            placeholder="Search for roles or companies..."
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Categories */}
      <View style={styles.catWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {CATEGORIES.map(cat => (
            <Pressable 
              key={cat.id} 
              onPress={() => setActiveCat(cat.id)}
              style={[styles.catChip, activeCat === cat.id && styles.catChipActive]}
            >
              <Text style={styles.catIcon}>{cat.icon}</Text>
              <Text style={[styles.catLabel, activeCat === cat.id && styles.catLabelActive]}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Feed */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Palette.gold[500]} size="large" />
        </View>
      ) : (
        <ScrollView 
          style={styles.feed} 
          contentContainerStyle={styles.feedContent}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length > 0 ? (
            filtered.map(op => (
              <OpportunityCard key={op.id} item={op} userScore={userScore} />
            ))
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No gigs found</Text>
              <Text style={styles.emptySub}>Try adjusting your search or category filters</Text>
            </View>
          )}
          <View style={{ height: Spacing[10] }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[2],
  },
  headerTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: C.textPrimary,
  },
  headerSub: {
    fontSize: Typography.size.sm,
    color: C.textSecondary,
    marginTop: 2,
  },

  // Search
  searchContainer: {
    paddingHorizontal: Spacing[5],
    marginTop: Spacing[4],
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.backgroundCard,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing[4],
    height: 52,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchIcon: { fontSize: 16, marginRight: Spacing[2] },
  searchInput: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: C.textPrimary,
    fontWeight: Typography.weight.medium,
  },

  // Categories
  catWrapper: {
    marginTop: Spacing[4],
  },
  catRow: {
    paddingHorizontal: Spacing[5],
    gap: Spacing[2],
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.backgroundCard,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderWidth: 1,
    borderColor: C.border,
    gap: 6,
  },
  catChipActive: {
    backgroundColor: C.brandLight,
    borderColor: Palette.gold[400],
  },
  catIcon: { fontSize: 14 },
  catLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: C.textSecondary,
  },
  catLabelActive: { color: C.brandDark },

  // Feed
  feed: { flex: 1 },
  feedContent: { padding: Spacing[5], gap: Spacing[4] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Card
  card: {
    backgroundColor: C.backgroundElevated,
    borderRadius: Radius.xl,
    padding: Spacing[4],
    ...Shadows.md,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: C.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing[3],
    borderWidth: 1,
    borderColor: C.border,
  },
  iconText: { fontSize: 24 },
  titleBox: { flex: 1 },
  cardTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: C.textPrimary,
  },
  cardCompany: {
    fontSize: Typography.size.xs,
    color: C.brand,
    fontWeight: Typography.weight.semibold,
    marginTop: 2,
  },
  trustPill: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: Radius.full,
  },
  trustLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },

  cardDetails: {
    gap: 8,
    marginBottom: Spacing[4],
    paddingLeft: 2,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailIcon: { fontSize: 14 },
  detailText: {
    fontSize: Typography.size.xs,
    color: C.textSecondary,
    fontWeight: Typography.weight.medium,
  },

  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  tag: {
    backgroundColor: C.backgroundCard,
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  tagText: {
    fontSize: 10,
    color: C.textMuted,
    fontWeight: Typography.weight.bold,
    textTransform: 'uppercase',
  },
  postedAt: {
    marginLeft: 'auto',
    fontSize: 10,
    color: C.textMuted,
    fontWeight: Typography.weight.medium,
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing[10],
  },
  emptyIcon: { fontSize: 48, marginBottom: Spacing[4], opacity: 0.2 },
  emptyTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: C.textPrimary },
  emptySub: { fontSize: Typography.size.sm, color: C.textMuted, marginTop: 4, textAlign: 'center' },
});


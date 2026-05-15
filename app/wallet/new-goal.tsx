import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Pressable, 
  TextInput, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTrustScore } from '@/hooks/use-trust-score';
import { Palette, Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';

const C = Colors.light;

const CATEGORIES = [
  { id: 'business', label: 'Business Tools', icon: '🛠️' },
  { id: 'rent', label: 'Shop Rent', icon: '🏢' },
  { id: 'bike', label: 'New Bike', icon: '🏍️' },
  { id: 'emergency', label: 'Emergency Fund', icon: '🛡️' },
  { id: 'family', label: 'Family/School', icon: '🎓' },
];

export default function NewGoalScreen() {
  const { simulateAction } = useTrustScore();
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [category, setCategory] = useState('business');
  const [creating, setCreating] = useState(false);

  const handleCreate = () => {
    if (!title || !target) return;
    
    setCreating(true);
    // Simulate goal creation
    setTimeout(() => {
      setCreating(false);
      // Boost trust score for "Financial Planning"
      simulateAction(30, 'savings', 'New savings goal created. Demonstrates financial discipline.');
      Alert.alert('Goal Created!', `Your "${title}" goal is now active. Small automated savings will help you reach it.`, [
        { text: 'Great', onPress: () => router.back() }
      ]);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>✕</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Set Savings Goal</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Text style={styles.introTitle}>What are you saving for?</Text>
          <Text style={styles.introDesc}>
            Setting goals helps you build financial discipline and increases your Trust Score.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Goal Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. New Yamaha Bike"
                placeholderTextColor={C.textMuted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target Amount (₦)</Text>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={styles.input}
                value={target}
                onChangeText={setTarget}
                placeholder="50,000"
                keyboardType="numeric"
                placeholderTextColor={C.textMuted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.catRow}>
              {CATEGORIES.map(cat => (
                <Pressable 
                  key={cat.id} 
                  onPress={() => setCategory(cat.id)}
                  style={[styles.catBtn, category === cat.id && styles.catBtnActive]}
                >
                  <Text style={styles.catIcon}>{cat.icon}</Text>
                  <Text style={[styles.catText, category === cat.id && styles.catTextActive]}>{cat.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <Pressable 
          onPress={handleCreate}
          disabled={!title || !target || creating}
          style={({ pressed }) => [
            styles.createBtn,
            (!title || !target || creating) && { backgroundColor: C.border },
            pressed && { opacity: 0.8 }
          ]}
        >
          {creating ? (
            <ActivityIndicator color={C.textOnDark} />
          ) : (
            <Text style={styles.createBtnText}>START SAVING</Text>
          )}
        </Pressable>
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
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 16, fontWeight: 'bold' },
  headerTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
  },

  content: { padding: Spacing[6] },
  
  intro: { marginBottom: Spacing[8] },
  introTitle: {
    fontSize: Typography.size.xl,
    fontWeight: '900',
    color: C.textPrimary,
    marginBottom: 8,
  },
  introDesc: {
    fontSize: Typography.size.sm,
    color: C.textSecondary,
    lineHeight: 22,
  },

  form: { gap: Spacing[5], marginBottom: Spacing[10] },
  inputGroup: { gap: 8 },
  label: {
    fontSize: Typography.size.xs,
    color: C.textSecondary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputWrapper: {
    backgroundColor: C.backgroundCard,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing[4],
    borderWidth: 1,
    borderColor: C.border,
    height: 52,
    justifyContent: 'center',
  },
  input: {
    fontSize: Typography.size.base,
    color: C.textPrimary,
    fontWeight: '600',
  },

  catRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  catBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.backgroundCard,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: C.border,
    gap: 8,
  },
  catBtnActive: {
    backgroundColor: Palette.gold[50],
    borderColor: Palette.gold[500],
  },
  catIcon: { fontSize: 16 },
  catText: { fontSize: 12, fontWeight: 'bold', color: C.textSecondary },
  catTextActive: { color: Palette.gold[900] },

  createBtn: {
    backgroundColor: Palette.dark[900],
    height: 56,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  createBtnText: {
    color: Palette.white.pure,
    fontSize: Typography.size.base,
    fontWeight: '900',
    letterSpacing: 1,
  },
});

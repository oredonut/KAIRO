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
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useTrustScore } from '@/hooks/use-trust-score';
import { Palette, Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';

const C = Colors.light;

export default function PortfolioScreen() {
  const { workSample, set } = useOnboardingStore();
  const { simulateAction } = useTrustScore();
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Access to gallery is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      set({ workSample: result.assets[0].uri });
    }
  };

  const handleLink = () => {
    if (!workSample || !title) return;
    
    setUploading(true);
    // Simulate AI analysis of the work sample
    setTimeout(() => {
      setUploading(false);
      setSuccess(true);
      
      // Boost the trust score for "Qualitative Enrichment"
      simulateAction(45, 'gig', 'Work sample verified via AI computer vision.');
      
      setTimeout(() => {
        router.back();
      }, 2000);
    }, 2500);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Link Portfolio</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Text style={styles.introTitle}>Show your best work</Text>
          <Text style={styles.introDesc}>
            Linking photos of your previous work helps KAIRO AI verify your skills and boosts your Trust Score by up to +50 points.
          </Text>
        </View>

        <View style={styles.uploadCard}>
          <Pressable onPress={pickImage} style={styles.dropZone}>
            {workSample ? (
              <Image source={{ uri: workSample }} style={styles.preview} />
            ) : (
              <View style={styles.dropZoneContent}>
                <Text style={styles.dropIcon}>📸</Text>
                <Text style={styles.dropText}>Upload Project Photo</Text>
                <Text style={styles.dropSub}>Tap to open gallery</Text>
              </View>
            )}
          </Pressable>

          <View style={styles.inputArea}>
            <Text style={styles.label}>Project Name / Description</Text>
            <TextInput 
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Completed 3-bedroom tiling job"
              placeholderTextColor={C.textMuted}
            />
          </View>
        </View>

        {success ? (
          <View style={styles.successState}>
            <Text style={styles.successIcon}>✨</Text>
            <Text style={styles.successTitle}>Verified!</Text>
            <Text style={styles.successBody}>
              AI verified your work sample. +45 Trust Score points applied to your profile.
            </Text>
          </View>
        ) : (
          <Pressable 
            onPress={handleLink}
            disabled={!workSample || !title || uploading}
            style={({ pressed }) => [
              styles.linkBtn,
              (!workSample || !title || uploading) && { backgroundColor: C.border },
              pressed && { opacity: 0.8 }
            ]}
          >
            {uploading ? (
              <ActivityIndicator color={C.textOnDark} />
            ) : (
              <Text style={[styles.linkBtnText, (!workSample || !title) && { color: C.textMuted }]}>
                Link to Kairo ID
              </Text>
            )}
          </Pressable>
        )}
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

  content: { padding: Spacing[6] },
  
  intro: { marginBottom: Spacing[8] },
  introTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: C.textPrimary,
    marginBottom: 8,
  },
  introDesc: {
    fontSize: Typography.size.sm,
    color: C.textSecondary,
    lineHeight: 22,
  },

  uploadCard: {
    backgroundColor: C.backgroundCard,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: C.border,
    padding: Spacing[4],
    marginBottom: Spacing[8],
    ...Shadows.sm,
  },
  dropZone: {
    height: 200,
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  dropZoneContent: { alignItems: 'center' },
  dropIcon: { fontSize: 40, marginBottom: 8 },
  dropText: { fontSize: Typography.size.sm, fontWeight: 'bold', color: C.textPrimary },
  dropSub: { fontSize: Typography.size.xs, color: C.textMuted, marginTop: 4 },

  inputArea: { marginTop: Spacing[6] },
  label: {
    fontSize: Typography.size.xs,
    color: C.textSecondary,
    fontWeight: Typography.weight.bold,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: C.background,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderWidth: 1,
    borderColor: C.border,
    fontSize: Typography.size.sm,
    color: C.textPrimary,
  },

  linkBtn: {
    backgroundColor: Palette.dark[900],
    height: 56,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  linkBtnText: {
    color: Palette.white.pure,
    fontSize: Typography.size.base,
    fontWeight: '900',
    letterSpacing: 1,
  },

  successState: {
    alignItems: 'center',
    padding: Spacing[6],
    backgroundColor: '#e6f4ea',
    borderRadius: Radius.xl,
  },
  successIcon: { fontSize: 40, marginBottom: 12 },
  successTitle: {
    fontSize: Typography.size.lg,
    fontWeight: 'bold',
    color: '#1e8e3e',
    marginBottom: 8,
  },
  successBody: {
    fontSize: Typography.size.sm,
    color: '#1e8e3e',
    textAlign: 'center',
    lineHeight: 20,
  },
});

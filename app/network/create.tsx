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

export default function CreatePostScreen() {
  const { fullName, profileImage } = useOnboardingStore();
  const { simulateAction } = useTrustScore();
  const [photo, setPhoto] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [posting, setPosting] = useState(false);

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
      setPhoto(result.assets[0].uri);
    }
  };

  const handlePost = () => {
    if (!photo || !caption) return;
    
    setPosting(true);
    // Simulate post creation
    setTimeout(() => {
      setPosting(false);
      simulateAction(20, 'engagement', 'Community post created. Social proof score increased.');
      Alert.alert('Post Published!', 'Your work has been shared with the Kairo Network.', [
        { text: 'Awesome', onPress: () => router.back() }
      ]);
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>✕</Text>
        </Pressable>
        <Text style={styles.headerTitle}>New Work Post</Text>
        <Pressable 
          onPress={handlePost} 
          disabled={!photo || !caption || posting}
        >
          {posting ? (
            <ActivityIndicator color={C.brand} />
          ) : (
            <Text style={[styles.postBtnText, (!photo || !caption) && { opacity: 0.5 }]}>Post</Text>
          )}
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Pressable onPress={pickImage} style={styles.photoBox}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photo} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderIcon}>📸</Text>
              <Text style={styles.placeholderText}>Add Photo of your work</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.inputArea}>
          <View style={styles.userRow}>
            <Image 
              source={{ uri: profileImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' }} 
              style={styles.avatar} 
            />
            <Text style={styles.userName}>{fullName}</Text>
          </View>
          
          <TextInput 
            style={styles.input}
            value={caption}
            onChangeText={setCaption}
            placeholder="What did you achieve today? (e.g. Completed a clean wiring job for a client in Lagos...)"
            placeholderTextColor={C.textMuted}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.tipBox}>
          <Text style={styles.tipText}>💡 Tip: Quality work photos with clear descriptions get 3x more vouches from the community.</Text>
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
  postBtnText: {
    color: Palette.gold[600],
    fontWeight: 'bold',
    fontSize: Typography.size.base,
  },

  content: { padding: Spacing[5] },
  photoBox: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: Spacing[6],
  },
  photo: { width: '100%', height: '100%' },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderIcon: { fontSize: 40 },
  placeholderText: {
    fontSize: Typography.size.sm,
    fontWeight: 'bold',
    color: C.textMuted,
  },

  inputArea: { gap: 12 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  userName: { fontSize: Typography.size.sm, fontWeight: 'bold' },
  input: {
    fontSize: Typography.size.base,
    color: C.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
  },

  tipBox: {
    marginTop: Spacing[8],
    padding: Spacing[4],
    backgroundColor: Palette.gold[50],
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.gold[100],
  },
  tipText: {
    fontSize: 12,
    color: Palette.gold[700],
    lineHeight: 18,
    fontStyle: 'italic',
  },
});

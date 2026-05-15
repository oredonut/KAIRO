import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Pressable, 
  TextInput, 
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useOnboardingStore } from '@/store/onboarding-store';
import { Palette, Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';

const C = Colors.light;

export default function EditProfileScreen() {
  const { fullName, phone, location, skills, profileImage, set } = useOnboardingStore();
  const [localName, setLocalName] = useState(fullName);
  const [localPhone, setLocalPhone] = useState(phone);
  const [localLocation, setLocalLocation] = useState(location);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    // Simulate API save delay
    setTimeout(() => {
      set({ 
        fullName: localName, 
        phone: localPhone, 
        location: localLocation 
      });
      setSaving(false);
      router.back();
    }, 1500);
  };

  const pickImage = async () => {
    // Ask for permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'We need access to your gallery to upload a photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      set({ profileImage: result.assets[0].uri });
    }
  };

  const takePhoto = async () => {
    // Ask for permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'We need access to your camera to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      set({ profileImage: result.assets[0].uri });
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Profile Photo',
      'Choose a method to update your profile picture',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleAddSkill = () => {
    Alert.prompt(
      'Add Skill',
      'Enter a new skill you want to add to your profile',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add', 
          onPress: (skill: string | undefined) => {
            if (skill && !skills.includes(skill)) {
              set({ skills: [...skills, skill] });
            }
          } 
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <Pressable onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={C.brand} size="small" />
          ) : (
            <Text style={styles.saveBtn}>Save</Text>
          )}
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Profile Pic Section */}
        <View style={styles.imageSection}>
          <Pressable onPress={showImageOptions} style={styles.imageWrapper}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profilePic} />
            ) : (
              <View style={[styles.profilePic, styles.placeholder]}>
                <Text style={styles.placeholderIcon}>👤</Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <Text style={styles.editIcon}>📸</Text>
            </View>
          </Pressable>
          <Text style={styles.imageNote}>Tap to change photo</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={styles.input}
                value={localName}
                onChangeText={setLocalName}
                placeholder="Your Name"
                placeholderTextColor={C.textMuted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={styles.input}
                value={localPhone}
                onChangeText={setLocalPhone}
                placeholder="Phone"
                placeholderTextColor={C.textMuted}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={styles.input}
                value={localLocation}
                onChangeText={setLocalLocation}
                placeholder="City, State"
                placeholderTextColor={C.textMuted}
              />
            </View>
          </View>

          {/* Social Links Section */}
          <Text style={[styles.label, { marginTop: Spacing[4] }]}>Social Presence</Text>
          <View style={styles.socialGroup}>
            <View style={styles.socialInput}>
              <Text style={styles.socialIcon}>🔗</Text>
              <TextInput 
                style={styles.flexInput}
                value={useOnboardingStore.getState().socialLinks.linkedin}
                onChangeText={(val) => set({ socialLinks: { ...useOnboardingStore.getState().socialLinks, linkedin: val } })}
                placeholder="LinkedIn Profile"
                placeholderTextColor={C.textMuted}
              />
            </View>
            <View style={styles.socialInput}>
              <Text style={styles.socialIcon}>📸</Text>
              <TextInput 
                style={styles.flexInput}
                value={useOnboardingStore.getState().socialLinks.instagram}
                onChangeText={(val) => set({ socialLinks: { ...useOnboardingStore.getState().socialLinks, instagram: val } })}
                placeholder="Instagram Handle"
                placeholderTextColor={C.textMuted}
              />
            </View>
            <View style={styles.socialInput}>
              <Text style={styles.socialIcon}>🐦</Text>
              <TextInput 
                style={styles.flexInput}
                value={useOnboardingStore.getState().socialLinks.x}
                onChangeText={(val) => set({ socialLinks: { ...useOnboardingStore.getState().socialLinks, x: val } })}
                placeholder="X (Twitter) Handle"
                placeholderTextColor={C.textMuted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Skills</Text>
            <View style={styles.skillRow}>
              {skills.map(skill => (
                <View key={skill} style={styles.skillBadge}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
              <Pressable onPress={handleAddSkill} style={styles.addSkillBtn}>
                <Text style={styles.addSkillText}>+ Add</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.footerInfo}>
          <Text style={styles.footerLabel}>KAIRO IDENTITY VERIFIED</Text>
          <Text style={styles.footerValue}>Verified via BVN • Tier 1 Account</Text>
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
  saveBtn: {
    fontSize: Typography.size.base,
    color: Palette.gold[600],
    fontWeight: Typography.weight.bold,
    paddingRight: 4,
  },

  content: { padding: Spacing[5] },

  imageSection: {
    alignItems: 'center',
    marginVertical: Spacing[6],
  },
  imageWrapper: {
    width: 120,
    height: 120,
    position: 'relative',
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Palette.gold[500],
  },
  placeholder: {
    backgroundColor: C.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  placeholderIcon: { fontSize: 60 },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Palette.gold[500],
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
    borderWidth: 2,
    borderColor: C.background,
  },
  editIcon: { fontSize: 18 },
  imageNote: {
    marginTop: Spacing[3],
    fontSize: Typography.size.xs,
    color: C.textMuted,
    fontWeight: Typography.weight.medium,
  },

  form: { gap: Spacing[5] },
  inputGroup: { gap: 8 },
  label: {
    fontSize: Typography.size.xs,
    color: C.textSecondary,
    fontWeight: Typography.weight.bold,
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
    fontWeight: Typography.weight.medium,
  },

  socialGroup: { gap: 12 },
  socialInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.backgroundCard,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing[4],
    borderWidth: 1,
    borderColor: C.border,
    height: 52,
  },
  socialIcon: { fontSize: 18, marginRight: 12 },
  flexInput: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: C.textPrimary,
    fontWeight: Typography.weight.medium,
  },

  skillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    backgroundColor: Palette.gold[50],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.gold[200],
  },
  skillText: {
    fontSize: Typography.size.xs,
    color: Palette.gold[900],
    fontWeight: Typography.weight.bold,
  },
  addSkillBtn: {
    backgroundColor: C.backgroundCard,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.border,
  },
  addSkillText: {
    fontSize: Typography.size.xs,
    color: C.textMuted,
    fontWeight: Typography.weight.bold,
  },

  footerInfo: {
    marginTop: Spacing[10],
    padding: Spacing[4],
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.xl,
    alignItems: 'center',
    gap: 4,
  },
  footerLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '900',
    letterSpacing: 1,
  },
  footerValue: {
    fontSize: Typography.size.xs,
    color: '#475569',
    fontWeight: Typography.weight.semibold,
  },
});

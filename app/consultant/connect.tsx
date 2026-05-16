import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  Pressable, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Palette, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

export default function EmployerConnectScreen() {
  const { role = "Skilled Artisan", company = "BuildRight Construction" } = useLocalSearchParams();
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!message.trim()) return;
    setSent(true);
    // In a real app, this would hit the messaging API
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContent}>
          <Animated.View entering={FadeIn} style={styles.successIconBox}>
            <Text style={{ fontSize: 50 }}>✉️</Text>
          </Animated.View>
          <Text style={styles.successTitle}>Inquiry Sent!</Text>
          <Text style={styles.successSub}>
            Your verified Kairo profile and message have been sent to {company}. They will contact you via your registered phone number.
          </Text>
          <Pressable 
            onPress={() => router.replace('/(tabs)/home' as any)}
            style={styles.doneBtn}
          >
            <Text style={styles.doneBtnText}>BACK TO DASHBOARD</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Connect with Employer</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.employerCard}>
            <View style={styles.employerIcon}>
              <Text style={{ fontSize: 24 }}>🏗️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.employerName}>{company}</Text>
              <Text style={styles.hiringFor}>Hiring for: {role}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>VERIFIED EMPLOYER</Text>
            </View>
          </View>

          <View style={styles.inquiryBox}>
            <Text style={styles.inquiryTitle}>Send your Pitch</Text>
            <Text style={styles.inquirySub}>
              Tell {company} why you are the best fit. Your Trust Score and Voice Story will be attached automatically.
            </Text>

            <TextInput
              multiline
              placeholder="Hi! I'm interested in this role. I have 5 years of experience in Lagos and a high Trust Score..."
              placeholderTextColor={Palette.dark[300]}
              value={message}
              onChangeText={setMessage}
              style={styles.input}
            />

            <View style={styles.attachmentCard}>
              <View style={styles.attachmentRow}>
                <Text style={styles.attachmentIcon}>📑</Text>
                <Text style={styles.attachmentText}>Verified Kairo Identity Attached</Text>
              </View>
              <View style={styles.attachmentRow}>
                <Text style={styles.attachmentIcon}>🎙️</Text>
                <Text style={styles.attachmentText}>Voice Introduction Attached</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable 
            onPress={handleSend}
            style={({ pressed }) => [
              styles.sendBtn, 
              (!message.trim()) && { backgroundColor: Palette.dark[200] },
              pressed && { opacity: 0.8 }
            ]}
          >
            <Text style={[styles.sendBtnText, (!message.trim()) && { color: Palette.dark[400] }]}>SEND SECURE INQUIRY</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 24, color: Palette.dark[900] },
  headerTitle: { fontSize: 16, fontWeight: '900', color: Palette.dark[900] },
  
  content: { padding: Spacing[5] },
  
  employerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    backgroundColor: Palette.dark[900],
    padding: Spacing[4],
    borderRadius: Radius.xl,
    marginBottom: Spacing[8],
  },
  employerIcon: {
    width: 50, height: 50,
    borderRadius: 25,
    backgroundColor: Palette.gold[500],
    alignItems: 'center', justifyContent: 'center',
  },
  employerName: { color: Palette.white.pure, fontWeight: 'bold', fontSize: 16 },
  hiringFor: { color: Palette.gold[400], fontSize: 12, marginTop: 2 },
  verifiedBadge: {
    backgroundColor: Palette.gold[50] + '20',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1, borderColor: Palette.gold[500],
  },
  verifiedText: { color: Palette.gold[500], fontSize: 8, fontWeight: '900' },

  inquiryBox: { gap: Spacing[2] },
  inquiryTitle: { fontSize: 18, fontWeight: 'bold', color: Palette.dark[900] },
  inquirySub: { fontSize: 14, color: Palette.dark[500], lineHeight: 22, marginBottom: Spacing[4] },
  
  input: {
    backgroundColor: Palette.white.mist,
    borderRadius: Radius.xl,
    padding: Spacing[4],
    height: 160,
    textAlignVertical: 'top',
    fontSize: 14,
    color: Palette.dark[900],
    borderWidth: 1, borderColor: Palette.dark[100],
  },

  attachmentCard: {
    marginTop: Spacing[6],
    backgroundColor: Palette.gold[50],
    padding: Spacing[4],
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Palette.gold[200],
    gap: Spacing[2],
  },
  attachmentRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  attachmentIcon: { fontSize: 14 },
  attachmentText: { fontSize: 12, fontWeight: 'bold', color: Palette.gold[900] },

  footer: { padding: Spacing[5], borderTopWidth: 1, borderTopColor: Palette.white.mist },
  sendBtn: {
    backgroundColor: Palette.gold[500],
    paddingVertical: Spacing[4],
    borderRadius: Radius.full,
    alignItems: 'center',
    ...Shadows.md,
  },
  sendBtnText: { color: Palette.dark[900], fontSize: 14, fontWeight: '900', letterSpacing: 1 },

  successContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing[8] },
  successIconBox: {
    width: 100, height: 100,
    borderRadius: 50,
    backgroundColor: Palette.gold[50],
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing[6],
  },
  successTitle: { fontSize: Typography.size.xl, fontWeight: 'bold', color: Palette.dark[900], marginBottom: Spacing[2] },
  successSub: { fontSize: 14, color: Palette.dark[500], textAlign: 'center', lineHeight: 24, marginBottom: Spacing[8] },
  doneBtn: {
    backgroundColor: Palette.dark[900],
    width: '100%',
    paddingVertical: Spacing[4],
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  doneBtnText: { color: Palette.gold[500], fontSize: 14, fontWeight: '900' },
});

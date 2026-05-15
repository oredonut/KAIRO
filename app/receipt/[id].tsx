import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Pressable, 
  Platform,
  Share,
  Dimensions
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';

const C = Colors.light;
const { width } = Dimensions.get('window');

export default function ReceiptScreen() {
  const { id, amount, recipient, description, date } = useLocalSearchParams();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `KAIRO VERIFIED RECEIPT\nAmount: ₦${amount}\nRecipient: ${recipient}\nService: ${description}\nVerified by Kairo Economic Identity Network.`,
      });
    } catch (e) {}
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>✕</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Kairo Formalizer</Text>
        <Pressable onPress={handleShare}>
          <Text style={styles.shareBtn}>Share</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.receiptCard}>
          {/* Top Seal */}
          <View style={styles.sealArea}>
            <View style={styles.seal}>
              <Text style={styles.sealText}>KAIRO</Text>
              <Text style={styles.sealSub}>VERIFIED</Text>
            </View>
            <View style={styles.refBox}>
              <Text style={styles.refLabel}>REFERENCE</Text>
              <Text style={styles.refValue}>TXN-{Math.random().toString(36).substring(7).toUpperCase()}</Text>
            </View>
          </View>

          {/* Amount */}
          <View style={styles.amountArea}>
            <Text style={styles.amountLabel}>Transaction Amount</Text>
            <Text style={styles.amountValue}>₦{Number(amount || 15000).toLocaleString()}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>● PAYMENT COMPLETED</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Details */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Recipient (Merchant)</Text>
            <Text style={styles.detailValue}>{recipient || 'Chidi Okafor'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service Description</Text>
            <Text style={styles.detailValue}>{description || 'Office Wiring & Maintenance'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>{date || new Date().toLocaleDateString()}</Text>
          </View>

          <View style={styles.divider} />

          {/* Trust Footprint */}
          <View style={styles.trustFooter}>
            <Text style={styles.trustTitle}>Economic Identity Footprint</Text>
            <View style={styles.trustInfo}>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreVal}>745</Text>
                <Text style={styles.scoreLabel}>Trust Score</Text>
              </View>
              <Text style={styles.trustDesc}>
                This transaction has been recorded on the Kairo Economic Network. 
                Completion of this work has boosted the merchant's Trust Score by <Text style={{ fontWeight: 'bold' }}>+12 points</Text>.
              </Text>
            </View>
          </View>

          {/* QR Code Placeholder */}
          <View style={styles.qrArea}>
            <View style={styles.qrBox}>
              <Text style={{ fontSize: 40 }}>📱</Text>
            </View>
            <Text style={styles.qrText}>Scan to verify this receipt on Kairo ID</Text>
          </View>
        </View>

        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            This document serves as formal proof of transaction. Kairo AI confirms the identity and reputation of both parties involved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F5F9' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    backgroundColor: Palette.white.pure,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 18, color: Palette.dark[400] },
  headerTitle: { fontSize: 14, fontWeight: '900', color: Palette.dark[900], textTransform: 'uppercase', letterSpacing: 1 },
  shareBtn: { color: Palette.gold[600], fontWeight: 'bold' },

  content: { padding: Spacing[5], alignItems: 'center' },
  
  receiptCard: {
    width: '100%',
    backgroundColor: Palette.white.pure,
    borderRadius: Radius.lg,
    padding: Spacing[6],
    ...Shadows.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  sealArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[8],
  },
  seal: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: Palette.gold[500],
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-15deg' }],
  },
  sealText: { fontSize: 12, fontWeight: '900', color: Palette.gold[600] },
  sealSub: { fontSize: 8, fontWeight: 'bold', color: Palette.gold[600] },

  refBox: { alignItems: 'flex-end' },
  refLabel: { fontSize: 8, color: Palette.dark[400], fontWeight: '900' },
  refValue: { fontSize: 10, color: Palette.dark[900], fontWeight: 'bold', marginTop: 2 },

  amountArea: { alignItems: 'center', marginBottom: Spacing[8] },
  amountLabel: { fontSize: 10, color: Palette.dark[400], textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  amountValue: { fontSize: 32, fontWeight: '900', color: Palette.dark[900] },
  statusBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, marginTop: 8 },
  statusText: { fontSize: 8, fontWeight: '900', color: '#166534' },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: Spacing[6], borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1' },

  detailRow: { marginBottom: Spacing[4] },
  detailLabel: { fontSize: 9, color: Palette.dark[400], fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
  detailValue: { fontSize: 14, color: Palette.dark[900], fontWeight: '600' },

  trustFooter: {
    backgroundColor: '#F8FAFC',
    padding: Spacing[4],
    borderRadius: Radius.md,
    marginTop: Spacing[4],
  },
  trustTitle: { fontSize: 10, fontWeight: '900', color: Palette.dark[500], textTransform: 'uppercase', marginBottom: 12 },
  trustInfo: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  scoreBox: { backgroundColor: Palette.dark[900], padding: 8, borderRadius: 8, alignItems: 'center', width: 60 },
  scoreVal: { color: Palette.gold[500], fontSize: 16, fontWeight: '900' },
  scoreLabel: { color: Palette.white.pure, fontSize: 6, fontWeight: 'bold' },
  trustDesc: { flex: 1, fontSize: 10, color: Palette.dark[600], lineHeight: 14 },

  qrArea: { alignItems: 'center', marginTop: Spacing[8] },
  qrBox: { width: 80, height: 80, backgroundColor: '#F1F5F9', borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  qrText: { fontSize: 10, color: Palette.dark[400], marginTop: 8, textAlign: 'center' },

  noticeBox: { marginTop: Spacing[6], paddingHorizontal: Spacing[4] },
  noticeText: { fontSize: 11, color: Palette.dark[400], textAlign: 'center', lineHeight: 18, fontStyle: 'italic' },
});

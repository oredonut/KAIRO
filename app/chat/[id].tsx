import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Pressable, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { useWallet } from '@/hooks/use-wallet';

const C = Colors.light;

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: string;
  type?: 'text' | 'offer';
  offerAmount?: number;
  status?: 'pending' | 'accepted' | 'paid';
}

export default function ChatScreen() {
  const { id, name, avatar } = useLocalSearchParams();
  const { balance, sendMoney } = useWallet();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello! I saw your work on the Kairo Network. Are you available for a quick job?`,
      sender: 'me',
      timestamp: '10:00 AM',
      type: 'text'
    },
    {
      id: '2',
      text: `Hi! Yes I am. What do you have in mind?`,
      sender: 'other',
      timestamp: '10:02 AM',
      type: 'text'
    }
  ]);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerValue, setOfferValue] = useState('15000');
  const [inputText, setInputText] = useState('');
  const [paying, setPaying] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = () => {
    if (!inputText.trim()) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    };
    setMessages([...messages, newMessage]);
    setInputText('');
  };

  const createOffer = (amount: number) => {
    const offer: Message = {
      id: Date.now().toString(),
      text: `PROPOSED PRICE: ₦${amount.toLocaleString()}`,
      sender: 'me', // User initiates the offer
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'offer',
      offerAmount: amount,
      status: 'pending'
    };
    setMessages(prev => [...prev, offer]);
    setShowOfferModal(false);
    
    // Simulate seller responding after 2 seconds
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        text: `That works for me! I'll get started once the escrow is funded.`,
        sender: 'other',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'text'
      };
      setMessages(prev => [...prev, response]);
    }, 2000);
  };

  const handleAction = (msgId: string, action: 'accept' | 'decline' | 'pay') => {
    if (action === 'decline') {
      setMessages(prev => prev.map(m => 
        m.id === msgId ? { ...m, status: 'declined', text: '❌ OFFER DECLINED' } : m
      ));
      return;
    }

    if (action === 'accept') {
      setMessages(prev => prev.map(m => 
        m.id === msgId ? { ...m, status: 'accepted', text: '🤝 OFFER ACCEPTED' } : m
      ));
      return;
    }

    if (action === 'pay') {
      handlePayment(msgId, messages.find(m => m.id === msgId)?.offerAmount || 0);
    }
  };

  const handlePayment = async (msgId: string, amount: number) => {
    setPaying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setMessages(prev => prev.map(m => 
        m.id === msgId ? { ...m, status: 'paid', text: '✅ PAYMENT COMPLETED' } : m
      ));
      Alert.alert('Success', `₦${amount.toLocaleString()} funded to escrow. Worker can now start!`);
    } catch (e) {
      Alert.alert('Error', 'Payment failed.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerInfo}>
          <Image source={{ uri: (avatar as string) || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' }} style={styles.headerAvatar} />
          <View>
            <Text style={styles.headerName}>{name || 'Kairo User'}</Text>
            <Text style={styles.headerStatus}>Online</Text>
          </View>
        </View>
        <Pressable onPress={() => setShowOfferModal(true)} style={styles.offerBtn}>
          <Text style={styles.offerBtnText}>Offer</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(msg => (
            <View key={msg.id} style={[styles.messageRow, msg.sender === 'me' ? styles.myRow : styles.otherRow]}>
              <View style={[
                styles.bubble, 
                msg.sender === 'me' ? styles.myBubble : styles.otherBubble,
                msg.type === 'offer' && styles.offerBubble
              ]}>
                <Text style={[styles.messageText, msg.sender === 'me' ? styles.myText : styles.otherText]}>
                  {msg.text}
                </Text>
                
                {msg.type === 'offer' && msg.status === 'pending' && (
                  <View style={{ gap: 8, marginTop: 10 }}>
                    {msg.sender === 'other' ? (
                      // I am the buyer, I see Accept/Decline for seller's offer
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <Pressable 
                          onPress={() => handleAction(msg.id, 'accept')}
                          style={[styles.miniBtn, { backgroundColor: '#22C55E' }]}
                        >
                          <Text style={styles.miniBtnText}>ACCEPT</Text>
                        </Pressable>
                        <Pressable 
                          onPress={() => handleAction(msg.id, 'decline')}
                          style={[styles.miniBtn, { backgroundColor: '#EF4444' }]}
                        >
                          <Text style={styles.miniBtnText}>DECLINE</Text>
                        </Pressable>
                      </View>
                    ) : (
                      // I sent the offer, I wait for response
                      <View style={styles.waitBadge}>
                        <Text style={styles.waitText}>WAITING FOR WORKER...</Text>
                      </View>
                    )}
                  </View>
                )}

                {msg.type === 'offer' && msg.status === 'accepted' && msg.sender === 'me' && (
                  <Pressable 
                    onPress={() => handleAction(msg.id, 'pay')}
                    disabled={paying}
                    style={styles.payBtn}
                  >
                    {paying ? (
                      <ActivityIndicator size="small" color={Palette.dark[900]} />
                    ) : (
                      <Text style={styles.payBtnText}>PROCEED TO WALLET & PAY</Text>
                    )}
                  </Pressable>
                )}

                {msg.type === 'offer' && msg.status === 'paid' && (
                  <View style={{ gap: 8 }}>
                    <View style={styles.paidBadge}>
                      <Text style={styles.paidText}>ESCROW RELEASED</Text>
                    </View>
                    <Pressable 
                      onPress={() => router.push({ 
                        pathname: "/receipt/[id]", 
                        params: { 
                          id: msg.id,
                          amount: msg.offerAmount, 
                          recipient: name, 
                          description: 'Office Maintenance Service' 
                        } 
                      })}
                      style={styles.receiptBtn}
                    >
                      <Text style={styles.receiptBtnText}>📄 GENERATE AI RECEIPT</Text>
                    </Pressable>
                  </View>
                )}
                
                <Text style={styles.timestamp}>{msg.timestamp}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={C.textMuted}
          />
          <Pressable onPress={sendMessage} style={styles.sendBtn}>
            <Text style={styles.sendIcon}>🚀</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Premium Offer Modal */}
      <Modal
        visible={showOfferModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOfferModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Make a Price Offer</Text>
              <Pressable onPress={() => setShowOfferModal(false)}>
                <Text style={styles.closeModal}>✕</Text>
              </Pressable>
            </View>
            
            <Text style={styles.modalSub}>Enter the total amount for this gig. This will be held in Kairo Escrow until you confirm work completion.</Text>
            
            <View style={styles.priceInputRow}>
              <Text style={styles.currencySymbol}>₦</Text>
              <TextInput 
                style={styles.priceInput}
                value={offerValue}
                onChangeText={setOfferValue}
                keyboardType="numeric"
                autoFocus
              />
            </View>

            <Pressable 
              onPress={() => createOffer(Number(offerValue))}
              style={styles.confirmOfferBtn}
            >
              <Text style={styles.confirmOfferText}>SEND OFFER</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F5F9' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: Palette.white.pure,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 18 },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  headerName: { fontSize: 14, fontWeight: 'bold', color: Palette.dark[900] },
  headerStatus: { fontSize: 10, color: '#22C55E', fontWeight: 'bold' },
  offerBtn: {
    backgroundColor: Palette.gold[500],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  offerBtnText: { fontSize: 12, fontWeight: 'bold', color: Palette.dark[900] },

  messageList: { padding: Spacing[4], gap: 12 },
  messageRow: { flexDirection: 'row', width: '100%' },
  myRow: { justifyContent: 'flex-end' },
  otherRow: { justifyContent: 'flex-start' },
  
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    ...Shadows.sm,
  },
  myBubble: {
    backgroundColor: Palette.dark[900],
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: Palette.white.pure,
    borderBottomLeftRadius: 4,
  },
  offerBubble: {
    backgroundColor: '#FFFBEB',
    borderWidth: 2,
    borderColor: Palette.gold[500],
    width: '90%',
  },
  messageText: { fontSize: 14, lineHeight: 20 },
  myText: { color: Palette.white.pure },
  otherText: { color: Palette.dark[800] },
  
  payBtn: {
    backgroundColor: Palette.gold[500],
    paddingVertical: 10,
    borderRadius: Radius.md,
    marginTop: 10,
    alignItems: 'center',
  },
  payBtnText: { fontSize: 12, fontWeight: '900', color: Palette.dark[900] },
  
  paidBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
    alignItems: 'center',
  },
  paidText: { fontSize: 10, fontWeight: 'bold', color: '#166534' },
  
  miniBtn: {
    flex: 1,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniBtnText: { color: Palette.white.pure, fontSize: 10, fontWeight: '900' },
  waitBadge: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  waitText: { fontSize: 10, fontWeight: 'bold', color: Palette.dark[400] },
  
  receiptBtn: {
    backgroundColor: Palette.white.pure,
    paddingVertical: 8,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.gold[500],
  },
  receiptBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: Palette.gold[600],
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Palette.white.pure,
    borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'],
    padding: Spacing[6],
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  modalTitle: { fontSize: Typography.size.lg, fontWeight: '900', color: Palette.dark[900] },
  closeModal: { fontSize: 20, color: Palette.dark[400] },
  modalSub: { fontSize: Typography.size.sm, color: Palette.dark[500], lineHeight: 20, marginBottom: Spacing[6] },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing[5],
    height: 70,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing[8],
  },
  currencySymbol: { fontSize: 24, fontWeight: '900', color: Palette.dark[900], marginRight: 10 },
  priceInput: { flex: 1, fontSize: 28, fontWeight: '900', color: Palette.dark[900] },
  confirmOfferBtn: {
    backgroundColor: Palette.dark[900],
    height: 56,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  confirmOfferText: { color: Palette.gold[500], fontSize: 14, fontWeight: '900', letterSpacing: 1 },

  timestamp: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 4,
    alignSelf: 'flex-end',
  },

  inputContainer: {
    flexDirection: 'row',
    padding: Spacing[4],
    backgroundColor: Palette.white.pure,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.dark[900],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: { fontSize: 20 },
});

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
  ActivityIndicator
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

  const sendOffer = () => {
    Alert.prompt(
      'Send Price Offer',
      'Enter the agreed amount for the job (₦)',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send', 
          onPress: (amount) => {
            if (amount && !isNaN(Number(amount))) {
              const offer: Message = {
                id: Date.now().toString(),
                text: `PROPOSED PRICE: ₦${Number(amount).toLocaleString()}`,
                sender: 'other', // Simulate the worker sending the offer
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: 'offer',
                offerAmount: Number(amount),
                status: 'pending'
              };
              setMessages([...messages, offer]);
            }
          } 
        },
      ],
      'plain-text',
      '15000'
    );
  };

  const handlePayment = async (msgId: string, amount: number) => {
    setPaying(true);
    try {
      // Simulate payment logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setMessages(prev => prev.map(m => 
        m.id === msgId ? { ...m, status: 'paid', text: '✅ PAYMENT COMPLETED' } : m
      ));
      
      Alert.alert('Payment Successful', `₦${amount.toLocaleString()} has been sent to ${name}.`);
    } catch (e) {
      Alert.alert('Payment Failed', 'Check your balance and try again.');
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
        <Pressable onPress={sendOffer} style={styles.offerBtn}>
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
                  <Pressable 
                    onPress={() => handlePayment(msg.id, msg.offerAmount!)}
                    disabled={paying}
                    style={styles.payBtn}
                  >
                    {paying ? (
                      <ActivityIndicator size="small" color={Palette.dark[900]} />
                    ) : (
                      <Text style={styles.payBtnText}>ACCEPT & PAY NOW</Text>
                    )}
                  </Pressable>
                )}

                {msg.type === 'offer' && msg.status === 'paid' && (
                  <View style={styles.paidBadge}>
                    <Text style={styles.paidText}>ESCROW RELEASED</Text>
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

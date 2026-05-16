import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Palette, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  Easing,
  Layout
} from 'react-native-reanimated';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useTrustStore } from '@/store/trust-store';

const STEPS = [
  "Verifying BVN with Identity Registry...",
  "Syncing with Squad Network...",
  "Generating Virtual Account Number...",
  "Securing Private Keys...",
  "Wallet Ready!"
];

export default function CreateWalletScreen() {
  const [phase, setPhase] = useState<'setup' | 'sync'>('setup');
  const [stepIndex, setStepIndex] = useState(0);
  const [pin, setPin] = useState('');
  const { fullName, bvn, set } = useOnboardingStore();
  const updateTrust = useTrustStore((s: any) => s.update);
  
  const rotation = useSharedValue(0);

  const startSync = () => {
    if (pin.length < 4) {
      alert("Please set a 4-digit PIN for your wallet security.");
      return;
    }
    setPhase('sync');
  };

  useEffect(() => {
    if (phase === 'sync') {
      rotation.value = withRepeat(
        withTiming(360, { duration: 2000, easing: Easing.linear }),
        -1
      );

      const interval = setInterval(() => {
        setStepIndex((prev) => {
          if (prev < STEPS.length - 1) return prev + 1;
          clearInterval(interval);
          return prev;
        });
      }, 1800);

      return () => clearInterval(interval);
    }
  }, [phase]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const isDone = phase === 'sync' && stepIndex === STEPS.length - 1;

  const handleFinish = () => {
    set({ walletCreated: true });
    updateTrust("wallet");
    router.replace('/consultant' as any);
  };

  return (
    <View style={styles.container}>
      {phase === 'setup' ? (
        <Animated.View entering={FadeIn} style={styles.setupContainer}>
          <View>
            <Text style={styles.setupTitle}>Security Setup</Text>
            <Text style={styles.setupSub}>Confirm your details and set a transaction PIN for your Kairo Wallet.</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>FULL NAME</Text>
                <View style={styles.disabledInput}>
                  <Text style={styles.disabledText}>{fullName || "John Doe"}</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>VERIFIED BVN</Text>
                <View style={styles.disabledInput}>
                  <Text style={styles.disabledText}>{bvn || "2222****341"}</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CREATE TRANSACTION PIN</Text>
                <View style={styles.pinInputBox}>
                  <Text style={styles.pinText}>{pin.padEnd(4, '•')}</Text>
                </View>
                <View style={styles.keypad}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '⌫'].map((key) => (
                    <Pressable 
                      key={key.toString()}
                      onPress={() => {
                        if (key === 'C') setPin('');
                        else if (key === '⌫') setPin(prev => prev.slice(0, -1));
                        else if (pin.length < 4) setPin(prev => prev + key);
                      }}
                      style={styles.key}
                    >
                      <Text style={styles.keyText}>{key}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </View>

          <Pressable onPress={startSync} style={styles.btn}>
            <Text style={styles.btnText}>ACTIVATE KAIRO WALLET</Text>
          </Pressable>
        </Animated.View>
      ) : (
        <View style={styles.syncContainer}>
          <View style={styles.content}>
            <Animated.View style={[styles.spinnerBox, spinStyle]} entering={FadeIn.duration(1000)}>
              <View style={styles.spinnerInner}>
                <Text style={{ fontSize: 40 }}>💳</Text>
              </View>
            </Animated.View>

            <View style={styles.textContainer}>
              <Animated.Text 
                key={stepIndex}
                entering={FadeInDown}
                layout={Layout.springify()}
                style={styles.stepText}
              >
                {STEPS[stepIndex]}
              </Animated.Text>
              
              {isDone && (
                <Animated.Text 
                  entering={FadeInDown.delay(300)}
                  style={styles.subText}
                >
                  Your virtual account has been generated via Squad API.
                </Animated.Text>
              )}
            </View>
          </View>

          {isDone && (
            <Animated.View entering={FadeInDown} style={styles.footer}>
              <Pressable 
                onPress={handleFinish}
                style={({ pressed }) => [styles.btn, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.btnText}>ENTER KAIRO NETWORK</Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.dark[900],
    padding: Spacing[6],
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  setupTitle: {
    fontSize: Typography.size['2xl'],
    fontWeight: 'bold',
    color: Palette.white.pure,
    marginBottom: Spacing[2],
  },
  setupSub: {
    fontSize: Typography.size.sm,
    color: Palette.dark[300],
    marginBottom: Spacing[8],
    lineHeight: 20,
  },
  form: {
    gap: Spacing[6],
  },
  inputGroup: {
    marginBottom: Spacing[4],
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: Palette.gold[500],
    letterSpacing: 1,
    marginBottom: Spacing[2],
  },
  disabledInput: {
    backgroundColor: Palette.dark[800],
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.dark[600],
  },
  disabledText: {
    color: Palette.dark[300],
    fontSize: 14,
    fontWeight: 'bold',
  },
  pinInputBox: {
    backgroundColor: Palette.dark[800],
    paddingVertical: Spacing[4],
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.gold[500],
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  pinText: {
    color: Palette.gold[500],
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 8,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  key: {
    width: '30%',
    aspectRatio: 1.5,
    backgroundColor: Palette.dark[800],
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    color: Palette.white.pure,
    fontSize: Typography.size.lg,
    fontWeight: 'bold',
  },
  syncContainer: {
    flex: 1,
  },
  spinnerBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: Palette.gold[500],
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[8],
  },
  spinnerInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Palette.dark[800],
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    height: 100,
  },
  stepText: {
    fontSize: Typography.size.lg,
    fontWeight: 'bold',
    color: Palette.white.pure,
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  subText: {
    fontSize: Typography.size.sm,
    color: Palette.dark[300],
    textAlign: 'center',
  },
  footer: {
    paddingBottom: Spacing[8],
  },
  btn: {
    backgroundColor: Palette.gold[500],
    paddingVertical: Spacing[4],
    borderRadius: Radius.full,
    alignItems: 'center',
    ...Shadows.gold,
  },
  btnText: {
    color: Palette.dark[900],
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
});

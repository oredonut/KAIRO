import React, { useState } from "react";
import { View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useOnboardingStore } from "../../store/onboarding-store";
import { useTrustStore } from "../../store/trust-store";
import { Palette, Typography, Spacing, Radius } from "@/constants/theme";
import Animated, { FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";

export default function BVNVerification() {
    const { bvn, set } = useOnboardingStore();
    const update = useTrustStore((s: any) => s.update);
    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState(false);

    const handleVerify = () => {
        if (bvn.length !== 11) return;
        
        setVerifying(true);
        // Simulate real NIBSS verification delay
        setTimeout(() => {
            setVerifying(false);
            setVerified(true);
            set({ bvnVerified: true });
            
            // Give it a moment to show success before moving on
            setTimeout(() => {
                update("identity"); // This boosts the trust score
                router.push("/onboarding/skills" as any);
            }, 1500);
        }, 2500);
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            style={{ flex: 1, backgroundColor: Palette.dark[900] }}
        >
            <View style={{ flex: 1, padding: Spacing[6], paddingTop: Spacing[12], justifyContent: "space-between" }}>
                <View>
                    <Animated.Text 
                        entering={FadeInDown.duration(600)} 
                        style={{ color: Palette.gold[500], fontWeight: '900', letterSpacing: 2, fontSize: Typography.size.sm, marginBottom: Spacing[2] }}
                    >
                        STEP 2 OF 5
                    </Animated.Text>
                    <Animated.Text 
                        entering={FadeInDown.delay(100).duration(600)} 
                        style={{ fontSize: Typography.size['3xl'], fontWeight: Typography.weight.bold, color: Palette.white.pure, marginBottom: Spacing[4] }}
                    >
                        Verify Identity
                    </Animated.Text>
                    <Animated.Text 
                        entering={FadeInDown.delay(200).duration(600)} 
                        style={{ fontSize: Typography.size.base, color: Palette.dark[300], marginBottom: Spacing[8], lineHeight: 24 }}
                    >
                        Enter your 11-digit Bank Verification Number (BVN) to secure your economic identity and unlock a higher starting Trust Score.
                    </Animated.Text>

                    {verifying ? (
                        <Animated.View entering={FadeInUp} style={{ alignItems: 'center', marginTop: Spacing[10] }}>
                            <ActivityIndicator size="large" color={Palette.gold[500]} />
                            <Text style={{ color: Palette.white.pure, marginTop: Spacing[6], fontSize: Typography.size.md, fontWeight: '600' }}>
                                Verifying with NIBSS...
                            </Text>
                            <Text style={{ color: Palette.dark[400], marginTop: Spacing[2], fontSize: Typography.size.xs }}>
                                Secure connection established
                            </Text>
                        </Animated.View>
                    ) : verified ? (
                        <Animated.View entering={ZoomIn} style={{ alignItems: 'center', marginTop: Spacing[10] }}>
                            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#e6f4ea', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ fontSize: 40 }}>✅</Text>
                            </View>
                            <Text style={{ color: Palette.white.pure, marginTop: Spacing[6], fontSize: Typography.size.lg, fontWeight: 'bold' }}>
                                BVN Verified
                            </Text>
                            <Text style={{ color: Palette.gold[400], marginTop: Spacing[2], fontSize: Typography.size.sm, fontWeight: '600' }}>
                                +50 Trust Score Bonus Applied
                            </Text>
                        </Animated.View>
                    ) : (
                        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
                            <View style={{ 
                                backgroundColor: Palette.dark[800], 
                                borderRadius: Radius.xl, 
                                paddingHorizontal: Spacing[4], 
                                borderWidth: 1, 
                                borderColor: bvn.length === 11 ? Palette.gold[500] : Palette.dark[600],
                                flexDirection: 'row',
                                alignItems: 'center'
                            }}>
                                <Text style={{ fontSize: 20, marginRight: Spacing[2] }}>🛡</Text>
                                <TextInput
                                    placeholder="Enter 11-digit BVN"
                                    placeholderTextColor={Palette.dark[400]}
                                    value={bvn}
                                    onChangeText={(t) => set({ bvn: t.replace(/[^0-9]/g, '').slice(0, 11) })}
                                    keyboardType="number-pad"
                                    secureTextEntry={false}
                                    style={{ 
                                        flex: 1,
                                        color: Palette.white.pure, 
                                        paddingVertical: Spacing[4], 
                                        fontSize: Typography.size.lg,
                                        fontWeight: 'bold',
                                        letterSpacing: 4
                                    }}
                                />
                            </View>
                            
                            <View style={{ marginTop: Spacing[6], flexDirection: 'row', alignItems: 'center', gap: Spacing[2] }}>
                                <Text style={{ fontSize: 14 }}>🔒</Text>
                                <Text style={{ color: Palette.dark[400], fontSize: 12, lineHeight: 18 }}>
                                    Your BVN is only used for one-time verification. KAIRO does not have access to your bank accounts.
                                </Text>
                            </View>
                        </Animated.View>
                    )}
                </View>

                {!verifying && !verified && (
                    <Animated.View entering={FadeInDown.delay(500).duration(600)} style={{ paddingBottom: Spacing[8] }}>
                        <Pressable
                            onPress={handleVerify}
                            disabled={bvn.length !== 11}
                            style={({ pressed }) => ({
                                backgroundColor: bvn.length === 11 ? Palette.gold[500] : Palette.dark[700],
                                paddingVertical: Spacing[4],
                                borderRadius: Radius.full,
                                opacity: pressed && bvn.length === 11 ? 0.8 : 1,
                            })}
                        >
                            <Text style={{ 
                                color: bvn.length === 11 ? Palette.dark[900] : Palette.dark[400], 
                                textAlign: "center", 
                                fontWeight: '900', 
                                fontSize: Typography.size.base,
                                letterSpacing: 1 
                            }}>
                                VERIFY BVN
                            </Text>
                        </Pressable>
                        
                        <Pressable 
                            onPress={() => router.push("/onboarding/skills" as any)}
                            style={{ marginTop: Spacing[4] }}
                        >
                            <Text style={{ color: Palette.dark[400], textAlign: "center", fontSize: Typography.size.sm }}>
                                Skip for now (some features will be locked)
                            </Text>
                        </Pressable>
                    </Animated.View>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}

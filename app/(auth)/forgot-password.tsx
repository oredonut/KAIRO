import { router } from "expo-router";
import { Pressable, Text, TextInput, View, KeyboardAvoidingView, Platform } from "react-native";
import { Palette, Typography, Spacing, Radius } from "@/constants/theme";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useState } from "react";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const isComplete = email.trim() && email.includes("@");

    if (submitted) {
        return (
            <View style={{ flex: 1, backgroundColor: Palette.dark[900], padding: Spacing[6], justifyContent: "center", alignItems: "center" }}>
                <Animated.View entering={FadeInDown.duration(600)} style={{ marginBottom: Spacing[8] }}>
                    <IconSymbol name="paperplane.fill" size={80} color={Palette.gold[500]} />
                </Animated.View>
                <Text style={{ fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, color: Palette.white.pure, textAlign: 'center', marginBottom: Spacing[4] }}>
                    Check your email
                </Text>
                <Text style={{ color: Palette.dark[300], fontSize: Typography.size.base, textAlign: 'center', marginBottom: Spacing[10] }}>
                    We've sent password recovery instructions to {email}.
                </Text>
                <Pressable
                    onPress={() => router.back()}
                    style={{ backgroundColor: Palette.gold[500], paddingHorizontal: Spacing[8], paddingVertical: Spacing[4], borderRadius: Radius.full }}
                >
                    <Text style={{ color: Palette.dark[900], fontWeight: '900' }}>BACK TO LOGIN</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: Palette.dark[900] }}>
            <View style={{ flex: 1, padding: Spacing[6], paddingTop: Spacing[12], justifyContent: "space-between" }}>
                <View>
                    <Pressable onPress={() => router.back()} style={{ marginBottom: Spacing[8] }}>
                        <IconSymbol name="chevron.left" size={28} color={Palette.white.pure} />
                    </Pressable>

                    <Animated.Text entering={FadeInDown.duration(600)} style={{ fontSize: Typography.size['3xl'], fontWeight: Typography.weight.bold, color: Palette.white.pure, marginBottom: Spacing[2] }}>
                        Recovery
                    </Animated.Text>
                    <Animated.Text entering={FadeInDown.delay(100).duration(600)} style={{ color: Palette.dark[300], fontSize: Typography.size.base, marginBottom: Spacing[8] }}>
                        Enter your email to receive a password reset link.
                    </Animated.Text>

                    <Animated.View entering={FadeInDown.delay(300).duration(600)}>
                        <View style={{ backgroundColor: Palette.dark[800], borderRadius: Radius.xl, paddingHorizontal: Spacing[4], borderWidth: 1, borderColor: Palette.dark[600] }}>
                            <TextInput
                                placeholder="Email Address"
                                placeholderTextColor={Palette.dark[300]}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                style={{ color: Palette.white.pure, paddingVertical: Spacing[4], fontSize: Typography.size.base }}
                            />
                        </View>
                    </Animated.View>
                </View>

                <Animated.View entering={FadeInDown.delay(500).duration(600)} style={{ paddingBottom: Spacing[8] }}>
                    <Pressable
                        onPress={() => {
                            if (!isComplete) return;
                            setSubmitted(true);
                        }}
                        style={({ pressed }) => ({
                            backgroundColor: isComplete ? Palette.gold[500] : Palette.dark[700],
                            paddingVertical: Spacing[4],
                            borderRadius: Radius.full,
                            opacity: pressed && isComplete ? 0.8 : 1,
                        })}
                    >
                        <Text style={{ 
                            color: isComplete ? Palette.dark[900] : Palette.dark[400], 
                            textAlign: "center", 
                            fontWeight: '900', 
                            fontSize: Typography.size.base,
                            letterSpacing: 1 
                        }}>
                            SEND LINK
                        </Text>
                    </Pressable>
                </Animated.View>
            </View>
        </KeyboardAvoidingView>
    );
}

import { router } from "expo-router";
import { Pressable, Text, TextInput, View, KeyboardAvoidingView, Platform } from "react-native";
import { Palette, Typography, Spacing, Radius } from "@/constants/theme";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useState } from "react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const isComplete = email.trim() && password.length >= 6;

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: Palette.dark[900] }}>
            <View style={{ flex: 1, padding: Spacing[6], paddingTop: Spacing[12], justifyContent: "space-between" }}>
                <View>
                    <Animated.Text entering={FadeInDown.duration(600)} style={{ color: Palette.gold[500], fontWeight: '900', letterSpacing: 2, fontSize: Typography.size.sm, marginBottom: Spacing[2] }}>
                        WELCOME BACK
                    </Animated.Text>
                    <Animated.Text entering={FadeInDown.delay(100).duration(600)} style={{ fontSize: Typography.size['3xl'], fontWeight: Typography.weight.bold, color: Palette.white.pure, marginBottom: Spacing[8] }}>
                        Login to Kairo
                    </Animated.Text>

                    <Animated.View entering={FadeInDown.delay(300).duration(600)} style={{ gap: Spacing[5] }}>
                        {/* Email Input */}
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

                        {/* Password Input */}
                        <View style={{ backgroundColor: Palette.dark[800], borderRadius: Radius.xl, paddingHorizontal: Spacing[4], borderWidth: 1, borderColor: Palette.dark[600] }}>
                            <TextInput
                                placeholder="Password"
                                placeholderTextColor={Palette.dark[300]}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                style={{ color: Palette.white.pure, paddingVertical: Spacing[4], fontSize: Typography.size.base }}
                            />
                        </View>

                        <Pressable 
                            onPress={() => router.push("/(auth)/forgot-password" as any)}
                            style={{ alignSelf: 'flex-end' }}
                        >
                            <Text style={{ color: Palette.gold[500], fontSize: Typography.size.sm, fontWeight: 'bold' }}>
                                Forgot Password?
                            </Text>
                        </Pressable>
                    </Animated.View>
                </View>

                <Animated.View entering={FadeInDown.delay(500).duration(600)} style={{ paddingBottom: Spacing[8] }}>
                    <Pressable
                        onPress={() => {
                            if (!isComplete) return;
                            // In a real app, call login API
                            router.replace("/consultant" as any);
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
                            LOGIN
                        </Text>
                    </Pressable>

                    <Pressable 
                        onPress={() => router.push("/(auth)/register" as any)}
                        style={{ marginTop: Spacing[6] }}
                    >
                        <Text style={{ color: Palette.dark[300], textAlign: "center", fontSize: Typography.size.sm }}>
                            Don't have an account? <Text style={{ color: Palette.gold[500], fontWeight: 'bold' }}>Sign Up</Text>
                        </Text>
                    </Pressable>
                </Animated.View>
            </View>
        </KeyboardAvoidingView>
    );
}

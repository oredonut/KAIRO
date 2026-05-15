import { View, Text, Pressable, Platform } from "react-native";
import { router } from "expo-router";
import { Palette, Typography, Spacing, Radius } from "@/constants/theme";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

export default function Intro() {
    return (
        <View style={{ flex: 1, backgroundColor: Palette.dark[900], padding: Spacing[6], justifyContent: "space-between" }}>
            <View style={{ flex: 1, justifyContent: "center" }}>
                <Animated.View entering={FadeIn.duration(1000)} style={{ alignItems: 'center', marginBottom: Spacing[10] }}>
                    <Animated.Image 
                        source={require("../../assets/images/kairo-logo-gold.png")}
                        style={{ width: 120, height: 120, resizeMode: 'contain' }}
                    />
                </Animated.View>

                <Animated.Text 
                    entering={FadeInDown.delay(300).duration(800)}
                    style={{ 
                        fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
                        fontSize: Typography.size['4xl'], 
                        fontWeight: Typography.weight.bold,
                        color: Palette.white.pure,
                        letterSpacing: -0.5,
                        textAlign: 'center',
                        lineHeight: 48,
                    }}>
                    Your hustle deserves visibility
                </Animated.Text>

                <Animated.Text 
                    entering={FadeInDown.delay(500).duration(800)}
                    style={{ 
                        marginTop: Spacing[4], 
                        fontSize: Typography.size.lg,
                        color: Palette.dark[200],
                        textAlign: 'center',
                        lineHeight: 28,
                    }}>
                    Build your economic identity with KAIRO and get access to credit, squads, and more.
                </Animated.Text>
            </View>

            <Animated.View entering={FadeInDown.delay(800).duration(600)} style={{ paddingBottom: Spacing[8] }}>
                <Pressable
                    onPress={() => router.push("/onboarding/identity" as any)}
                    style={({ pressed }) => ({
                        backgroundColor: Palette.gold[500],
                        paddingVertical: Spacing[4],
                        borderRadius: Radius.full,
                        opacity: pressed ? 0.8 : 1,
                        shadowColor: Palette.gold[500],
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 5,
                    })}
                >
                    <Text style={{ 
                        color: Palette.dark[900], 
                        textAlign: "center", 
                        fontWeight: '900', 
                        fontSize: Typography.size.base,
                        letterSpacing: 1 
                    }}>
                        GET STARTED
                    </Text>
                </Pressable>

                <Pressable 
                    onPress={() => router.push("/(auth)/login" as any)}
                    style={{ marginTop: Spacing[6] }}
                >
                    <Text style={{ color: Palette.dark[300], textAlign: "center", fontSize: Typography.size.sm }}>
                        Already have an account? <Text style={{ color: Palette.gold[500], fontWeight: 'bold' }}>Login</Text>
                    </Text>
                </Pressable>
            </Animated.View>
        </View>
    );
}
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { Palette, Typography, Spacing, Radius } from "@/constants/theme";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function Complete() {
    return (
        <View style={{ flex: 1, backgroundColor: Palette.dark[900], padding: Spacing[6], justifyContent: "space-between" }}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Animated.View entering={FadeIn.duration(1000)} style={{ marginBottom: Spacing[8] }}>
                    <IconSymbol name="checkmark.seal.fill" size={100} color={Palette.gold[500]} />
                </Animated.View>

                <Animated.Text entering={FadeInDown.delay(300).duration(800)} style={{ fontSize: Typography.size['3xl'], fontWeight: Typography.weight.bold, color: Palette.white.pure, textAlign: 'center', marginBottom: Spacing[4] }}>
                    Your economic identity is ready
                </Animated.Text>
                
                <Animated.Text entering={FadeInDown.delay(500).duration(800)} style={{ color: Palette.dark[300], fontSize: Typography.size.lg, textAlign: 'center', lineHeight: 28, paddingHorizontal: Spacing[4] }}>
                    Welcome to the AI Economic Identity Network. Your hustle is now verified and visible.
                </Animated.Text>
            </View>

            <Animated.View entering={FadeInDown.delay(800).duration(600)} style={{ paddingBottom: Spacing[8] }}>
                <Pressable
                    onPress={() => router.replace("/(tabs)/home" as any)}
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
                        ENTER APP
                    </Text>
                </Pressable>
            </Animated.View>
        </View>
    );
}
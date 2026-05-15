import { router } from "expo-router";
import { View, Text, Pressable } from "react-native";
import { useOnboardingStore } from "../../store/onboarding-store";
import { useTrustStore } from "../../store/trust-store";
import VoiceRecorder from "../../components/VoiceRecorder";
import { Palette, Typography, Spacing, Radius } from "@/constants/theme";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function Voice() {
    const { set } = useOnboardingStore();
    const update = useTrustStore((s: any) => s.update);

    return (
        <View style={{ flex: 1, backgroundColor: Palette.dark[900], padding: Spacing[6], paddingTop: Spacing[12] }}>
            <Animated.Text entering={FadeInDown.duration(600)} style={{ color: Palette.gold[500], fontWeight: '900', letterSpacing: 2, fontSize: Typography.size.sm, marginBottom: Spacing[2] }}>
                STEP 3 OF 5
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(100).duration(600)} style={{ fontSize: Typography.size['3xl'], fontWeight: Typography.weight.bold, color: Palette.white.pure, marginBottom: Spacing[2] }}>
                Record your story
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(150).duration(600)} style={{ color: Palette.dark[300], fontSize: Typography.size.base, marginBottom: Spacing[8] }}>
                Tell us about your hustle in your own words.
            </Animated.Text>

            <Animated.View entering={FadeInDown.delay(300).duration(600)} style={{ flex: 1 }}>
                <VoiceRecorder
                    onRecordingComplete={(uri: string) => {
                        set({ voiceBio: uri });
                    }}
                />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(600).duration(600)} style={{ paddingBottom: Spacing[8] }}>
                <Pressable
                    onPress={() => {
                        update("voice");
                        router.push("/onboarding/work" as any);
                    }}
                    style={({ pressed }) => ({
                        backgroundColor: Palette.gold[500],
                        paddingVertical: Spacing[4],
                        borderRadius: Radius.full,
                        opacity: pressed ? 0.8 : 1,
                    })}
                >
                    <Text style={{ 
                        color: Palette.dark[900], 
                        textAlign: "center", 
                        fontWeight: '900', 
                        fontSize: Typography.size.base,
                        letterSpacing: 1 
                    }}>
                        CONTINUE
                    </Text>
                </Pressable>
            </Animated.View>
        </View>
    );
}
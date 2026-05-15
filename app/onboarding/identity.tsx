import { router } from "expo-router";
import { Pressable, Text, TextInput, View, KeyboardAvoidingView, Platform } from "react-native";
import { useOnboardingStore } from "../../store/onboarding-store";
import { useTrustStore } from "../../store/trust-store";
import { Palette, Typography, Spacing, Radius } from "@/constants/theme";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function Identity() {
    const { fullName, phone, location, set } = useOnboardingStore();
    const update = useTrustStore((s: any) => s.update);

    const isComplete = fullName.trim() && phone.trim() && location.trim();

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: Palette.dark[900] }}>
            <View style={{ flex: 1, padding: Spacing[6], paddingTop: Spacing[12], justifyContent: "space-between" }}>
                <View>
                    <Animated.Text entering={FadeInDown.duration(600)} style={{ color: Palette.gold[500], fontWeight: '900', letterSpacing: 2, fontSize: Typography.size.sm, marginBottom: Spacing[2] }}>
                        STEP 1 OF 5
                    </Animated.Text>
                    <Animated.Text entering={FadeInDown.delay(100).duration(600)} style={{ fontSize: Typography.size['3xl'], fontWeight: Typography.weight.bold, color: Palette.white.pure, marginBottom: Spacing[8] }}>
                        Tell us about yourself
                    </Animated.Text>

                    <Animated.View entering={FadeInDown.delay(200).duration(600)} style={{ gap: Spacing[5] }}>
                        <View style={{ backgroundColor: Palette.dark[800], borderRadius: Radius.xl, paddingHorizontal: Spacing[4], borderWidth: 1, borderColor: Palette.dark[600] }}>
                            <TextInput
                                placeholder="Full Name"
                                placeholderTextColor={Palette.dark[300]}
                                value={fullName}
                                onChangeText={(t) => set({ fullName: t })}
                                style={{ color: Palette.white.pure, paddingVertical: Spacing[4], fontSize: Typography.size.base }}
                            />
                        </View>

                        <View style={{ backgroundColor: Palette.dark[800], borderRadius: Radius.xl, paddingHorizontal: Spacing[4], borderWidth: 1, borderColor: Palette.dark[600] }}>
                            <TextInput
                                placeholder="Phone Number"
                                placeholderTextColor={Palette.dark[300]}
                                value={phone}
                                onChangeText={(t) => set({ phone: t })}
                                keyboardType="phone-pad"
                                style={{ color: Palette.white.pure, paddingVertical: Spacing[4], fontSize: Typography.size.base }}
                            />
                        </View>

                        <View style={{ backgroundColor: Palette.dark[800], borderRadius: Radius.xl, paddingHorizontal: Spacing[4], borderWidth: 1, borderColor: Palette.dark[600] }}>
                            <TextInput
                                placeholder="Location (e.g. Lagos, Nigeria)"
                                placeholderTextColor={Palette.dark[300]}
                                value={location}
                                onChangeText={(t) => set({ location: t })}
                                style={{ color: Palette.white.pure, paddingVertical: Spacing[4], fontSize: Typography.size.base }}
                            />
                        </View>
                    </Animated.View>
                </View>

                <Animated.View entering={FadeInDown.delay(400).duration(600)} style={{ paddingBottom: Spacing[8] }}>
                    <Pressable
                        onPress={() => {
                            if (!isComplete) return;
                            update("identity");
                            router.push("/onboarding/skills" as any);
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
                            CONTINUE
                        </Text>
                    </Pressable>
                </Animated.View>
            </View>
        </KeyboardAvoidingView>
    );
}
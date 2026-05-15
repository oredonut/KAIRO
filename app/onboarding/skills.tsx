import { View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { useOnboardingStore } from "../../store/onboarding-store";
import { useTrustStore } from "../../store/trust-store";
import { Palette, Typography, Spacing, Radius } from "@/constants/theme";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { IconSymbol } from "@/components/ui/icon-symbol";

const SKILLS = ["Trading", "Tailoring", "Mechanic", "Food Vendor", "Logistics", "Farming", "Crafts", "Other"];

export default function Skills() {
    const { skills, set } = useOnboardingStore();
    const update = useTrustStore((s: any) => s.update);

    const toggle = (s: string) => {
        const exists = skills.includes(s);
        set({
            skills: exists ? skills.filter((x: any) => x !== s) : [...skills, s],
        });
    };

    return (
        <View style={{ flex: 1, backgroundColor: Palette.dark[900], padding: Spacing[6], paddingTop: Spacing[12] }}>
            <Animated.Text entering={FadeInDown.duration(600)} style={{ color: Palette.gold[500], fontWeight: '900', letterSpacing: 2, fontSize: Typography.size.sm, marginBottom: Spacing[2] }}>
                STEP 2 OF 5
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(100).duration(600)} style={{ fontSize: Typography.size['3xl'], fontWeight: Typography.weight.bold, color: Palette.white.pure, marginBottom: Spacing[2] }}>
                What are your skills?
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(150).duration(600)} style={{ color: Palette.dark[300], fontSize: Typography.size.base, marginBottom: Spacing[8] }}>
                Select all that apply to your hustle.
            </Animated.Text>

            <ScrollView contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing[3], paddingBottom: Spacing[10] }} showsVerticalScrollIndicator={false}>
                {SKILLS.map((s, index) => {
                    const isSelected = skills.includes(s);
                    return (
                        <Animated.View key={s} entering={FadeIn.delay(200 + (index * 50)).duration(400)}>
                            <Pressable 
                                onPress={() => toggle(s)}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: isSelected ? Palette.gold[500] : Palette.dark[800],
                                    paddingVertical: Spacing[3],
                                    paddingHorizontal: Spacing[5],
                                    borderRadius: Radius.full,
                                    borderWidth: 1,
                                    borderColor: isSelected ? Palette.gold[500] : Palette.dark[600],
                                }}
                            >
                                {isSelected && <IconSymbol name="checkmark.circle.fill" size={16} color={Palette.dark[900]} style={{ marginRight: Spacing[2] }} />}
                                <Text style={{ 
                                    color: isSelected ? Palette.dark[900] : Palette.white.pure,
                                    fontWeight: isSelected ? '700' : '500',
                                    fontSize: Typography.size.base 
                                }}>
                                    {s}
                                </Text>
                            </Pressable>
                        </Animated.View>
                    );
                })}
            </ScrollView>

            <Animated.View entering={FadeInDown.delay(600).duration(600)} style={{ paddingBottom: Spacing[8] }}>
                <Pressable
                    onPress={() => {
                        update("skills");
                        router.push("/onboarding/voice" as any);
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
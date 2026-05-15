import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { useOnboardingStore } from "../../store/onboarding-store";
import { useTrustStore } from "../../store/trust-store";

const SKILLS = ["Trading", "Tailoring", "Mechanic", "Food Vendor"];

export default function Skills() {
    const { skills, set } = useOnboardingStore();
    const update = useTrustStore((s) => s.update);

    const toggle = (s: string) => {
        const exists = skills.includes(s);

        set({
            skills: exists
                ? skills.filter((x) => x !== s)
                : [...skills, s],
        });
    };

    return (
        <View style={{ flex: 1, padding: 24 }}>
            {SKILLS.map((s) => (
                <Pressable key={s} onPress={() => toggle(s)}>
                    <Text>{s}</Text>
                </Pressable>
            ))}

            <Pressable
                onPress={() => {
                    update("skills");
                    router.push("/onboarding/voice" as any);
                }}
            >
                <Text>Continue</Text>
            </Pressable>
        </View>
    );
}
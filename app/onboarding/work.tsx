import { View, Text, Pressable } from "react-native";
import { useOnboardingStore } from "../../store/onboarding-store";
import { useTrustStore } from "../../store/trust-store";
import { router } from "expo-router";

export default function Work() {
    const { set } = useOnboardingStore();
    const update = useTrustStore((s) => s.update);

    return (
        <View style={{ flex: 1, padding: 24 }}>
            <Pressable
                onPress={() => {
                    set({ workSample: "uploaded.jpg" });
                    update("work");
                    router.push("/onboarding/wallet" as any);
                }}
            >
                <Text>Upload Work Sample</Text>
            </Pressable>
        </View>
    );
}
import { View, Text, Pressable } from "react-native";
import { useOnboardingStore } from "../../store/onboarding-store";
import { useTrustStore } from "../../store/trust-store";
import { router } from "expo-router";

export default function Wallet() {
    const { set } = useOnboardingStore();
    const update = useTrustStore((s) => s.update);

    return (
        <View style={{ flex: 1, padding: 24 }}>
            <Pressable
                onPress={() => {
                    set({ walletCreated: true });
                    update("wallet");
                    router.push("/onboarding/complete" as any);
                }}
            >
                <Text>Create Wallet</Text>
            </Pressable>
        </View>
    );
}
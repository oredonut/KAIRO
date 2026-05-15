import { router } from "expo-router";
import { Pressable, Text, TextInput, View } from "react-native";
import { useOnboardingStore } from "../../store/onboarding-store";
import { useTrustStore } from "../../store/trust-store";

export default function Identity() {
    const { fullName, phone, location, set } = useOnboardingStore();
    const update = useTrustStore((s) => s.update);

    return (
        <View style={{ flex: 1, padding: 24 }}>
            <Text>Identity</Text>

            <TextInput
                placeholder="Full name"
                value={fullName}
                onChangeText={(t) => set({ fullName: t })}
            />

            <TextInput
                placeholder="Phone"
                value={phone}
                onChangeText={(t) => set({ phone: t })}
            />

            <TextInput
                placeholder="Location"
                value={location}
                onChangeText={(t) => set({ location: t })}
            />

            <Pressable
                onPress={() => {
                    update("identity");
                    router.push("/onboarding/skills" as any);
                }}
            >
                <Text>Continue</Text>
            </Pressable>
        </View>
    );
}

import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";

export default function Intro() {
    return (
        <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
            <Text style={{ fontSize: 28, fontWeight: "700" }}>
                Your hustle deserves visibility
            </Text>

            <Text style={{ marginTop: 10, color: "#666" }}>
                Build your economic identity with KAIRO
            </Text>

            <Pressable
                onPress={() => router.push("/onboarding/identity" as any)}
                style={{
                    marginTop: 20,
                    backgroundColor: "#D4A017",
                    padding: 14,
                    borderRadius: 12,
                }}
            >
                <Text style={{ color: "white", textAlign: "center" }}>
                    Get Started
                </Text>
            </Pressable>
        </View>
    );
}
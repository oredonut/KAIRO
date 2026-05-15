import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";

export default function Complete() {
    return (
        <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
            <Text>Your economic identity is ready</Text>

            <Pressable onPress={() => router.replace("/")}>
                <Text>Enter App</Text>
            </Pressable>
        </View>
    );
}
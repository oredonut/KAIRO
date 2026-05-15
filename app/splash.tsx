import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
    FadeIn,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

export default function Splash() {
    const router = useRouter();
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withTiming(1, { duration: 2000 });

        setTimeout(() => {
            router.replace("/onboarding" as any);
        }, 2500);
    }, []);

    const style = useAnimatedStyle(() => ({
        opacity: interpolate(progress.value, [0, 1], [0.3, 1]),
        transform: [
            { scale: interpolate(progress.value, [0, 1], [0.9, 1.05]) },
        ],
    }));

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: "#0D0D0D",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <Animated.Text
                entering={FadeIn.duration(1000)}
                style={[
                    { fontSize: 44, fontWeight: "800", color: "#F5C518" },
                    style,
                ]}
            >
                KAIRO
            </Animated.Text>

            <Text style={{ color: "#999", marginTop: 10 }}>
                Where Possibilities Become Opportunities
            </Text>
        </View>
    );
}
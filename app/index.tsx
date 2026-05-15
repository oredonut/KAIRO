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
                backgroundColor: "#0D0D0D", // Palette.dark[900]
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <Animated.View
                entering={FadeIn.duration(1000)}
                style={[
                    { alignItems: 'center', justifyContent: 'center' },
                    style,
                ]}
            >
                <Animated.Image 
                    source={require("../assets/images/kairo-logo-gold.png")}
                    style={{ width: 180, height: 180, resizeMode: 'contain' }}
                />
            </Animated.View>

            <Animated.Text entering={FadeIn.delay(500).duration(800)} style={{ color: "#999", marginTop: 24, fontSize: 16, letterSpacing: 1 }}>
                Where Possibilities Become Opportunities
            </Animated.Text>
        </View>
    );
}
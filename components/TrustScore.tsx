import { View, Text } from "react-native";
import Animated, {
    useSharedValue,
    withSpring,
    useAnimatedStyle,
} from "react-native-reanimated";
import { useEffect } from "react";
import { useTrustStore } from "../store/trust-store";

export default function TrustScore() {
    const score = useTrustStore((s) => s.score);
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withSpring(score);
    }, [score]);

    const style = useAnimatedStyle(() => ({
        width: `${progress.value}%`,
    }));

    return (
        <View style={{ marginBottom: 16 }}>
            <Text>Trust Score</Text>

            <View
                style={{
                    height: 10,
                    backgroundColor: "#eee",
                    borderRadius: 20,
                    overflow: "hidden",
                }}
            >
                <Animated.View
                    style={[
                        { height: 10, backgroundColor: "#D4A017" },
                        style,
                    ]}
                />
            </View>

            <Text style={{ fontSize: 12 }}>{Math.round(score)} / 100</Text>
        </View>
    );
}
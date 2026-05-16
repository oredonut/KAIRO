import { View, Text, Pressable } from "react-native";
import { useOnboardingStore } from "../../store/onboarding-store";
import { useTrustStore } from "../../store/trust-store";
import { router } from "expo-router";
import { Palette, Typography, Spacing, Radius } from "@/constants/theme";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Image } from "expo-image";

import * as ImagePicker from 'expo-image-picker';

export default function Work() {
    const { set, workSample } = useOnboardingStore();
    const update = useTrustStore((s: any) => s.update);

    const pickImage = async () => {
        // Request permissions
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Sorry, we need camera roll permissions to make this work!');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            set({ workSample: result.assets[0].uri });
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: Palette.dark[900], padding: Spacing[6], paddingTop: Spacing[12], justifyContent: 'space-between' }}>
            <View>
                <Animated.Text entering={FadeInDown.duration(600)} style={{ color: Palette.gold[500], fontWeight: '900', letterSpacing: 2, fontSize: Typography.size.sm, marginBottom: Spacing[2] }}>
                    STEP 4 OF 5
                </Animated.Text>
                <Animated.Text entering={FadeInDown.delay(100).duration(600)} style={{ fontSize: Typography.size['3xl'], fontWeight: Typography.weight.bold, color: Palette.white.pure, marginBottom: Spacing[2] }}>
                    Show us your work
                </Animated.Text>
                <Animated.Text entering={FadeInDown.delay(150).duration(600)} style={{ color: Palette.dark[300], fontSize: Typography.size.base, marginBottom: Spacing[8] }}>
                    Upload a photo of your goods, stall, or equipment.
                </Animated.Text>

                <Animated.View entering={FadeIn.delay(300).duration(600)}>
                    <Pressable
                        onPress={pickImage}
                        style={({ pressed }) => ({
                            backgroundColor: Palette.dark[800],
                            borderWidth: 2,
                            borderColor: workSample ? Palette.gold[500] : Palette.dark[600],
                            borderStyle: workSample ? 'solid' : 'dashed',
                            borderRadius: Radius['2xl'],
                            height: 200,
                            justifyContent: 'center',
                            alignItems: 'center',
                            opacity: pressed ? 0.8 : 1,
                            overflow: 'hidden'
                        })}
                    >
                        {workSample ? (
                            <Image source={{ uri: workSample }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                            <>
                                <IconSymbol name="camera.fill" size={48} color={Palette.dark[400]} style={{ marginBottom: Spacing[4] }} />
                                <Text style={{ color: Palette.white.pure, fontWeight: '600', fontSize: Typography.size.base }}>
                                    Tap to Upload Photo
                                </Text>
                                <Text style={{ color: Palette.dark[400], fontSize: Typography.size.sm, marginTop: Spacing[1] }}>
                                    JPG or PNG up to 5MB
                                </Text>
                            </>
                        )}
                    </Pressable>
                    {workSample && (
                        <Pressable onPress={() => set({ workSample: null })} style={{ alignSelf: 'center', marginTop: Spacing[2] }}>
                            <Text style={{ color: Palette.gold[500], fontSize: 12, fontWeight: 'bold' }}>Remove Photo</Text>
                        </Pressable>
                    )}
                </Animated.View>
            </View>

            <Animated.View entering={FadeInDown.delay(600).duration(600)} style={{ paddingBottom: Spacing[8] }}>
                <Pressable
                    onPress={() => {
                        update("work");
                        router.push("/onboarding/complete" as any);
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
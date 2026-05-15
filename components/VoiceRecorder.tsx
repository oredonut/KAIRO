import { Audio } from "expo-av";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function VoiceRecorder({ onSave }: any) {
    const [rec, setRec] = useState<Audio.Recording | null>(null);

    const start = async () => {
        const perm = await Audio.requestPermissionsAsync();
        if (!perm.granted) return;

        const recording = new Audio.Recording()
        await recording.prepareToRecordAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

        await recording.startAsync();
        setRec(recording);
    };

    const stop = async () => {
        if (!rec) return;

        await rec.stopAndUnloadAsync();
        const uri = rec.getURI();

        setRec(null);
        onSave(uri);
    };

    return (
        <View>
            <Pressable
                onPress={rec ? stop : start}
                style={{
                    padding: 14,
                    backgroundColor: rec ? "#EF4444" : "#D4A017",
                    borderRadius: 12,
                }}
            >
                <Text style={{ color: "white", textAlign: "center" }}>
                    {rec ? "Stop Recording" : "Start Voice Bio"}
                </Text>
            </Pressable>
        </View>
    );
}
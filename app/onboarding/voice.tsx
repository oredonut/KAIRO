import VoiceRecorder from "@/components/VoiceRecorder";
import { useOnboardingStore } from "../../store/onboarding-store";
import { useTrustStore } from "../../store/trust-store";
import { router } from "expo-router";

export default function Voice() {
    const { set } = useOnboardingStore();
    const update = useTrustStore((s) => s.update);

    return (
        <VoiceRecorder
            onSave={(uri: string) => {
                set({ voiceBio: uri });
                update("voice");
                router.push("/onboarding/work" as any);
            }}
        />
    );
}
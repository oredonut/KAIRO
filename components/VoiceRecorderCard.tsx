/**
 * KAIRO — VoiceRecorderCard
 * ─────────────────────────────────────────────
 * Voice Introduction component (Frontend B — Voice UI)
 *
 * Features:
 *  - Idle / Recording / Reviewing / Saved states
 *  - Animated waveform (Reanimated bars, real metering when recording)
 *  - 60-second max recording with live countdown
 *  - Playback with progress bar
 *  - +15 Trust Score boost badge on save
 *  - Full Kairo design-system tokens
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import { Palette, Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_DURATION_S = 60;
const MIN_DURATION_S = 5;
const BAR_COUNT = 36;
const SCREEN_W = Dimensions.get('window').width;

type RecorderState = 'idle' | 'recording' | 'reviewing' | 'saved';

// ─── Waveform bar seeds (random but stable) ──────────────────────────────────

const SEEDS = Array.from({ length: BAR_COUNT }, (_, i) =>
  0.25 + 0.55 * Math.abs(Math.sin((i + 1) * 2.3))
);

// ─── Single animated bar ─────────────────────────────────────────────────────

interface WaveBarProps {
  index: number;
  state: RecorderState;
  playbackProgress: number; // 0–1 for reviewing state
  metering?: number; // dBFS from Audio.Recording
}

const WaveBar: React.FC<WaveBarProps> = ({ index, state, playbackProgress, metering }) => {
  const anim = useSharedValue(SEEDS[index]);

  useEffect(() => {
    if (state === 'recording') {
      // Idle pulse animation — overridden by real metering below
      const delay = (index / BAR_COUNT) * 400;
      anim.value = withRepeat(
        withSequence(
          withTiming(SEEDS[index] * 0.4, { duration: 300 + delay, easing: Easing.out(Easing.quad) }),
          withTiming(SEEDS[index], { duration: 300, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        true
      );
    } else if (state === 'reviewing') {
      cancelAnimation(anim);
      anim.value = withTiming(SEEDS[index], { duration: 200 });
    } else {
      cancelAnimation(anim);
      anim.value = withTiming(0.15, { duration: 300 });
    }
  }, [state]);

  // Apply real microphone metering when recording
  useEffect(() => {
    if (state !== 'recording' || metering === undefined) return;
    // metering is dBFS: typically -160 (silence) to 0 (max)
    const normalized = Math.max(0, Math.min(1, (metering + 60) / 60));
    const variation = SEEDS[index] * normalized;
    cancelAnimation(anim);
    anim.value = withTiming(Math.max(0.08, variation), { duration: 80 });
  }, [metering, state]);

  const barStyle = useAnimatedStyle(() => {
    // In reviewing state, bars left of playhead are gold, rest are muted
    const fraction = index / BAR_COUNT;
    const isPast = state === 'reviewing' && fraction <= playbackProgress;
    return {
      height: `${Math.round(anim.value * 100)}%`,
      backgroundColor: isPast
        ? Palette.gold[500]
        : state === 'recording'
        ? Palette.gold[400]
        : Colors.light.textMuted,
      opacity: state === 'idle' || state === 'saved' ? 0.35 : 1,
    };
  });

  return (
    <View style={styles.barWrapper}>
      <Animated.View style={[styles.bar, barStyle]} />
    </View>
  );
};

// ─── Pulsing mic ring ─────────────────────────────────────────────────────────

const PulseRing: React.FC<{ active: boolean }> = ({ active }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (active) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.7, { duration: 900, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 0 })
        ),
        -1
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.35, { duration: 100 }),
          withTiming(0, { duration: 800, easing: Easing.out(Easing.quad) })
        ),
        -1
      );
    } else {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      scale.value = withTiming(1, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [active]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.pulseRing, ringStyle]} />;
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface VoiceRecorderCardProps {
  /** Called when user saves their voice intro. Receives the local URI. */
  onSave?: (uri: string) => void;
  /** Called when user deletes a saved recording */
  onDelete?: () => void;
  /** Already-saved URI (if the user has a previous recording) */
  savedUri?: string;
}

export default function VoiceRecorderCard({
  onSave,
  onDelete,
  savedUri,
}: VoiceRecorderCardProps) {
  const [recorderState, setRecorderState] = useState<RecorderState>(
    savedUri ? 'saved' : 'idle'
  );
  const [elapsed, setElapsed] = useState(0);           // seconds recorded
  const [playbackPos, setPlaybackPos] = useState(0);   // 0–1
  const [totalDuration, setTotalDuration] = useState(0); // ms
  const [isPlaying, setIsPlaying] = useState(false);
  const [metering, setMetering] = useState<number>(-160);
  const [recordingUri, setRecordingUri] = useState<string | undefined>(savedUri);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      timerRef.current && clearInterval(timerRef.current);
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const remaining = MAX_DURATION_S - elapsed;

  // ── Recording ───────────────────────────────────────────────────────────────

  const startRecording = useCallback(async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Unload any previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { recording } = await Audio.Recording.createAsync(
        {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
          isMeteringEnabled: true,
        }
      );
      recordingRef.current = recording;

      setElapsed(0);
      setRecorderState('recording');

      // Metering polling
      recording.setOnRecordingStatusUpdate((status) => {
        if (status.metering !== undefined) setMetering(status.metering);
      });

      // Elapsed timer
      timerRef.current = setInterval(async () => {
        setElapsed((prev) => {
          if (prev + 1 >= MAX_DURATION_S) {
            stopRecording();
            return MAX_DURATION_S;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (e) {
      console.warn('[VoiceRecorder] startRecording error:', e);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    timerRef.current && clearInterval(timerRef.current);
    setMetering(-160);

    if (!recordingRef.current) return;
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (uri) {
        setRecordingUri(uri);
        // Load the sound to get duration
        const { sound, status } = await Audio.Sound.createAsync({ uri });
        soundRef.current = sound;
        if (status.isLoaded) setTotalDuration(status.durationMillis ?? 0);
        sound.setOnPlaybackStatusUpdate((s) => {
          if (s.isLoaded) {
            const dur = s.durationMillis ?? 1;
            setPlaybackPos((s.positionMillis ?? 0) / dur);
            setIsPlaying(s.isPlaying);
            if (s.didJustFinish) {
              setIsPlaying(false);
              setPlaybackPos(0);
            }
          }
        });
        setRecorderState('reviewing');
      }
    } catch (e) {
      console.warn('[VoiceRecorder] stopRecording error:', e);
    }
  }, []);

  // ── Playback ────────────────────────────────────────────────────────────────

  const togglePlayback = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) return;
      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        if (status.positionMillis >= (status.durationMillis ?? 0) - 100) {
          await soundRef.current.setPositionAsync(0);
        }
        await soundRef.current.playAsync();
      }
    } catch (e) {
      console.warn('[VoiceRecorder] togglePlayback error:', e);
    }
  }, []);

  // ── Save / Re-record / Delete ────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
    }
    setRecorderState('saved');
    if (recordingUri) onSave?.(recordingUri);
  }, [recordingUri, onSave]);

  const handleReRecord = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    setPlaybackPos(0);
    setIsPlaying(false);
    setRecorderState('idle');
  }, []);

  const handleDelete = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    setRecordingUri(undefined);
    setPlaybackPos(0);
    setIsPlaying(false);
    setElapsed(0);
    setRecorderState('idle');
    onDelete?.();
  }, [onDelete]);

  // ── Derived labels ───────────────────────────────────────────────────────────

  const stateLabel = {
    idle: 'Tap to record your introduction',
    recording: `Recording — ${formatTime(remaining)} left`,
    reviewing: isPlaying ? 'Playing…' : `${formatTime(Math.round((totalDuration / 1000)))} recorded`,
    saved: 'Voice introduction saved',
  }[recorderState];

  const micButtonLabel = {
    idle: '●',
    recording: '■',
    reviewing: isPlaying ? '❙❙' : '▶',
    saved: '▶',
  }[recorderState];

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.card}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Voice Introduction</Text>
          <Text style={styles.subtitle}>30–60 seconds · Seen by employers</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>+15 pts</Text>
        </View>
      </View>

      {/* ── Waveform ── */}
      <View style={styles.waveformContainer}>
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <WaveBar
            key={i}
            index={i}
            state={recorderState}
            playbackProgress={playbackPos}
            metering={recorderState === 'recording' ? metering : undefined}
          />
        ))}
      </View>

      {/* ── State label ── */}
      <Text
        style={[
          styles.stateLabel,
          recorderState === 'saved' && styles.stateLabelSaved,
        ]}
      >
        {stateLabel}
      </Text>

      {/* ── Progress bar (reviewing / saved) ── */}
      {(recorderState === 'reviewing' || recorderState === 'saved') && recordingUri ? (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${playbackPos * 100}%` }]} />
        </View>
      ) : null}

      {/* ── Controls ── */}
      <View style={styles.controls}>

        {/* Mic / play / stop button */}
        <View style={styles.micWrapper}>
          <PulseRing active={recorderState === 'recording'} />
          <Pressable
            onPress={
              recorderState === 'idle'
                ? startRecording
                : recorderState === 'recording'
                ? stopRecording
                : togglePlayback
            }
            style={({ pressed }) => [
              styles.micButton,
              recorderState === 'recording' && styles.micButtonRecording,
              (recorderState === 'reviewing' || recorderState === 'saved') &&
                styles.micButtonPlay,
              pressed && { opacity: 0.82, transform: [{ scale: 0.95 }] },
            ]}
            accessibilityLabel={
              recorderState === 'idle'
                ? 'Start recording'
                : recorderState === 'recording'
                ? 'Stop recording'
                : 'Play recording'
            }
          >
            <Text style={styles.micIcon}>{micButtonLabel}</Text>
          </Pressable>
        </View>

        {/* Secondary actions */}
        {recorderState === 'reviewing' && (
          <View style={styles.secondaryRow}>
            <Pressable
              onPress={handleReRecord}
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}
              accessibilityLabel="Re-record"
            >
              <Text style={styles.secondaryBtnText}>Re-record</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
              accessibilityLabel="Save voice introduction"
            >
              <Text style={styles.saveBtnText}>Save intro</Text>
            </Pressable>
          </View>
        )}

        {recorderState === 'saved' && (
          <View style={styles.secondaryRow}>
            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
              accessibilityLabel="Delete voice introduction"
            >
              <Text style={styles.deleteBtnText}>Delete</Text>
            </Pressable>
            <Pressable
              onPress={handleReRecord}
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}
              accessibilityLabel="Record new introduction"
            >
              <Text style={styles.secondaryBtnText}>New recording</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* ── Duration hint ── */}
      {recorderState === 'idle' && (
        <Text style={styles.hint}>
          Speak about your skills, experience, and what makes you reliable. Employers see this.
        </Text>
      )}

      {/* ── Saved checkmark row ── */}
      {recorderState === 'saved' && (
        <View style={styles.savedRow}>
          <View style={styles.savedDot} />
          <Text style={styles.savedText}>Visible to verified employers</Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const C = Colors.light;

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.backgroundElevated,
    borderRadius: Radius.xl,
    padding: Spacing[5],
    marginHorizontal: Spacing[4],
    ...Shadows.md,
    borderWidth: 1,
    borderColor: C.border,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing[4],
  },
  title: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: C.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: Typography.size.sm,
    color: C.textSecondary,
    marginTop: 2,
  },
  badge: {
    backgroundColor: C.brandLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderWidth: 1,
    borderColor: Palette.gold[300],
  },
  badgeText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: C.brandDark,
  },

  // Waveform
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    gap: 2,
    marginBottom: Spacing[3],
    paddingHorizontal: Spacing[1],
  },
  barWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bar: {
    width: '70%',
    borderRadius: Radius.full,
    minHeight: 3,
  },

  // State label
  stateLabel: {
    fontSize: Typography.size.sm,
    color: C.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing[3],
  },
  stateLabelSaved: {
    color: C.success,
    fontWeight: Typography.weight.medium,
  },

  // Progress bar
  progressTrack: {
    height: 3,
    backgroundColor: C.border,
    borderRadius: Radius.full,
    marginBottom: Spacing[4],
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.brand,
    borderRadius: Radius.full,
  },

  // Controls
  controls: {
    alignItems: 'center',
    gap: Spacing[4],
  },
  micWrapper: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: Palette.gold[400],
  },
  micButton: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.gold,
  },
  micButtonRecording: {
    backgroundColor: Palette.status.errorRed,
  },
  micButtonPlay: {
    backgroundColor: Palette.dark[900],
  },
  micIcon: {
    fontSize: 22,
    color: Palette.white.pure,
    lineHeight: 26,
  },

  // Secondary buttons
  secondaryRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    alignItems: 'center',
  },
  secondaryBtn: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.backgroundCard,
  },
  secondaryBtnText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: C.textSecondary,
  },
  saveBtn: {
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    backgroundColor: C.brand,
    ...Shadows.gold,
  },
  saveBtnText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Palette.white.pure,
  },
  deleteBtn: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Palette.status.errorRed + '60',
    backgroundColor: Palette.status.errorRed + '10',
  },
  deleteBtnText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Palette.status.errorRed,
  },

  // Hint
  hint: {
    fontSize: Typography.size.xs,
    color: C.textMuted,
    textAlign: 'center',
    marginTop: Spacing[3],
    lineHeight: 17,
    paddingHorizontal: Spacing[2],
  },

  // Saved row
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    marginTop: Spacing[3],
  },
  savedDot: {
    width: 7,
    height: 7,
    borderRadius: Radius.full,
    backgroundColor: C.success,
  },
  savedText: {
    fontSize: Typography.size.xs,
    color: C.success,
    fontWeight: Typography.weight.medium,
  },
});

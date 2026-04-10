import { Feather } from "@expo/vector-icons";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radii } from "../constants/theme";

type AudioPlayerProps = {
  audioUrl: string | null;
  reciterName: string;
  segmentStartMs?: number;
  segmentEndMs?: number;
};

function formatSeconds(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(value);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function AudioPlayer({
  audioUrl,
  reciterName,
  segmentStartMs = 0,
  segmentEndMs,
}: AudioPlayerProps) {
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const player = useAudioPlayer(audioUrl ? { uri: audioUrl } : null, {
    updateInterval: 250,
    keepAudioSessionActive: true,
  });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "doNotMix",
      shouldPlayInBackground: false,
    });
  }, []);

  useEffect(() => {
    if (!audioUrl) {
      setPlaybackError(null);
      return;
    }

    player.pause();
    player.replace(audioUrl);
    setPlaybackError(null);
    void player.seekTo(segmentStartMs / 1000);
  }, [audioUrl, player, segmentStartMs]);

  useEffect(() => {
    if (!segmentEndMs || !status.playing) {
      return;
    }

    if (status.currentTime >= segmentEndMs / 1000) {
      player.pause();
    }
  }, [player, segmentEndMs, status.currentTime, status.playing]);

  const segmentStartSeconds = segmentStartMs / 1000;
  const segmentEndSeconds = segmentEndMs ? segmentEndMs / 1000 : status.duration;
  const segmentDuration = Math.max(segmentEndSeconds - segmentStartSeconds, 0);
  const elapsedSeconds = Math.max(status.currentTime - segmentStartSeconds, 0);
  const progress = segmentDuration > 0 ? Math.min(elapsedSeconds / segmentDuration, 1) : 0;

  function handleTogglePlayback() {
    if (!audioUrl) {
      setPlaybackError("Audio is not available for this ayah yet.");
      return;
    }

    if (status.playing) {
      player.pause();
      return;
    }

    const shouldRestart =
      segmentEndSeconds > 0 && status.currentTime >= segmentEndSeconds;

    if (shouldRestart || status.currentTime < segmentStartSeconds) {
      void player.seekTo(segmentStartSeconds);
    }

    if (!status.isLoaded && !status.isBuffering) {
      setPlaybackError("Audio is still loading. Try again in a moment.");
      return;
    }

    setPlaybackError(null);
    player.play();
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <View style={[styles.progress, { width: `${progress * 100}%` }]} />
      </View>
      <View style={styles.row}>
        <Pressable
          onPress={handleTogglePlayback}
          style={[
            styles.button,
            !audioUrl && styles.buttonDisabled,
          ]}
        >
          <Feather
            name={status.playing ? "pause" : "play"}
            size={16}
            color={colors.textInverse}
          />
          <Text style={styles.buttonLabel}>
            {status.playing ? "Pause" : "Play"}
          </Text>
        </Pressable>
        <View style={styles.meta}>
          <Text style={styles.reciter}>{reciterName}</Text>
          <Text style={styles.time}>
            {status.isBuffering
              ? "Buffering audio..."
              : `${formatSeconds(elapsedSeconds)} / ${formatSeconds(segmentDuration)}`}
          </Text>
          {playbackError ? (
            <Text style={styles.errorText}>{playbackError}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  track: {
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.bgPrimary,
    overflow: "hidden",
  },
  progress: {
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.accentPrimary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: radii.full,
    backgroundColor: colors.accentPrimary,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonLabel: {
    color: colors.textInverse,
    fontWeight: "700",
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  reciter: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
  time: {
    color: colors.textMuted,
    fontSize: 12,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
  },
});

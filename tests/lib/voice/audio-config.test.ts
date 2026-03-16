import { describe, expect, it } from "vitest";
import {
  AUDIO_SAMPLE_RATE,
  AUDIO_CHANNEL_COUNT,
  getMediaConstraints,
} from "@/lib/voice/audio-config";

describe("audio-config", () => {
  it("exports a 16 kHz sample rate for Google STT", () => {
    expect(AUDIO_SAMPLE_RATE).toBe(16_000);
  });

  it("exports mono channel count", () => {
    expect(AUDIO_CHANNEL_COUNT).toBe(1);
  });

  describe("getMediaConstraints", () => {
    it("returns constraints with video disabled", () => {
      const constraints = getMediaConstraints();
      expect(constraints.video).toBe(false);
    });

    it("enables autoGainControl for soft-spoken users", () => {
      const { audio } = getMediaConstraints();
      expect((audio as MediaTrackConstraints).autoGainControl).toBe(true);
    });

    it("enables noiseSuppression for background noise", () => {
      const { audio } = getMediaConstraints();
      expect((audio as MediaTrackConstraints).noiseSuppression).toBe(true);
    });

    it("enables echoCancellation for loudspeaker feedback", () => {
      const { audio } = getMediaConstraints();
      expect((audio as MediaTrackConstraints).echoCancellation).toBe(true);
    });

    it("sets sampleRate to AUDIO_SAMPLE_RATE (16 kHz)", () => {
      const { audio } = getMediaConstraints();
      expect((audio as MediaTrackConstraints).sampleRate).toBe(16_000);
    });

    it("sets channelCount to AUDIO_CHANNEL_COUNT (mono)", () => {
      const { audio } = getMediaConstraints();
      expect((audio as MediaTrackConstraints).channelCount).toBe(1);
    });

    it("returns a fresh object on each call (no shared state)", () => {
      const a = getMediaConstraints();
      const b = getMediaConstraints();
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });
});

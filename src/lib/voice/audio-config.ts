/** Google Cloud STT optimal sample rate. */
export const AUDIO_SAMPLE_RATE = 16_000;

/** Mono — single-speaker STT needs one channel. */
export const AUDIO_CHANNEL_COUNT = 1;

/**
 * `MediaStreamConstraints` for speech capture in noisy eldercare environments.
 *
 * - `autoGainControl`  — normalises volume for soft-spoken users.
 * - `noiseSuppression` — attenuates steady-state background noise.
 * - `echoCancellation` — removes loudspeaker feedback loops.
 * - `sampleRate`       — 16 kHz (Google STT preferred input).
 * - `channelCount`     — mono for single-speaker STT.
 */
export function getMediaConstraints(): MediaStreamConstraints {
  return {
    audio: {
      autoGainControl: true,
      noiseSuppression: true,
      echoCancellation: true,
      sampleRate: AUDIO_SAMPLE_RATE,
      channelCount: AUDIO_CHANNEL_COUNT,
    },
    video: false,
  };
}

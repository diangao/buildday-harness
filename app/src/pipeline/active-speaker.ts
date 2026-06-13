/**
 * Active-speaker scorer: of the visible faces, pick whose mouth motion best
 * matches recent speech. v0: marks the single highest lip-open face active.
 * TODO(fable): correlate lip-open time-series with audio energy envelope
 * (audio-visual sync) for robust multi-face attribution.
 */
import type { ActiveSpeakerScorer } from './caption-surface-source';
import type { SpeakerState } from '../types/caption-surface';

export class MouthMotionActiveSpeaker implements ActiveSpeakerScorer {
  score(speakers: SpeakerState[], _nowMs: number): SpeakerState[] {
    if (speakers.length === 0) return speakers;
    let best = speakers[0];
    for (const s of speakers) if (s.activityScore > best.activityScore) best = s;
    return speakers.map((s) => ({ ...s, active: s.speakerId === best.speakerId && best.activityScore > 0.2 }));
  }
}

/**
 * Face tracking + mouth-openness via MediaPipe FaceLandmarker.
 * v0 status: stub that returns no faces until the model is wired; the
 * Pipeline still runs (captions flow unanchored — see no-camera/no-face
 * fallback: CaptionEvent.speakerId stays null). TODO(fable): load
 * FaceLandmarker, map each face to a stable speakerId, compute lip-open
 * ratio (landmark 13↔14 vs face height) → expose as activityScore input.
 */
import type { FaceTracker } from './caption-surface-source';
import type { SpeakerState } from '../types/caption-surface';

export class MediaPipeFaceTracker implements FaceTracker {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(_video: HTMLVideoElement, _nowMs: number): SpeakerState[] {
    return []; // no faces yet → unanchored captions (degraded mode), by design
  }
}

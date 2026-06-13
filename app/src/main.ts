/**
 * v0 wiring: pipeline → a minimal caption render so the app runs end-to-end.
 * codex's room-aware Surface UI (#92) replaces the minimal render below;
 * it consumes the same `CaptionSurfaceSource` event stream.
 */
import { Pipeline } from './pipeline/caption-surface-source';
import { WebSpeechAsr } from './pipeline/asr-webspeech';
import { MediaPipeFaceTracker } from './pipeline/face-tracker-mediapipe';
import { MouthMotionActiveSpeaker } from './pipeline/active-speaker';

const root = document.getElementById('app')!;
root.innerHTML = `
  <button id="start">Start room captions</button>
  <div id="captions" aria-live="polite"></div>
`;

const pipeline = new Pipeline({
  faceTracker: new MediaPipeFaceTracker(),
  activeSpeaker: new MouthMotionActiveSpeaker(),
  asr: new WebSpeechAsr('en-US'),
});

const captionsEl = document.getElementById('captions')!;
pipeline.subscribe((ev) => {
  if (ev.type === 'caption' && ev.caption.isFinal) {
    const line = document.createElement('p');
    const who = ev.caption.speakerId ?? 'unattributed';
    line.textContent = `[${who}] ${ev.caption.text}`;
    captionsEl.appendChild(line);
  }
});

document.getElementById('start')!.addEventListener('click', () => {
  pipeline.start().catch((e) => alert(`Pipeline failed: ${e.message}`));
});

/**
 * CaptionSurfaceSource — the real-time pipeline core (fable, tasks #90/#91).
 *
 * Wires: camera + mic → face tracking → active-speaker attribution → ASR →
 * attributed CaptionEvents, exposed via the CaptionSurfaceSource contract.
 *
 * This is the headless engine. Renderers (codex UI, jett verifier overlay)
 * depend only on the typed event stream, never on the internals here.
 *
 * Status: event bus + lifecycle are real; the camera/face/ASR modules are
 * wired as injectable stages so each can be filled/swapped independently.
 */
import type {
  CaptionEvent,
  CaptionSurfaceEvent,
  CaptionSurfaceListener,
  CaptionSurfaceSource,
  CaptionSurfaceState,
  EnvSound,
  PipelineHealth,
  SpeakerState,
} from '../types/caption-surface';

/** A vision stage: from a video frame, return current tracked speakers. */
export interface FaceTracker {
  /** Update tracks from the latest frame; returns current speakers. */
  update(video: HTMLVideoElement, nowMs: number): SpeakerState[];
}

/** Active-speaker scorer: given speakers + recent audio energy, pick who's talking. */
export interface ActiveSpeakerScorer {
  /** Annotate `active`/`activityScore` on speakers for this frame. */
  score(speakers: SpeakerState[], nowMs: number): SpeakerState[];
}

/** ASR stage: streams interim/final transcript chunks via callback. */
export interface AsrStream {
  start(onChunk: (text: string, isFinal: boolean, confidence: number) => void): Promise<void>;
  stop(): void;
}

let _seq = 0;
const uid = (p: string) => `${p}-${++_seq}`;

export interface PipelineDeps {
  faceTracker: FaceTracker;
  activeSpeaker: ActiveSpeakerScorer;
  asr: AsrStream;
  /** Optional clock injection for deterministic tests. */
  now?: () => number;
}

export class Pipeline implements CaptionSurfaceSource {
  private listeners = new Set<CaptionSurfaceListener>();
  private state: CaptionSurfaceState = {
    speakers: [],
    captions: [],
    envSounds: [],
    health: { cameraOk: false, micOk: false, faceCount: 0, asrLatencyMs: 0, visionFps: 0 },
  };
  private video: HTMLVideoElement | null = null;
  private rafId = 0;
  private running = false;
  private lastFrameTs = 0;
  private now: () => number;

  constructor(private deps: PipelineDeps) {
    this.now = deps.now ?? (() => Date.now());
  }

  subscribe(listener: CaptionSurfaceListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): CaptionSurfaceState {
    return this.state;
  }

  private emit(event: CaptionSurfaceEvent) {
    for (const l of this.listeners) l(event);
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    // 1. Camera + mic.
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    await video.play();
    this.video = video;
    this.setHealth({ cameraOk: true, micOk: true });

    // 2. ASR → attribute each chunk to the current active speaker.
    await this.deps.asr.start((text, isFinal, confidence) => {
      const active = this.state.speakers.find((s) => s.active) ?? null;
      const caption: CaptionEvent = {
        id: uid('cap'),
        ts: this.now(),
        speakerId: active?.speakerId ?? null,
        faceBox: active?.faceBox ?? null,
        text,
        isFinal,
        confidence,
        attributionConfidence: active?.activityScore ?? 0,
      };
      if (isFinal) this.state.captions = [...this.state.captions, caption];
      this.emit({ type: 'caption', caption });
    });

    // 3. Vision loop: face tracking + active-speaker scoring per frame.
    const loop = () => {
      if (!this.running || !this.video) return;
      const t = this.now();
      let speakers = this.deps.faceTracker.update(this.video, t);
      speakers = this.deps.activeSpeaker.score(speakers, t);
      this.state.speakers = speakers;
      this.emit({ type: 'speakers', speakers });

      const dt = t - this.lastFrameTs;
      if (dt > 0) this.setHealth({ faceCount: speakers.length, visionFps: Math.round(1000 / dt) });
      this.lastFrameTs = t;
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.deps.asr.stop();
    const tracks = (this.video?.srcObject as MediaStream | null)?.getTracks() ?? [];
    tracks.forEach((tr) => tr.stop());
    this.video = null;
  }

  /** Allow the env-sound lane (mythos) to push EnvSound into the same stream. */
  pushEnvSound(sound: EnvSound): void {
    this.state.envSounds = [...this.state.envSounds, sound];
    this.emit({ type: 'envSound', sound });
  }

  private setHealth(patch: Partial<PipelineHealth>) {
    this.state.health = { ...this.state.health, ...patch };
    this.emit({ type: 'health', health: this.state.health });
  }
}

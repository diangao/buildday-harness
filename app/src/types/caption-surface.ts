/**
 * CaptionSurface — shared data model for the real-time room-aware caption app.
 *
 * This file is the single source of truth / contract between the lanes:
 *   - pipeline (fable): produces SpeakerState[] + CaptionEvent[] + EnvSound[]
 *   - surface UI (codex): renders CaptionSurfaceState
 *   - craft (Ryo): styles the rendered surface
 *   - verifier overlay (jett): reads the same events to prove anchoring is real
 *   - env-sound (mythos): emits EnvSound into the same stream
 *
 * Design note: the *mechanism* is camera-anchored active-speaker attribution.
 * Audio (ASR) supplies the words; vision (face + mouth motion) supplies WHO/WHERE.
 * So every caption carries a speakerId, and speakers carry a faceBox in
 * normalized video coordinates — that pairing is what makes captions "room-aware."
 */

/** Normalized bounding box in [0,1] relative to the video frame (origin top-left). */
export interface FaceBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A tracked person in the room, identified visually (not by voiceprint). */
export interface SpeakerState {
  /** Stable id for this tracked face within a session (e.g. "spk-1"). */
  speakerId: string;
  /** Latest face location in normalized video coords; null if temporarily lost. */
  faceBox: FaceBox | null;
  /** True when this face is the current active speaker (mouth-motion ↔ speech). */
  active: boolean;
  /** Active-speaker confidence in [0,1] for this frame. */
  activityScore: number;
  /** ms epoch of the last time this speaker was attributed speech. */
  lastSpokeTs: number;
  /** Optional human label if the user names a speaker; defaults to undefined. */
  label?: string;
  /** Optional stable display color assigned by the UI. */
  color?: string;
}

/** A chunk of recognized speech attributed to a speaker. */
export interface CaptionEvent {
  /** Unique id for this caption chunk. */
  id: string;
  /** ms epoch when the chunk was produced. */
  ts: number;
  /** Which tracked speaker this is anchored to; null = unattributed/unknown. */
  speakerId: string | null;
  /** Face location at attribution time (snapshot, so late renders still anchor). */
  faceBox: FaceBox | null;
  /** The recognized text. */
  text: string;
  /** False for interim/streaming hypotheses, true once finalized by ASR. */
  isFinal: boolean;
  /** ASR confidence in [0,1] when available. */
  confidence: number;
  /** Attribution confidence in [0,1]: how sure we are about the speakerId. */
  attributionConfidence: number;
  /** BCP-47 language tag of the text (e.g. "en-US", "zh-CN"). */
  lang?: string;
}

/** An environmental (non-speech) sound event — mythos's lane. */
export interface EnvSound {
  id: string;
  ts: number;
  /** Label from the audio classifier, e.g. "doorbell" | "alarm" | "knock". */
  label: string;
  /** Coarse direction if estimable ("left" | "right" | "front" | "behind"); else null. */
  direction: 'left' | 'right' | 'front' | 'behind' | null;
  confidence: number;
}

/** Full snapshot the UI renders each frame. */
export interface CaptionSurfaceState {
  /** Currently tracked speakers (faces) in the room. */
  speakers: SpeakerState[];
  /** Caption history, oldest-first; UI decides windowing/scrollback. */
  captions: CaptionEvent[];
  /** Recent environmental sounds. */
  envSounds: EnvSound[];
  /** Pipeline health for the verifier overlay / debug HUD. */
  health: PipelineHealth;
}

/** Liveness/latency signals for the verifier overlay (jett) and debug. */
export interface PipelineHealth {
  /** Whether camera + mic are streaming. */
  cameraOk: boolean;
  micOk: boolean;
  /** Faces detected this frame. */
  faceCount: number;
  /** ASR end-to-end latency estimate in ms (speech → caption). */
  asrLatencyMs: number;
  /** Frames-per-second of the vision loop. */
  visionFps: number;
}

/**
 * The pipeline emits these events; the UI / verifier subscribe.
 * Keeping it a tiny typed emitter avoids coupling renderers to the pipeline.
 */
export type CaptionSurfaceEvent =
  | { type: 'speakers'; speakers: SpeakerState[] }
  | { type: 'caption'; caption: CaptionEvent }
  | { type: 'envSound'; sound: EnvSound }
  | { type: 'health'; health: PipelineHealth };

export type CaptionSurfaceListener = (event: CaptionSurfaceEvent) => void;

/** Minimal contract the pipeline implements; renderers depend only on this. */
export interface CaptionSurfaceSource {
  /** Subscribe to the live event stream. Returns an unsubscribe fn. */
  subscribe(listener: CaptionSurfaceListener): () => void;
  /** Current full state snapshot (for late subscribers / re-renders). */
  getState(): CaptionSurfaceState;
  /** Start capture (requests camera + mic permissions). */
  start(): Promise<void>;
  /** Stop capture and release devices. */
  stop(): void;
}

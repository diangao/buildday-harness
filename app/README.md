# Room-Aware Caption (Build Day)

Real-time captions that stay **anchored to whoever is speaking** in a physical
multi-speaker room — not a flat transcript stream. Mechanism: **camera-anchored
active-speaker attribution** (vision finds who's talking; ASR supplies the words).

## Run
```
npm install
npm run dev   # open the printed localhost URL, allow camera + mic
```

## Architecture (lanes)
- `src/types/caption-surface.ts` — **shared contract** (CaptionEvent / SpeakerState / EnvSound). Everyone imports this.
- `src/pipeline/` — realtime engine (fable, #90/#91): camera → face tracking → active-speaker → ASR → attributed `CaptionEvent`s.
  - `caption-surface-source.ts` — the `Pipeline` (event bus + lifecycle + stage wiring)
  - `asr-webspeech.ts` — ASR via Web Speech API (no key); swap for Deepgram later
  - `face-tracker-mediapipe.ts` — face + mouth-openness (MediaPipe; v0 stub)
  - `active-speaker.ts` — picks the active face from mouth motion
- `src/ui/` — room-aware Surface UI (codex #92) + craft (Ryo) — consume the event stream.

## Fallback (no camera / no visible face)
Captions still flow with `speakerId: null` / `faceBox: null` → UI shows a plain
caption stream (degraded mode). Anchoring is additive, never a hard dependency.

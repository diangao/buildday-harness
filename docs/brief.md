# Build Brief

Status: direction locked; implementation in progress.

## Project Direction

Build a phone-first, real-time room-aware caption surface for Deaf, deaf/hard-of-hearing, and late-deafened caption users in live multi-speaker physical spaces.

Flat captions answer "what was said." This project also shows who said it, where it came from, and keeps the room context available after the words have passed.

Day-one mechanism: camera-assisted active-speaker anchoring. The browser sees faces, estimates mouth/activity over time, receives caption chunks from audio, and attaches each chunk to the likely visible speaker position. Glasses and meeting plugins are future renderers/adapters, not day-one dependencies.

## Problem

Captions are an important access surface, but live physical rooms break the flat-caption model:

- A classroom, clinic, meeting room, or group discussion cannot be slowed to 0.8x or rewound.
- A single caption stream collapses multiple people into one line of text.
- Speaker identity, position, interruptions, overlap, and environmental sounds are lost.
- Captions that disappear quickly do not support users who need to reread, compare speakers, or recover context after falling behind.

The core problem is not that Deaf or HoH users cannot read captions. The problem is that flat disappearing captions fail in live rooms.

## User / Audience

Primary audience:

- DHH, hard-of-hearing, and late-deafened users who already use captions but lose room awareness in live multi-speaker spaces.

Strongest initial settings:

- hybrid meetings where the DHH participant is remote and needs to know which in-room person is speaking
- hybrid or mainstream classrooms where multiple in-room speakers collapse into one caption stream
- small group discussions or huddles with two to four visible speakers
- tutoring or classroom group work
- clinic or school office conversations
- family or round-table conversations

The system should not claim to serve every Deaf user, assume that DHH users are primarily in special schools, or replace ASL interpreters. It is a room-context layer for caption users in mainstream, hybrid, and small physical room settings.

Failure boundaries:

- It is not useful for hallway or walking conversations where a camera cannot see speakers.
- It has limited value for simple one-on-one conversations where speaker attribution is obvious.
- It degrades in poor lighting, bad camera placement, or when speakers are turned away.
- It needs a device that can see the room and hear speech.

## Modes And Scope

Day-one core mode:

- `Room captions`: camera-visible speakers, live captions, active-speaker anchoring, persistent per-speaker scrollback.

Fallback mode:

- `No camera`: transcript and speaker lanes can still render, but attribution is unknown or low confidence. This is graceful degradation, not the main wedge.

Future optional mode:

- `ASL support`: off by default in the MVP. A safe version is an adapter slot for an existing human interpreter feed, signer-facing layout, or external sign-support system. Auto-ASL interpretation or generation is experimental/future only and should not be a Build Day v0 claim.

The valuable first use case is a small physical room where speakers are visible and flat captions lose who said what. The project does not need to handle every audio-only or signer-first setting on day one.

## One-Minute Demo Shape

1. Open a standalone companion web app on a phone or laptop.
2. Grant camera and microphone access.
3. Point the camera at two or three visible speakers.
4. As people speak, captions attach to speaker bubbles near their face/position instead of flowing through one flat transcript.
5. Overlapping turns stay separated by speaker lane.
6. Scrollback remains available per speaker.
7. A debug overlay shows face boxes, active-speaker confidence, caption latency, and speaker-match decisions so the mechanism is visible and not just a mock UI.

Success condition:

- The demo proves that camera-based anchoring is real: a caption chunk is visibly attached to the active face/position, and the user can recover who said what after the room moved on.

## Architecture

Keep the implementation split around a shared event stream:

```ts
type CaptionEvent = {
  id: string;
  ts: number;
  speakerId: string;
  faceBox?: { x: number; y: number; w: number; h: number };
  text: string;
  isFinal: boolean;
  confidence: number;
  language?: string;
};

type SpeakerState = {
  speakerId: string;
  faceBox?: { x: number; y: number; w: number; h: number };
  active: boolean;
  lastSpokeTs?: number;
};

type EnvSound = {
  ts: number;
  label: string;
  direction?: string;
  confidence: number;
};
```

Planned adapters/renderers:

- `CameraAdapter`: day-one source; face tracking and mouth/activity signals.
- `AudioCaptionAdapter`: day-one source; ASR caption chunks and timestamps.
- `PhoneSurface`: day-one renderer; 2D room/radar speaker bubbles and persistent lanes.
- `DebugOverlay`: day-one trust surface; face boxes, confidence, latency, and match decisions.
- `MeetingAdapter`: future adapter for Meet/Zoom-style sources.
- `GlassSurface`: future renderer for AR glasses.

## Public Sources

- National Deaf Center: captioned media is an accessibility resource for deaf students: <https://nationaldeafcenter.org/resource-items/captioned-media/>
- National Deaf Center: automatic captions can fail as effective access when accuracy is low or timing is poor: <https://nationaldeafcenter.org/resource-items/automatic-captions/>
- National Deaf Center: DHH diversity and terminology: <https://nationaldeafcenter.org/resources/deaf-awareness/>
- IES reading instruction center for deaf and hard-of-hearing students: <https://ies.ed.gov/use-work/awards/special-education-research-and-development-center-reading-instruction-deaf-and-hard-hearing-students>
- Sign language interpreter classroom context from NDC: <https://nationaldeafcenter.org/wp-content/uploads/2019/04/Sign-Language-Interpreters-in-the-Classroom.pdf>

## Non-Goals

- Do not build or claim to build an ASL interpreter.
- Do not claim that Deaf users cannot read captions.
- Do not use exact literacy percentages in public pitch unless they are tightly sourced.
- Do not make video or YouTube captions the primary wedge; recorded media can be paused, slowed, and rewound.
- Do not make a dashboard the main feature.
- Do not rely on AR glasses, Zoom/Meet plugins, voiceprints, or microphone direction-of-arrival as day-one dependencies.
- Do not include private transcripts.
- Do not include credentials, tokens, private emails, or personal data.
- Do not import assumptions from older private project history unless rewritten as public-safe requirements.

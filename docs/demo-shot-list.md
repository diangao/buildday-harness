# Demo Shot List

This file proposes the structure for the 30-60 second submission video. It exists as a craft artifact so all build lanes can converge on the same demo arc and so the implementation session can produce a video that lands the project's core claim.

## Project Claim (one line)

Flat captions tell you what was said. We restore who said it and where it came from when a phone or laptop sees the room.

## Target Scenario for the Demo

A hybrid meeting or hybrid classroom with multiple in-person speakers and one remote or accommodation-needing participant who reads captions. The camera-equipped device sits on the table or desk, sees three to four speakers in frame, and the participant reads the captions on the same device or on a connected screen.

This is the strongest single use case because it is the setting where flat-stream captions visibly collapse multiple speakers into one undifferentiated text feed, and where the audience can grasp the loss in a single shot.

## Video Arc (30 second target)

### 0:00 to 0:05 — Frame the problem

A small meeting around a table, three or four people. Cut to the screen of an existing flat caption tool. Captions appear as a single stream. No speaker labels. No spatial information. A new line replaces the old line every two seconds.

The viewer should see immediately that this is the wrong shape for a multi-person conversation.

### 0:05 to 0:10 — Show the surface change

Cut to the same room, same conversation. Pan to our companion web app open on a phone or laptop on the table. Face boxes appear over each visible speaker. The active speaker's face gets a soft highlight.

### 0:10 to 0:15 — Anchored captions, single speaker

One person speaks. Their caption appears as a phrase chunk anchored to their face position. The caption stays on screen.

### 0:15 to 0:20 — Multi-speaker overlap, parallel lanes

Two people speak in overlap or quick succession. Their captions appear in two visually distinct lanes, each tied to its speaker. The captions do not merge into one stream.

### 0:20 to 0:25 — Environmental cue

A doorbell or a knock happens off-camera. An environmental sound tag appears as a separate visual element with a direction hint, distinct from the speaker captions. The viewer perceives that the room itself is being read, not just the speech.

### 0:25 to 0:30 — Close on the claim

Cut to the project name and the one-line claim. Optional: scrollback gesture on the device shows that previous captions are persistent, not lost.

## Visual Rules for the Demo

These rules keep the demo coherent with the design principles file.

- Anchored captions must visibly track the speaker's face. Static caption cards that float free break the claim of the project. Pin the caption visibly to the face box.
- Each speaker keeps the same lane color or position for the duration of the demo. Color does not carry meaning beyond identity; it is not a status signal.
- The active speaker highlight is a soft outline or a small accent, not a hard fill. The default treatment is restrained.
- Typography in the demo follows the design principles file: Atkinson Hyperlegible for body captions, minimum sixteen pixels, line height one and a half.
- The environmental sound tag has its own visual register, distinct from caption text. It uses an icon plus a short label. It does not appear in line with speech captions.
- The verifier or debug overlay is off in the demo cut. If we want to prove the mechanism, we cut a separate short clip with the overlay on, showing face boxes and confidence numbers, and label it as the developer view.

## Craft Pass Checklist for the Final Cut

Before publishing, the implementation session should review the cut against this checklist.

1. Does the first five seconds frame the problem without narration?
2. Does the second five seconds visually demonstrate the surface change?
3. Are at least two speakers shown with two distinct caption lanes by the twenty-second mark?
4. Does an environmental event appear in its own visual register?
5. Is the closing claim short and specific to the hybrid-room scenario?
6. Are all on-screen text elements at the minimum size and contrast specified in the design principles file?
7. Does any text appear in template prose, productivity vocabulary, or low-power positioning? If so, rewrite.

## Honest Scope Note

The demo should not promise universal accessibility coverage. It should show the specific scenario the project solves: a camera-equipped device positioned to see a multi-person room. Walking around, phone in pocket, single-speaker broadcast, and similar scenarios are not in scope for the demo and are not in scope for the v0 product.

## Pre-Recording Production Notes

Items to prepare before the recording session.

- A small room with three or four people willing to be in frame.
- The companion web app deployed to a URL that can be opened from the test device.
- A doorbell, knock, or similar non-speech sound available to trigger the environmental tag clip.
- A clip of an existing flat-stream caption tool on the same hardware for the opening contrast.
- A clean cut of the project name and claim text rendered in the demo's typography.

## After the 30-second Cut

If a longer cut is required, additional sections may follow in this order: a scrollback demonstration, a second scenario, and a short debug-overlay clip. The 30-second version is the canonical submission cut.

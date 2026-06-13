# Design Principles

This file collects design-direction taste as reusable build criteria for any
interactive accessibility artifact the implementation session may build. It
sits next to `docs/taste-rubric.md`, which covers craft-review heuristics; this
file covers prescriptive design-direction rules.

Use it as a checklist when laying out a UI surface, writing user-facing copy,
choosing typography, or deciding how a control should appear and behave.

## Information surface affordance

An accessibility tool delivers an information surface to a user. Match the
surface form to the content shape and to the user's action need.

- A live stream of speech belongs on a streaming surface; a snapshot of
  structured fields belongs on a board; a long-form translated essay belongs
  on a reading-list surface.
- Each surface needs its own chrome. A streaming surface needs a time rail;
  a board needs filter and sort chips; a reading-list needs scroll position
  memory.
- A surface that announces a new affordance must follow through. If captions
  appear to anchor to a face, they must actually move with the face. If a
  card appears to be a saved item, it must persist after refresh. False
  affordances are a worse failure than missing affordances.

## Three craft restraints

Apply each rule to every interactive element on every screen the tool ships.

1. **Unique deep color marks the anchor.** Reserve a single deep gradient or
   saturated dark block for one element only: the primary visual anchor of
   the surface. Duplicating the deep color in secondary places dilutes the
   anchor and reads as decoration.
2. **Active state is never a hard fill.** Active tabs, chips, and selected
   items use a thin outline plus a soft accent tint. The default state is
   flat white or transparent. Hard solid color fills break restraint and
   read as Material-toolkit chrome rather than as restraint craft.
3. **Semantic color attaches only to numeric deltas.** Red and green are
   reserved for percentage or count changes that carry success or warning
   meaning. Do not apply semantic color to chips, borders, tags, or surface
   backgrounds. Reserve the contrast for actual data signal.

## Typography and readability

Optimize for users who read slowly, read in their second language, or read
in less-than-ideal conditions.

- Use a typeface designed for accessibility on body text. Atkinson
  Hyperlegible is a strong default for English; pair it with a humanist
  sans-serif (Noto Sans SC, PingFang) for Chinese.
- Body text minimum 16 pixels, line height 1.5, measure 38 to 60
  characters per line. Do not push these for density.
- Tabular numerals for any column of numbers. Use
  `font-variant-numeric: tabular-nums`.
- Do not center body paragraphs; centered text breaks return scan.
- High contrast: text against background at WCAG AA 4.5 to 1 minimum, AAA 7
  to 1 when feasible. Test the dark mode and any colored-background mode
  with a contrast checker, not by visual estimation.

## Caption-specific principles

When the user is reading captions during live spoken interaction, the
captions are an attention surface, not a transcript log. Design for that.

- Chunk by phrase, around five to seven words per caption unit. Do not
  print sentence-long captions. Phrase-chunking matches the user's eye
  saccade and gives slow readers re-read points.
- Captions are persistent until the user dismisses them or scrolls past
  them. Do not disappear after a fixed timer. Slow readers fall behind a
  disappearing stream and lose context.
- Each speaker has a stable visual lane on the surface. When a new
  speaker speaks, their captions appear in a distinct lane, not in line
  with the prior speaker. Overlapping speech becomes parallel lanes, not
  merged stream.
- Anchor captions to a perceptible position in user space. On a phone
  screen, anchor to the speaker's face in the camera view. On a future
  augmented-reality surface, anchor to the speaker's position in 3D
  space. The anchor must follow the speaker, not float free.
- Environmental sound events (doorbell, alarm, knock, fire alarm) appear
  as a separate visual tag with a directional hint. They are not mixed
  into the caption stream.

## Persistence and ephemerality

Different parts of an accessibility surface have different time horizons.
Express the horizon in the visual treatment.

- Truly transient information (current speaker indicator, latency
  meter, current line being spoken) uses motion or temporary highlight.
- Short-term information (last several captions, recent environmental
  events) sits in the main reading surface and remains until the user
  acts.
- Long-term information (the full transcript of the current
  conversation, saved captions the user starred) is accessible through a
  scrollback or history surface that does not auto-clear.

The same data may need to appear in two of these horizons at once.
Design the surface to express the horizon, not to choose one for the
user.

## Writing methodology

User-facing copy in this tool follows three rules.

1. **Fix, do not delete.** When a sentence reads as auto-generated or as
   template prose, rephrase it in the project's voice rather than
   removing it. Deletion is justified only when the next sentence
   already carries the thought, or when a factual claim is exposed that
   the project should not make.
2. **No low-power positioning.** The user is an operator, a builder, a
   decision-maker. The user is not a job-seeker, a student, an applicant,
   or someone under evaluation. Even when the tool is asking for input,
   frame the input as the user directing the tool, not requesting from
   it.
3. **No corporate or productivity-copy vocabulary.** Phrases like "OKR",
   "leverage point", "common sense powerhouse", "What emerges is",
   "Looking back, X years later", and similar template prose belong in
   marketing decks, not in this project's copy. When such a phrase
   appears, rephrase in plain English while preserving the thought.

## Restraint over feature density

For a tool whose user reads it under cognitive load (low literacy, second
language, real-time pressure, accessibility need), every visible element
costs cognitive budget.

- Default to the most restrained form of any control: text-only label
  over icon plus label; transparent background over filled background;
  text-only state toggle over switch widget; hover tooltip over
  always-visible label.
- A control whose user touches it once a session and never again should
  be hidden in chrome rather than visible by default. A control whose
  user needs every second should be persistent and large.
- A surface that contains five elements is almost always clearer than a
  surface that contains seven. When tempted to add a sixth element,
  consider what to remove instead.

## Verifier surface (optional)

If the project ships a debug or verifier surface that proves the system
is working correctly, that surface follows different rules than the
main user surface.

- Verifier output is dense by design. Show structured data: bounding
  boxes, confidence scores, latency numbers, source-target diffs.
- Verifier surface is toggleable, off by default in production demo and
  on by default in development.
- Verifier visual style uses muted color and monospace font, distinct
  from the user surface, so it reads as instrumentation rather than as
  product surface.

## How to use this rubric

When designing or implementing any user-facing surface during this
build:

1. Identify the content shape and pick the surface form that matches.
2. Apply the three craft restraints to every interactive element.
3. Choose typography from the readability section; verify contrast and
   measure.
4. If the surface includes live spoken content, apply the
   caption-specific principles.
5. Mark each element with its time horizon and design the visual
   treatment accordingly.
6. Run user-facing copy through the three writing rules.
7. Strip any element that does not carry a unique fact or save the user
   a step.

When a project constraint requires deviating from any rule above, write
the deviation and its justification in `docs/brief.md` before
deviating.

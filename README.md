# Tactile Diagram Workbench

**Open-source braille compiler for blind STEM students.**

## Blind STEM students get the diagram in the time it takes their teacher to upload it — not the three weeks tactile-graphics services take.

## Any STEM image: a chemistry structure, a neuron, a free-body diagram, a circuit, a labeled graph. Upload it, and the workbench compiles it to a tactile-ready sheet.

## Three input modes: a photo of the textbook page, a hand-drawn sketch on the whiteboard, or a one-line description like "draw acetone" or "label the parts of a neuron."

## Edit in plain English — "make labels bigger", "thicken the lines", "add a note: this is the reactive site" — instead of CAD, LaTeX, or a sighted assistant.

## Prints on what schools already have: swell paper + a ~$1.5k PIAF heater for the raised diagram lines, or a text-only Index V5 for the `.brf` braille labels. No specialty hardware required.

<!-- HERO: insert tactile output of acetic-acid alongside the workbench surface -->

---

A teacher uploads a STEM diagram from any subject. The workbench compiles it into a tactile-ready sheet — raised lines and dots together on an A4 SVG / PDF (the form a swell-paper heater or a tactile-graphics embosser prints) and a `.brf` for the braille labels on a text-only embosser. The teacher refines the result in plain English, edits the labels, repositions notation, adds annotations. The trust level shows on the workbench chip: verified for chemistry, teacher-review draft for other subjects until each verifier lands.

**Live URL:** [buildday-harness.vercel.app](https://buildday-harness.vercel.app)
**Repo:** [github.com/diangao/buildday-harness](https://github.com/diangao/buildday-harness)

---

## What's real, what isn't

The product is **any STEM subject** — chemistry, biology, physics, math, circuits. The chemistry pipeline is the verified vertical today: image / hand-drawn sketch / concept-description → canonical SMILES (Claude Opus 4.8 vision) → rdkit-js IR → tactile SVG + `.brf` labels, with a deterministic verifier that canonicalises the source and the rendered structure and surfaces any divergence on every edit. The case the verifier exists for is when a depiction edit silently drops a `C=O` bond to a single bond — a sighted teacher cannot see this, but a blind student would learn from it.

For non-chemistry STEM uploads, the workbench routes the image through a universal tactile renderer (text labels translated to braille, bond / axis / arrow / shape lines redrawn as raised tactile line work) and surfaces the output as a **teacher-review draft** with a distinct chip — clearly different from the verified chemistry path, never a faked tactile sheet. Per-subject verifiers (a physics free-body diagram has different correctness rules from a biology cell labeling) ship over time; until they do, the chip says so.

Natural-language edit is bounded to a small set of structure-safe rendering ops; there is no affordance to rewrite the underlying structure (that would invite the silent-drift failure mode the chemistry verifier exists to catch).

The diagram's raised lines need a swell-paper heater (the cheap path schools already have) or a tactile-graphics embosser to come out as continuous raised line work — a text-only braille embosser only puts down the `.brf` labels, not the diagram itself. There is no physical hardware on stage during the demo, so we ship both files.

## Try it

```bash
git clone https://github.com/diangao/buildday-harness
cd buildday-harness/app
npm install
npm run dev
```

The mock harness runs end-to-end on three fixtures (`ethanol`, `acetone`, `acetic-acid`) plus `ethylene`. Acetic acid is the engineered case where the verifier flips. Live image-to-SMILES requires `ANTHROPIC_API_KEY` in the Vercel function environment — the key never reaches the browser.

## How it works

```
  ingest  →  parse  →  compile  →  verify  →  edit  →  export
                ↑          ↑          ↑          ↑          ↑
                │          │          │          │          │
          Claude VLM  rdkit-js   rdkit-js  six-op    svg2pdf
        (serverless)  depiction  canon+diff router    + .brf
```

Parse takes an uploaded image to canonical SMILES via a serverless `/api/extract-smiles` call to Claude vision. The API key lives only in the Vercel function environment and a 401 demo-key guard prevents public burn.

Compile turns SMILES into a `ChemIR` (atoms, bonds, 2D coordinates) with rdkit-js and renders the tactile SVG plus an emboss-ready A4 print-sheet for the swell-paper / heater path.

Verify canonicalises the source IR and the rendered IR with rdkit-js and runs a structural diff. There is no model in this step — the verifier is deterministic by construction, which is what allows it to flag the silent bond-order drop.

Edit takes free natural language to one of six safe rendering ops via a serverless `/api/edit-intent` call. The model picks the op and a scale factor (clamped 0.5–3×); the transform applies deterministically; the verifier runs again. A regex fallback handles offline runs so the demo never depends on the live API.

The whole pipeline runs through shared contracts in `app/src/harness/contracts.ts` (`DiagramAsset`, `ChemIR`, `TactileSVG`, `FidelityReport`, `EditOp`). The UI imports those types, not the implementations, so the mock harness and the real one swap in behind the same signatures.

## Stack

TypeScript, Vite, rdkit-js, Anthropic Messages API (`claude-opus-4-8`) via Vercel serverless functions, A4 print-sheet SVG for swell paper or a tactile-graphics embosser, and Braille Ready Format for standard text embossers.

## Built by

Built in a single Build Day by a coordinated human + AI team across product,
design, parsing, verification, editing, UI, deploy, and publication-safety
lanes.

## License

MIT.

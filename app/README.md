# Tactile Diagram Workbench (Build Day)

Teachers upload a STEM diagram (chemistry first) and get a **tactile-ready
SVG/PDF** they can refine in natural language. A hidden **deterministic fidelity
verifier** flags when an edit silently breaks the structure (e.g. a double bond
dropped to a single bond) so the exported diagram stays faithful to the source.

The pipeline is a **dynamic-workflow harness**: `ingest → route → parse →
compile → verify → edit → export`. Nodes are decoupled through shared contracts,
so the UI builds against mock nodes first and real nodes swap in unchanged.

## Run
```
npm install
npm run dev   # open the printed localhost URL
```

## Architecture (lanes)
- `src/harness/contracts.ts` — **shared contracts** (`DiagramAsset`, `ChemIR`,
  `TactileSVG`, `FidelityReport`, `EditOp`, `HarnessNodes`). Everyone imports this.
- `src/harness/mock.ts` — mock harness: deterministic IR→SVG renderer +
  reference fidelity verifier + all nodes. Real nodes replace these:
  - `parse` → serverless image→SMILES (`/api/extract-smiles`), key server-side only
  - `compile` → rdkit-js depiction + tactile restyle (compiler lane)
  - `verify` → rdkit-js canonicalize + structural diff (verifier lane)
  - `exportTactile` → svg2pdf.js + jsPDF (compiler lane)
- `src/harness/edit-intent.ts` — deterministic NL → `EditOp` router. The model
  only picks the op; the transform itself is fully deterministic.
- `src/harness/braille.ts` — grade-1 Unicode braille for atom labels.
- `src/fixtures/chem.ts` — curated chemistry fixtures with gold SMILES; powers
  the demo-safe path, the mock data, and the verifier ground truth. `acetic-acid`
  is the engineered case where enlarging labels drops the C=O double bond.
- `src/main.ts` — minimal end-to-end demo wiring (replaced by the workbench UI).

## Demo money-shot
Load **Acetic acid** → preflight chip reads **ready** → type "make labels
bigger" → a depiction bug drops the C=O double bond → verifier flips the chip to
**needs review** with `C–O bond should be double`.

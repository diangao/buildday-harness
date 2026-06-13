// Curated chemistry fixtures with human-confirmed gold SMILES.
// These power three things at once:
//   1. the demo-safe path (no live OCR needed on stage),
//   2. the mock harness's canned data,
//   3. the verifier's ground truth.
//
// `acetic-acid` is the engineered money-shot: enlarging labels triggers a
// depiction bug that drops the C=O double bond to a single bond, so the
// deterministic verifier flips the preflight chip to "needs review".

import type { ChemIR } from "../harness/contracts";

export type ChemFixture = {
  id: string;
  name: string;
  formula: string;
  goldIR: ChemIR;
  // Present only on the engineered demo case: the (buggy) render an edit
  // produces, used to demonstrate the verifier catching a real regression.
  demoBrokenIR?: ChemIR;
};

const ethanol: ChemIR = {
  smiles: "CCO",
  atoms: [
    { idx: 0, element: "C", x: 0, y: 0 },
    { idx: 1, element: "C", x: 1.2, y: 0.4 },
    { idx: 2, element: "O", x: 2.4, y: 0 },
  ],
  bonds: [
    { a: 0, b: 1, order: 1, aromatic: false },
    { a: 1, b: 2, order: 1, aromatic: false },
  ],
};

const acetone: ChemIR = {
  smiles: "CC(=O)C",
  atoms: [
    { idx: 0, element: "C", x: 0, y: 0 },
    { idx: 1, element: "C", x: 1.2, y: 0.4 },
    { idx: 2, element: "O", x: 1.2, y: 1.6 },
    { idx: 3, element: "C", x: 2.4, y: 0 },
  ],
  bonds: [
    { a: 0, b: 1, order: 1, aromatic: false },
    { a: 1, b: 2, order: 2, aromatic: false },
    { a: 1, b: 3, order: 1, aromatic: false },
  ],
};

const aceticAcidGold: ChemIR = {
  smiles: "CC(=O)O",
  atoms: [
    { idx: 0, element: "C", x: 0, y: 0 },
    { idx: 1, element: "C", x: 1.2, y: 0.4 },
    { idx: 2, element: "O", x: 1.2, y: 1.6 },
    { idx: 3, element: "O", x: 2.4, y: 0 },
  ],
  bonds: [
    { a: 0, b: 1, order: 1, aromatic: false },
    { a: 1, b: 2, order: 2, aromatic: false }, // C=O carbonyl
    { a: 1, b: 3, order: 1, aromatic: false },
  ],
};

// Same molecule, but the carbonyl C=O has been rendered as a single bond.
const aceticAcidBroken: ChemIR = {
  ...aceticAcidGold,
  bonds: aceticAcidGold.bonds.map((b) =>
    b.a === 1 && b.b === 2 ? { ...b, order: 1 } : b,
  ),
};

export const CHEM_FIXTURES: ChemFixture[] = [
  { id: "ethanol", name: "Ethanol", formula: "C₂H₆O", goldIR: ethanol },
  { id: "acetone", name: "Acetone", formula: "C₃H₆O", goldIR: acetone },
  {
    id: "acetic-acid",
    name: "Acetic acid",
    formula: "C₂H₄O₂",
    goldIR: aceticAcidGold,
    demoBrokenIR: aceticAcidBroken,
  },
];

export function getFixture(id: string): ChemFixture | undefined {
  return CHEM_FIXTURES.find((f) => f.id === id);
}

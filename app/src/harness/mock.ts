// Mock harness: every node returns canned/derived data so the UI runs the full
// pipeline end-to-end before real nodes land. Real nodes (serverless parse,
// rdkit-js compile, rdkit-hardened verify, svg2pdf export) swap in behind the
// HarnessNodes interface without changing callers.

import type {
  Atom,
  Bond,
  ChemIR,
  Diff,
  FidelityReport,
  HarnessNodes,
  TactileSVG,
} from "./contracts";
import { toBraille } from "./braille";
import { getFixture } from "../fixtures/chem";

export type RenderOpts = {
  strokeWidth: number;
  fontSize: number;
  doubleBondGap: number;
  coordScale: number;
};

export const DEFAULT_OPTS: RenderOpts = {
  strokeWidth: 6,
  fontSize: 28,
  doubleBondGap: 7,
  coordScale: 90,
};

// Mock-internal cumulative render state per asset. Real impls manage their own.
const renderState = new Map<string, RenderOpts>();

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ── Deterministic IR → tactile SVG (reference for the real rdkit-js compile) ─
export function mockRenderSVG(ir: ChemIR, opts: RenderOpts): string {
  const pad = 64;
  const px = (a: Atom) => a.x * opts.coordScale;
  const py = (a: Atom) => a.y * opts.coordScale;
  const xs = ir.atoms.map(px);
  const ys = ir.atoms.map(py);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(...xs) - minX + pad * 2;
  const h = Math.max(...ys) - minY + pad * 2;
  const X = (a: Atom) => px(a) - minX + pad;
  const Y = (a: Atom) => py(a) - minY + pad;

  const bonds = ir.bonds
    .map((b) => {
      const a1 = ir.atoms[b.a];
      const a2 = ir.atoms[b.b];
      const x1 = X(a1);
      const y1 = Y(a1);
      const x2 = X(a2);
      const y2 = Y(a2);
      const line = (dx: number, dy: number) =>
        `<line x1="${(x1 + dx).toFixed(1)}" y1="${(y1 + dy).toFixed(1)}" x2="${(x2 + dx).toFixed(1)}" y2="${(y2 + dy).toFixed(1)}" stroke="#000" stroke-width="${opts.strokeWidth}" stroke-linecap="round"/>`;
      if (b.order === 2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1;
        const ox = (-dy / len) * opts.doubleBondGap;
        const oy = (dx / len) * opts.doubleBondGap;
        return line(ox, oy) + line(-ox, -oy);
      }
      return line(0, 0);
    })
    .join("");

  const atoms = ir.atoms
    .map((a) => {
      const cx = X(a);
      const cy = Y(a);
      const sym = a.label ?? a.element;
      return (
        `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(opts.fontSize * 0.85).toFixed(1)}" fill="#fff"/>` +
        `<text x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" font-size="${opts.fontSize}" font-family="monospace" font-weight="700" text-anchor="middle" dominant-baseline="central">${sym}</text>`
      );
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w.toFixed(0)} ${h.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" role="img" aria-label="tactile chemical structure"><rect width="100%" height="100%" fill="#fff"/>${bonds}${atoms}</svg>`;
}

function brailleLabels(ir: ChemIR) {
  return ir.atoms.map((a) => ({
    atomIdx: a.idx,
    cells: toBraille(a.label ?? a.element),
  }));
}

function compileWith(ir: ChemIR, opts: RenderOpts): TactileSVG {
  return { svg: mockRenderSVG(ir, opts), ir, braille: brailleLabels(ir) };
}

// ── Deterministic fidelity diff (reference; real node hardens with rdkit-js) ─
function tally<T>(items: T[]): Map<T, number> {
  const m = new Map<T, number>();
  for (const it of items) m.set(it, (m.get(it) ?? 0) + 1);
  return m;
}

function ordName(order: number): string {
  return order === 3 ? "triple" : order === 2 ? "double" : "single";
}

function bondPair(ir: ChemIR, b: Bond): string {
  return [ir.atoms[b.a].element, ir.atoms[b.b].element].sort().join("–");
}

export function referenceVerify(
  goldIR: ChemIR,
  renderedIR: ChemIR,
): FidelityReport {
  const diffs: Diff[] = [];

  const goldEl = tally(goldIR.atoms.map((a) => a.element));
  const renEl = tally(renderedIR.atoms.map((a) => a.element));
  for (const [el, n] of goldEl) {
    const m = renEl.get(el) ?? 0;
    if (m < n) {
      diffs.push({
        kind: "missing_atom",
        detail: `${el} atom missing (expected ${n}, found ${m})`,
        severity: "error",
      });
    }
  }

  const ordersByPair = (ir: ChemIR) => {
    const m = new Map<string, number[]>();
    for (const b of ir.bonds) {
      const k = bondPair(ir, b);
      const arr = m.get(k);
      if (arr) arr.push(b.order);
      else m.set(k, [b.order]);
    }
    return m;
  };

  const goldB = ordersByPair(goldIR);
  const renB = ordersByPair(renderedIR);
  for (const [pair, gOrders] of goldB) {
    const rTally = tally(renB.get(pair) ?? []);
    for (const [ord, n] of tally(gOrders)) {
      const found = rTally.get(ord) ?? 0;
      if (found < n) {
        // Distinguish "bond absent entirely" from "rendered at wrong order".
        const anyAtPair = (renB.get(pair) ?? []).length > 0;
        diffs.push(
          anyAtPair
            ? {
                kind: "wrong_bond_order",
                detail: `${pair} bond should be ${ordName(ord)}`,
                severity: "error",
              }
            : {
                kind: "missing_bond",
                detail: `${pair} bond missing`,
                severity: "error",
              },
        );
      }
    }
  }

  return {
    pass: diffs.length === 0,
    checkedAt: new Date().toISOString(),
    diffs,
  };
}

export const mockNodes: HarnessNodes = {
  async ingest(file) {
    return {
      id: uid(),
      name: file.name,
      kind: "chemistry",
      createdAt: new Date().toISOString(),
      source: file,
      status: "uploaded",
    };
  },

  route: () => "chemistry",

  async parse(asset) {
    // Fixtures path: resolve gold IR by id/name. Real node: serverless
    // image→SMILES via /api/extract-smiles, then SMILES→IR.
    const fx =
      getFixture(asset.id) ??
      getFixture(asset.name.toLowerCase().replace(/\s+/g, "-"));
    if (!fx) throw new Error(`No chemistry fixture for "${asset.name}"`);
    return fx.goldIR;
  },

  async compile(ir) {
    return compileWith(ir, DEFAULT_OPTS);
  },

  verify(goldIR, renderedIR) {
    return referenceVerify(goldIR, renderedIR);
  },

  async edit(op, asset) {
    const opts: RenderOpts = { ...(renderState.get(asset.id) ?? DEFAULT_OPTS) };
    let ir: ChemIR = asset.ir ?? asset.goldIR ?? (await this.parse(asset));
    const gold = asset.goldIR ?? ir;

    switch (op.kind) {
      case "enlargeLabels": {
        opts.fontSize *= op.factor ?? 1.4;
        // Engineered demo regression: on the curated demo asset, enlarging
        // labels triggers a depiction bug that drops a double bond. The
        // deterministic verifier catches it and flips the preflight chip.
        const fx = getFixture(asset.id);
        if (fx?.demoBrokenIR) ir = fx.demoBrokenIR;
        break;
      }
      case "thickenLines":
        opts.strokeWidth *= op.factor ?? 1.5;
        break;
      case "emphasizeDoubleBonds":
        opts.doubleBondGap *= 1.7;
        break;
      case "spaceLabels":
        opts.coordScale *= op.factor ?? 1.3;
        break;
      case "removeBackground":
      case "export":
        break;
    }

    renderState.set(asset.id, opts);
    const tactile = compileWith(ir, opts);
    const report = referenceVerify(gold, ir);
    return { ...asset, ir, tactile, report, status: "verified" };
  },

  async exportTactile(tactile, format) {
    if (format === "svg") {
      return new Blob([tactile.svg], { type: "image/svg+xml" });
    }
    // Real PDF export = svg2pdf.js + jsPDF (compiler lane). Mock tags the SVG
    // bytes as pdf so the export wiring is exercised end-to-end.
    return new Blob([tactile.svg], { type: "application/pdf" });
  },
};

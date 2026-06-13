// Deterministic natural-language → EditOp router.
// Teachers type free text; we match it to ONE fixed, safe operation. This is
// the layer a model could later replace for fuzzier phrasing, but the default
// is rule-based so the demo never depends on a live model call.

import type { EditOp } from "./contracts";

type Rule = { test: RegExp; build: (text: string) => EditOp };

const RULES: Rule[] = [
  {
    test: /\b(label|text|atom)s?\b.*\b(big|bigger|larger|enlarge|grow)\b|\b(big|bigger|larger|enlarge)\b.*\blabel/i,
    build: () => ({ kind: "enlargeLabels" }),
  },
  {
    test: /thick|bolder|heavier|stronger\s+line|bold\s+line/i,
    build: () => ({ kind: "thickenLines" }),
  },
  {
    test: /\bdouble bond/i,
    build: () => ({ kind: "emphasizeDoubleBonds" }),
  },
  {
    test: /\b(space|spread|apart|farther|further|separate)\b.*\blabel|\blabel.*\b(space|spread|apart)/i,
    build: () => ({ kind: "spaceLabels" }),
  },
  {
    test: /\b(remove|hide|strip|clear)\b.*\b(background|backdrop|detail)/i,
    build: () => ({ kind: "removeBackground" }),
  },
  {
    test: /\bexport\b.*\bpdf\b|\bpdf\b/i,
    build: () => ({ kind: "export", format: "pdf" }),
  },
  {
    test: /\bexport\b|\bdownload\b.*\bsvg\b|\bsvg\b/i,
    build: () => ({ kind: "export", format: "svg" }),
  },
];

export function parseEditCommand(text: string): EditOp | null {
  for (const rule of RULES) {
    if (rule.test.test(text)) return rule.build(text);
  }
  return null;
}

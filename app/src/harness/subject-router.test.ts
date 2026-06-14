import { describe, expect, it } from "vitest";
import type { DiagramAsset } from "./contracts";
import { buildDraftTactile, buildDraftTactileFromSource, routeSubject } from "./subject-router";

function asset(name: string, source = "<svg/>"): DiagramAsset {
  return {
    id: "upload",
    name,
    kind: "unknown",
    createdAt: new Date(0).toISOString(),
    source: {
      name,
      mime: "image/svg+xml",
      dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(source)}`,
    },
    status: "uploaded",
  };
}

function imageAsset(name: string): DiagramAsset {
  return {
    id: "upload",
    name,
    kind: "unknown",
    createdAt: new Date(0).toISOString(),
    source: {
      name,
      mime: "image/png",
      dataUrl: "data:image/png;base64,AAAA",
    },
    status: "uploaded",
  };
}

function stubFetch(payload: unknown): typeof fetch {
  return (async () =>
    ({
      ok: true,
      status: 200,
      json: async () => payload,
    }) as unknown as Response) as unknown as typeof fetch;
}

describe("routeSubject", () => {
  it("does not classify labeled biology diagrams as LED circuits", () => {
    const route = routeSubject(asset("biology-plant-cell-labeled.svg"));
    expect(route.kind).toBe("biology");
    expect(route.reason).toContain('"biology"');
  });

  it("still recognizes standalone LED circuit filenames", () => {
    expect(routeSubject(asset("led-circuit.svg")).kind).toBe("circuit");
  });
});

describe("buildDraftTactile", () => {
  it("keeps subject hints internal and emits a print .brf label source", () => {
    const source = `
      <svg viewBox="0 0 200 120">
        <rect x="30" y="20" width="140" height="80" />
        <text x="100" y="40" font-size="14">nucleus</text>
      </svg>
    `;
    const upload = asset("biology-plant-cell-labeled.svg", source);
    const route = routeSubject(upload);
    const tactile = buildDraftTactile(upload, route);

    expect(tactile.draftKind).toBe("biology");
    expect(tactile.svg).toContain("Tactile draft");
    expect(tactile.svg).not.toContain("Biology tactile draft");
    expect(tactile.svg).not.toContain("Circuit tactile draft");
    expect(tactile.printSheet).toContain('width="210mm"');
    expect(tactile.braille.map((label) => label.cells)).toContain("⠝⠥⠉⠇⠑⠥⠎");
  });

  it("does not print routed subject labels in fallback drafts", () => {
    const upload = imageAsset("biology-plant-cell-labeled.png");
    const route = routeSubject(upload);
    const tactile = buildDraftTactile(upload, route);
    const oldSubjectSubtitle = ["Biology", "diagram"].join(" ");

    expect(route.kind).toBe("biology");
    expect(tactile.svg).toContain("teacher review draft");
    expect(tactile.svg).not.toContain(oldSubjectSubtitle);
    expect(tactile.svg).not.toContain("biology");
    expect(tactile.printSheet).not.toContain(oldSubjectSubtitle);
    expect(tactile.printSheet).not.toContain("biology");
  });

  it("preserves an uploaded SVG even when no text labels are extractable", () => {
    const source = `
      <svg viewBox="0 0 200 120">
        <path d="M20 60 C40 10 160 10 180 60 C160 110 40 110 20 60Z" />
        <text>nucleus without coordinates</text>
      </svg>
    `;
    const upload = asset("biology-plant-cell-structure.svg", source);
    const route = routeSubject(upload);
    const tactile = buildDraftTactile(upload, route);

    expect(tactile.draftKind).toBe("biology");
    expect(tactile.svg).toContain("<image ");
    expect(tactile.svg).toContain("nucleus%20without%20coordinates");
    expect(tactile.svg).not.toContain("major lines");
    expect(tactile.printSheet).toContain("<image ");
    expect(tactile.printSheet).toContain('width="210mm"');
  });

  it("uses label extraction for raster non-chem uploads instead of the generic placeholder", async () => {
    const upload = imageAsset("physics-force-diagram.png");
    const route = routeSubject(upload);
    const tactile = await buildDraftTactileFromSource(upload, route, {
      fetchImpl: stubFetch({
        subject: "physics",
        title: "Incline forces",
        labels: [
          { text: "N", x: 0.42, y: 0.28, fontSize: 0.04 },
          { text: "mg", x: 0.5, y: 0.64, fontSize: 0.04 },
        ],
      }),
    });

    expect(tactile.draftKind).toBe("physics");
    expect(tactile.svg).toContain('href="data:image/png;base64,AAAA"');
    expect(tactile.svg).toContain("Incline forces");
    expect(tactile.svg).not.toContain("major lines");
    expect(tactile.braille.map((label) => label.cells)).toContain("⠝");
    expect(tactile.braille.map((label) => label.cells)).toContain("⠍⠛");
  });
});

// Minimal end-to-end wiring over the mock harness so the app runs the full
// ingest → parse → compile → verify → edit → export pipeline today.
// The tactile workbench UI replaces this; it consumes the same harness nodes.

import { mockNodes, mockRenderSVG, DEFAULT_OPTS } from "./harness/mock";
import { parseEditCommand } from "./harness/edit-intent";
import { CHEM_FIXTURES } from "./fixtures/chem";
import type { DiagramAsset, UploadedFile } from "./harness/contracts";

const nodes = mockNodes;
let current: DiagramAsset | null = null;

const root = document.getElementById("app")!;
root.innerHTML = `
  <main style="font-family:system-ui;max-width:980px;margin:0 auto;padding:16px">
    <h1 style="font-size:18px">Tactile diagram workbench <span style="font-weight:400;color:#888">(mock harness)</span></h1>
    <div id="library" style="display:flex;gap:8px;margin:12px 0"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <section><h2 style="font-size:13px;color:#666">Source</h2><div id="source" style="border:1px solid #ddd;min-height:240px"></div></section>
      <section>
        <h2 style="font-size:13px;color:#666">Tactile-ready <span id="chip"></span></h2>
        <div id="tactile" style="border:1px solid #ddd;min-height:240px"></div>
      </section>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <input id="cmd" placeholder="e.g. make labels bigger / thicken lines / export pdf" style="flex:1;padding:8px"/>
      <button id="run">Apply</button>
    </div>
    <p id="msg" style="color:#888;font-size:12px;min-height:16px"></p>
  </main>
`;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const libraryEl = $("library");
for (const fx of CHEM_FIXTURES) {
  const btn = document.createElement("button");
  btn.textContent = `${fx.name} (${fx.formula})`;
  btn.onclick = () => loadFixture(fx.id);
  libraryEl.appendChild(btn);
}

function setMsg(s: string) {
  $("msg").textContent = s;
}

function renderChip() {
  const chip = $("chip");
  if (!current?.report) {
    chip.textContent = "";
    return;
  }
  const ok = current.report.pass;
  chip.textContent = ok ? "● ready" : "● needs review";
  chip.style.color = ok ? "#1a7f37" : "#b35900";
  chip.style.fontSize = "12px";
}

function render() {
  if (!current) return;
  // Source panel shows the faithful gold depiction; tactile panel shows the
  // current (possibly edited) render.
  $("source").innerHTML = mockRenderSVG(current.goldIR!, DEFAULT_OPTS);
  $("tactile").innerHTML = current.tactile?.svg ?? "";
  renderChip();
  if (current.report && !current.report.pass) {
    setMsg("preflight: " + current.report.diffs.map((d) => d.detail).join("; "));
  }
}

async function loadFixture(id: string) {
  const file: UploadedFile = { name: id, mime: "image/svg+xml", dataUrl: "" };
  let asset = await nodes.ingest(file);
  const ir = await nodes.parse(asset);
  asset = { ...asset, goldIR: ir, ir, status: "parsed" };
  const tactile = await nodes.compile(ir);
  const report = nodes.verify(ir, tactile.ir);
  current = { ...asset, tactile, report, status: "verified" };
  setMsg("");
  render();
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

async function runEdit() {
  if (!current) {
    setMsg("pick a diagram first");
    return;
  }
  const text = $<HTMLInputElement>("cmd").value;
  const op = parseEditCommand(text);
  if (!op) {
    setMsg(`unrecognized command: "${text}"`);
    return;
  }
  if (op.kind === "export") {
    const blob = await nodes.exportTactile(current.tactile!, op.format);
    download(blob, `tactile.${op.format}`);
    setMsg(`exported ${op.format.toUpperCase()}`);
    return;
  }
  current = await nodes.edit(op, current);
  render();
}

$("run").onclick = runEdit;
$<HTMLInputElement>("cmd").addEventListener("keydown", (e) => {
  if (e.key === "Enter") runEdit();
});

loadFixture(CHEM_FIXTURES[0].id);

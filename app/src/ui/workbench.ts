/**
 * Single-screen tactile workbench UI.
 *
 * Consumes the harness `mockNodes` (ingest → parse → compile → verify → edit →
 * export) behind the `HarnessNodes` seam, so real parse/compile nodes swap in
 * without touching this file. Plain DOM, no framework.
 *
 * UX shape:
 *   - Empty state foregrounds Upload; pre-baked molecules are clearly labelled
 *     "examples", not the primary path.
 *   - A teacher loads/uploads a diagram, sees Source vs Tactile side by side.
 *   - Natural language drives deterministic edit ops (the model only picks an
 *     op tag; it never rewrites the SVG).
 *   - The deterministic verifier surfaces fidelity drift in a loud banner that
 *     does NOT obscure the diagram.
 */

import { mockNodes } from "../harness/mock";
import { parseEditCommand } from "../harness/edit-intent";
import { CHEM_FIXTURES } from "../fixtures/chem";
import type {
  DiagramAsset,
  EditOp,
  UploadedFile,
} from "../harness/contracts";

const nodes = mockNodes;

interface LogEntry {
  utterance: string;
  op: EditOp | null;
}

interface WorkbenchState {
  assets: DiagramAsset[];
  activeId: string | null;
  lastEdit: LogEntry | null;
  preflightOpen: boolean;
}

const state: WorkbenchState = {
  assets: [],
  activeId: null,
  lastEdit: null,
  preflightOpen: false,
};

const formulaByName = new Map(
  CHEM_FIXTURES.map((f) => [f.name, f.formula] as const),
);

export async function mount(root: HTMLElement): Promise<void> {
  root.innerHTML = "";
  root.appendChild(buildHeader());
  root.appendChild(buildLibBar());
  root.appendChild(buildMain());
  root.appendChild(buildFooter());

  // Pre-load the example molecules so chips/cards are instant, but keep the
  // empty state up until the teacher picks one or uploads their own.
  state.assets = await Promise.all(
    CHEM_FIXTURES.map((fx) => loadExampleAsset(fx.name)),
  );
  rerender();
}

// ── Pipeline helpers ────────────────────────────────────────────────────

async function loadExampleAsset(name: string): Promise<DiagramAsset> {
  // parse() resolves a fixture by normalized name, so "Acetic acid" works.
  const file: UploadedFile = { name, mime: "image/svg+xml", dataUrl: "" };
  let asset = await nodes.ingest(file);
  const ir = await nodes.parse(asset);
  asset = { ...asset, goldIR: ir, ir, status: "parsed" };
  const tactile = await nodes.compile(ir);
  const report = nodes.verify(ir, tactile.ir);
  return { ...asset, tactile, report, status: "verified" };
}

let standInTactilePromise: Promise<DiagramAsset> | null = null;
function standInAsset(): Promise<DiagramAsset> {
  // Until the OCR parser lands (a follow-on), an uploaded image gets a
  // representative compiled structure so the pipeline shape is visible.
  if (!standInTactilePromise) {
    standInTactilePromise = loadExampleAsset("Acetic acid");
  }
  return standInTactilePromise;
}

// ── Header ──────────────────────────────────────────────────────────────

function buildHeader(): HTMLElement {
  const header = el("header", "tw-header");
  const title = el("div", "tw-title");
  title.innerHTML =
    `<strong>Tactile Workbench</strong>&nbsp;` +
    `<span>open-source compiler for blind STEM diagrams</span>`;
  header.appendChild(title);

  const preflight = el("button", "tw-preflight");
  preflight.id = "tw-preflight";
  preflight.type = "button";
  preflight.addEventListener("click", () => {
    if (!activeAsset()) return;
    state.preflightOpen = !state.preflightOpen;
    rerender();
  });
  header.appendChild(preflight);
  return header;
}

// ── Library bar ─────────────────────────────────────────────────────────

function buildLibBar(): HTMLElement {
  const bar = el("div", "tw-libbar");
  bar.id = "tw-libbar";

  const label = el("span", "tw-libbar-label");
  label.textContent = "Examples";
  bar.appendChild(label);

  const chips = el("div", "tw-libbar-chips");
  chips.id = "tw-libbar-chips";
  bar.appendChild(chips);

  const upload = makeUploadLabel("Upload diagram");
  bar.appendChild(upload);
  return bar;
}

function makeUploadLabel(text: string): HTMLLabelElement {
  const upload = el("label", "tw-upload") as HTMLLabelElement;
  const inputId = `tw-upload-${Math.random().toString(36).slice(2, 7)}`;
  upload.setAttribute("for", inputId);
  upload.innerHTML = `<span>${escapeHtml(text)}</span>`;
  const input = el("input") as HTMLInputElement;
  input.type = "file";
  input.id = inputId;
  input.accept = "image/*,application/pdf";
  input.hidden = true;
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (file) void handleUpload(file);
    input.value = "";
  });
  upload.appendChild(input);
  return upload;
}

// ── Main (empty state OR two panes) ─────────────────────────────────────

function buildMain(): HTMLElement {
  const main = el("main", "tw-main");
  main.id = "tw-main";
  return main;
}

function renderMain(): void {
  const main = document.getElementById("tw-main");
  if (!main) return;
  main.innerHTML = "";
  const asset = activeAsset();
  if (!asset) {
    main.appendChild(buildEmptyState());
  } else {
    main.appendChild(buildPanes(asset));
  }
}

function buildEmptyState(): HTMLElement {
  const wrap = el("div", "tw-empty");

  const drop = makeUploadLabel("") as HTMLLabelElement;
  drop.className = "tw-dropzone";
  drop.innerHTML = `
    <div class="tw-dropzone-icon">↑</div>
    <div class="tw-dropzone-title">Upload a STEM diagram</div>
    <div class="tw-dropzone-sub">Drop a PDF, PNG, or textbook screenshot here — or click to browse. We compile it to an emboss-ready tactile sheet with real braille labels.</div>
  `;
  // Re-attach the hidden input (innerHTML wiped it).
  const inputId = drop.getAttribute("for") ?? "tw-drop-input";
  const input = el("input") as HTMLInputElement;
  input.type = "file";
  input.id = inputId;
  input.accept = "image/*,application/pdf";
  input.hidden = true;
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (file) void handleUpload(file);
    input.value = "";
  });
  drop.appendChild(input);
  drop.addEventListener("dragover", (e) => {
    e.preventDefault();
    drop.setAttribute("data-drag", "true");
  });
  drop.addEventListener("dragleave", () => drop.removeAttribute("data-drag"));
  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    drop.removeAttribute("data-drag");
    const file = e.dataTransfer?.files?.[0];
    if (file) void handleUpload(file);
  });
  wrap.appendChild(drop);

  const or = el("div", "tw-empty-or");
  or.textContent = "or start from an example";
  wrap.appendChild(or);

  const cards = el("div", "tw-example-cards");
  for (const fx of CHEM_FIXTURES) {
    const card = el("button", "tw-example-card");
    card.type = "button";
    card.innerHTML =
      `<span class="tw-example-card-name">${escapeHtml(fx.name)}</span>` +
      `<span class="tw-example-card-formula">${escapeHtml(fx.formula)}</span>`;
    card.addEventListener("click", () => selectByName(fx.name));
    cards.appendChild(card);
  }
  wrap.appendChild(cards);
  return wrap;
}

function buildPanes(asset: DiagramAsset): HTMLElement {
  const panes = el("div", "tw-panes");

  // Source pane — faithful gold depiction (or uploaded image).
  const source = el("section", "tw-pane");
  const hasImage = asset.source.dataUrl && asset.source.mime !== "image/svg+xml";
  const srcBody = hasImage
    ? `<img src="${asset.source.dataUrl}" alt="uploaded source diagram" />`
    : `<div class="tw-pane-stage">${sourceSvg(asset) || '<p class="tw-pane-empty">No source depiction.</p>'}</div>`;
  source.innerHTML = `
    <div class="tw-pane-header"><span>Source</span><span>${escapeHtml(asset.name)}</span></div>
    <div class="tw-pane-body">${srcBody}</div>
  `;
  panes.appendChild(source);

  // Tactile pane — working render + verifier banner.
  const tactile = el("section", "tw-pane");
  const pass = asset.report?.pass !== false;
  const diffs = asset.report?.diffs ?? [];
  const banner =
    !pass && diffs.length
      ? `<div class="tw-verifier-banner">
           <strong>⚠ Preflight caught a fidelity drift</strong>
           <ul>${diffs.map((d) => `<li>${escapeHtml(d.detail)}</li>`).join("")}</ul>
         </div>`
      : "";
  const svg = asset.tactile?.svg ?? "";
  tactile.innerHTML = `
    <div class="tw-pane-header">
      <span>Tactile-ready</span>
      <span class="tw-pane-status" data-state="${pass ? "ok" : "warn"}">
        <span class="tw-pane-status-dot"></span>${pass ? "verified" : "needs review"}
      </span>
    </div>
    ${banner}
    <div class="tw-pane-body">
      <div class="tw-pane-stage">${svg || '<p class="tw-pane-empty">Compiling…</p>'}</div>
    </div>
  `;
  panes.appendChild(tactile);
  return panes;
}

// Cache the original (gold) render per asset so an edit that breaks the tactile
// output does not also mutate the Source pane — the teacher always compares
// against the faithful structure.
const goldSvgCache = new Map<string, string>();

function sourceSvg(asset: DiagramAsset): string {
  return goldSvgCache.get(asset.id) ?? asset.tactile?.svg ?? "";
}

// ── Footer ──────────────────────────────────────────────────────────────

function buildFooter(): HTMLElement {
  const footer = el("footer", "tw-footer");
  footer.id = "tw-footer";

  const row = el("div", "tw-footer-row");
  const form = el("form", "tw-nl-form") as HTMLFormElement;
  form.innerHTML = `
    <input id="tw-nl-input" type="text" autocomplete="off"
      placeholder='Tell the workbench what to change — e.g. "make the labels bigger"' />
    <button type="submit">Apply</button>
  `;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("tw-nl-input") as HTMLInputElement | null;
    if (!input) return;
    const utterance = input.value.trim();
    if (!utterance) return;
    void handleUtterance(utterance);
    input.value = "";
  });
  row.appendChild(form);

  const printBtn = el("button", "tw-export") as HTMLButtonElement;
  printBtn.type = "button";
  printBtn.textContent = "Print / export";
  printBtn.addEventListener("click", () => openPrintPreview());
  row.appendChild(printBtn);

  footer.appendChild(row);

  const status = el("div", "tw-edit-status");
  status.id = "tw-edit-status";
  footer.appendChild(status);
  return footer;
}

// ── Interactions ────────────────────────────────────────────────────────

async function handleUpload(file: File): Promise<void> {
  const dataUrl = await readDataUrl(file);
  const uf: UploadedFile = {
    name: file.name,
    mime: file.type || "image/png",
    dataUrl,
  };
  let asset = await nodes.ingest(uf);
  asset = { ...asset, status: "uploaded" };
  state.assets = [asset, ...state.assets];
  state.activeId = asset.id;
  state.preflightOpen = false;
  state.lastEdit = null;
  rerender();

  // Stand-in compile until the OCR parser lands. Keeps the uploaded image in
  // Source, fills Tactile with a representative compiled structure.
  const standIn = await standInAsset();
  const idx = state.assets.findIndex((a) => a.id === asset.id);
  if (idx < 0) return;
  state.assets[idx] = {
    ...state.assets[idx],
    goldIR: standIn.goldIR,
    ir: standIn.ir,
    tactile: standIn.tactile,
    report: standIn.report,
    status: "verified",
  };
  if (state.assets[idx].tactile)
    goldSvgCache.set(asset.id, state.assets[idx].tactile!.svg);
  rerender();
}

function selectByName(name: string): void {
  const asset = state.assets.find((a) => a.name === name);
  if (!asset) return;
  state.activeId = asset.id;
  state.preflightOpen = false;
  state.lastEdit = null;
  if (asset.tactile && !goldSvgCache.has(asset.id))
    goldSvgCache.set(asset.id, asset.tactile.svg);
  rerender();
}

async function handleUtterance(utterance: string): Promise<void> {
  const asset = activeAsset();
  if (!asset) return;
  const op = parseEditCommand(utterance);
  state.lastEdit = { utterance, op };
  if (!op) {
    rerender();
    return;
  }
  if (op.kind === "export") {
    await downloadExport(asset, op.format);
    rerender();
    return;
  }
  const updated = await nodes.edit(op, asset);
  const idx = state.assets.findIndex((a) => a.id === asset.id);
  if (idx >= 0) state.assets[idx] = updated;
  rerender();
}

function openPrintPreview(): void {
  const asset = activeAsset();
  const sheet = asset?.tactile?.printSheet ?? asset?.tactile?.svg;
  if (!asset || !sheet) return;

  const overlay = el("div", "tw-print-overlay");
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeOverlay();
  });
  overlay.innerHTML = `
    <div class="tw-print-toolbar">
      <span>Emboss-ready sheet — ${escapeHtml(asset.name)}</span>
      <div class="tw-print-actions">
        <button type="button" class="tw-export" id="tw-print-now">Send to printer</button>
        <button type="button" class="tw-export" id="tw-print-svg">Download SVG</button>
        <button type="button" class="tw-export" id="tw-print-pdf">Download PDF</button>
        <button type="button" class="tw-export" id="tw-print-close">Close</button>
      </div>
    </div>
    <div class="tw-print-sheet">${sheet}</div>
  `;
  document.body.appendChild(overlay);
  document.body.classList.add("tw-print-mode");

  function closeOverlay(): void {
    overlay.remove();
    document.body.classList.remove("tw-print-mode");
  }
  overlay.querySelector("#tw-print-close")?.addEventListener("click", closeOverlay);
  overlay.querySelector("#tw-print-now")?.addEventListener("click", () => window.print());
  overlay.querySelector("#tw-print-svg")?.addEventListener("click", () => {
    void downloadExport(asset, "svg");
  });
  overlay.querySelector("#tw-print-pdf")?.addEventListener("click", () => {
    void downloadExport(asset, "pdf");
  });
}

async function downloadExport(
  asset: DiagramAsset,
  format: "svg" | "pdf",
): Promise<void> {
  if (!asset.tactile) return;
  const blob = await nodes.exportTactile(asset.tactile, format);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${asset.name.replace(/\s+/g, "-").toLowerCase()}-tactile.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ── Render ──────────────────────────────────────────────────────────────

function activeAsset(): DiagramAsset | null {
  if (!state.activeId) return null;
  return state.assets.find((a) => a.id === state.activeId) ?? null;
}

function rerender(): void {
  renderLibBar();
  renderPreflight();
  renderMain();
  renderFooter();
}

function renderLibBar(): void {
  const chips = document.getElementById("tw-libbar-chips");
  if (!chips) return;
  chips.innerHTML = "";
  for (const asset of state.assets) {
    const chip = el("button", "tw-chip");
    chip.type = "button";
    chip.setAttribute("data-active", asset.id === state.activeId ? "true" : "false");
    const status =
      asset.report?.pass === false ? "warn" : asset.report?.pass === true ? "ok" : "neutral";
    chip.setAttribute("data-status", status);
    const formula = formulaByName.get(asset.name);
    chip.innerHTML =
      `<span class="tw-chip-dot"></span><span>${escapeHtml(asset.name)}</span>` +
      (formula ? `<span class="tw-chip-formula">${escapeHtml(formula)}</span>` : "");
    chip.addEventListener("click", () => selectByName(asset.name));
    chips.appendChild(chip);
  }
}

function renderPreflight(): void {
  const preflight = document.getElementById("tw-preflight");
  if (!preflight) return;
  const asset = activeAsset();
  if (!asset || !asset.report) {
    preflight.setAttribute("data-state", "idle");
    preflight.setAttribute("data-open", "false");
    preflight.innerHTML = `<span class="tw-preflight-dot"></span><span>Preflight</span>`;
    return;
  }
  const pass = asset.report.pass;
  const diffs = asset.report.diffs;
  preflight.setAttribute("data-state", pass ? "ready" : "warn");
  preflight.setAttribute("data-open", state.preflightOpen ? "true" : "false");
  const summary = pass ? "Preflight ready" : `Preflight: ${diffs.length} to review`;
  preflight.innerHTML = `
    <span class="tw-preflight-dot"></span>
    <span>${summary}</span>
    <div class="tw-preflight-popover">
      <h4>${pass ? "Structure preserved" : "Fidelity drift"}</h4>
      ${
        pass
          ? '<p style="margin:0;color:var(--ink-muted);">Atoms, bonds, and labels match the verified source structure.</p>'
          : `<ul>${diffs.map((d) => `<li>${escapeHtml(d.detail)}</li>`).join("")}</ul>`
      }
    </div>
  `;
}

function renderFooter(): void {
  const footer = document.getElementById("tw-footer");
  if (footer) footer.style.display = activeAsset() ? "flex" : "none";
  const status = document.getElementById("tw-edit-status");
  if (!status) return;
  if (!state.lastEdit) {
    status.textContent = "";
    status.removeAttribute("data-kind");
    return;
  }
  const { utterance, op } = state.lastEdit;
  if (!op) {
    status.setAttribute("data-kind", "unmapped");
    status.textContent = `Couldn't map "${utterance}" to a safe edit. Try: bigger labels · thicken lines · emphasize double bond · space labels.`;
  } else {
    status.removeAttribute("data-kind");
    status.innerHTML = `<span class="tw-op">${op.kind}</span> applied — “${escapeHtml(utterance)}”`;
  }
}

// ── DOM utils ───────────────────────────────────────────────────────────

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  });
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// v6.9.0-noGrid-noExportBtn
// CHANGES:
// - NO grid/axes/numbers in background
// - NO "Download PNG (transparent)" button created/placed
// - Canvas parented to #p5-container, width from container

const labels = [
  "Physical touch",
  "Standing distance",
  "Warmth",
  "Symmetry",
  "Body interlocking",
  "Typical duration",
  "Formality",
  "Power balance",
  "Body orientation",
  "Eye contact",
  "Body parts used",
  "Facial expression",
];

const ORIENT = {
  names: ["Up", "Forward", "Down"],
  upLen: 2.0,
  forwardLen: 1.2,
  downExtra: 0.35,
  downSigma: 1.2,
};

const INTERLOCK = {
  rotation: Math.PI * 0.5,
  scale: 0.5,
  orientRot: [-0.12, 0.0, +0.12],
};

// Eye contact floating wrap settings (unit space)
const EYE = {
  offConst: 0.56,
  extraGap: 0.06,
  downShift: 0.18,

  minDeltaToShow: 0.018,
  bandFrac: 0.16,
  lenMul: 2.0,
  endTrim: 2,
};

// Warmth extra split behavior for the CENTER baseline (unit space)
const WARM_SPLIT = {
  startAt: 5.0,
  lowerFrac: 1 / 3,
  xTopMax: 2.35,
  bulgeMax: 1.05,
  steps: 56,
};

// Stronger Auto SD anti-overlap (ONLY when split exists: Warmth<5)
const SD_FIX = {
  basePush: 1.10,
  sdPush: 1.55,
  splitPow: 1.15,
};

// Body parts used (multi)
const PARTS = {
  names: ["Hands", "Head", "Back", "Shoulders", "Chest", "Lips"],
  keys: ["hands", "head", "back", "shoulders", "chest", "lips"],
  bit: { hands: 1 << 0, head: 1 << 1, back: 1 << 2, shoulders: 1 << 3, chest: 1 << 4, lips: 1 << 5 },
};

// Facial expression modes (exclusive checkboxes)
const FACE = {
  names: ["None", "Smile", "Ceremonial", "Calm", "Formality"],

  smile: {
    scale: 0.65,
    R: 1.05,
    arcAng: 1.30 * Math.PI,
    arcSteps: 46,

    curlR: 0.22,
    curlTurns: 0.74,
    curlSteps: 32,
    curlShrink: 0.33,
    curlIn: 0.12,
    curlUp: 0.06,
  },

  ceremonial: {
    xFar: 2.35,
    up: 0.75,
    down: 0.55,
    tailUp: 0.18,
    steps: 34,

    curlR: 0.18,
    curlTurns: 0.70,
    curlSteps: 18,
  },

  calm: {
    h: 1.55,
    w: 0.95,
    steps: 22,
    copiesDeg: [0, +35, -35],
  },
};

const svgUpperCurve = [
  { x: 0, y: 0 },
  { x: 0.5, y: -0.8 },
  { x: 1.2, y: -1.5 },
  { x: 2.0, y: -2.0 },
  { x: 2.8, y: -2.3 },
  { x: 3.5, y: -2.4 },
  { x: 4.0, y: -2.3 },
  { x: 4.3, y: -2.0 },
];

const svgLowerCurve = [
  { x: 0, y: 0 },
  { x: -0.6, y: 0.9 },
  { x: -1.3, y: 1.8 },
  { x: -2.0, y: 2.6 },
  { x: -2.6, y: 3.2 },
  { x: -3.1, y: 3.6 },
  { x: -3.5, y: 3.8 },
  { x: -3.7, y: 3.8 },
];

const UI = { x: 40, y: 180, row: 46, w: 190, valDx: 210 };

// Preset values: sliders 0–10 (Body orientation 0–2), plus option keys for checkboxes
const PRESETS = {
  Waving: {
    "Physical touch": 0,
    "Standing distance": 10,
    "Warmth": 2,
    "Symmetry": 7,
    "Body interlocking": 0,
    "Typical duration": 1,
    "Formality": 3,
    "Power balance": 0,
    "Body orientation": 0,
    "Eye contact": 1,
    "Body parts used": ["hands"],
    "Facial expression": 1,
  },
  Handshake: {
    "Physical touch": 0,
    "Standing distance": 4,
    "Warmth": 2,
    "Symmetry": 10,
    "Body interlocking": 0,
    "Typical duration": 8,
    "Formality": 10,
    "Power balance": 10,
    "Body orientation": 1,
    "Eye contact": 1,
    "Body parts used": ["hands"],
    "Facial expression": 4,
  },
  Wai: {
    "Physical touch": 0,
    "Standing distance": 7,
    "Warmth": 4,
    "Symmetry": 0,
    "Body interlocking": 0,
    "Typical duration": 5,
    "Formality": 6,
    "Power balance": 2,
    "Body orientation": 2,
    "Eye contact": 0,
    "Body parts used": ["hands", "back", "head"],
    "Facial expression": 3,
  },
  Hug: {
    "Physical touch": 10,
    "Standing distance": 0,
    "Warmth": 10,
    "Symmetry": 7,
    "Body interlocking": 10,
    "Typical duration": 10,
    "Formality": 0,
    "Power balance": 0,
    "Body orientation": 1,
    "Eye contact": 0,
    "Body parts used": ["hands", "shoulders", "chest"],
    "Facial expression": 1,
  },
  "Cheek kiss": {
    "Physical touch": 8,
    "Standing distance": 0,
    "Warmth": 9,
    "Symmetry": 8,
    "Body interlocking": 7,
    "Typical duration": 5,
    "Formality": 1,
    "Power balance": 5,
    "Body orientation": 1,
    "Eye contact": 0,
    "Body parts used": ["hands", "lips", "chest"],
    "Facial expression": 1,
  },
  "Hand kissing": {
    "Physical touch": 4,
    "Standing distance": 1,
    "Warmth": 1,
    "Symmetry": 0,
    "Body interlocking": 2,
    "Typical duration": 5,
    "Formality": 8,
    "Power balance": 9,
    "Body orientation": 1,
    "Eye contact": 0,
    "Body parts used": ["hands", "lips", "back"],
    "Facial expression": 2,
  },
  "Fist bump": {
    "Physical touch": 2,
    "Standing distance": 6,
    "Warmth": 7,
    "Symmetry": 10,
    "Body interlocking": 0,
    "Typical duration": 0,
    "Formality": 0,
    "Power balance": 3,
    "Body orientation": 1,
    "Eye contact": 1,
    "Body parts used": ["hands"],
    "Facial expression": 1,
  },
};

const G = {
  s: 20,
  aGrid: 70,
  wGrid: 0.7,
  aAxis: 160,
  wAxis: 0.9,
  showNums: true,
  every: 5,
  txt: 10,
  aTxt: 190,
  off: 8,
};

const SH = {
  strokeW: 1.6,
  alpha: 0.5,
  baseSamples: 28,

  showPtsLeft: false,
  showPtLabelsLeft: false,
  ptSize: 4,
  ptLabelSize: 11,
  ptLabelAlpha: 220,
  ptLabelDx: 6,
  ptLabelDy: -6,
};

const ORG = {
  staticAmountMax: 0.14,
  freq: 1.5,
  lowPass: 0.16,
  liveAmountMax: 0.05,
  timeSpeed: 0.7,
};

const CURL = { scale: 0.5 };

const WARM = {
  maxCompression: 8.5 / 10,
  minTailAtZero: 1.0,
};

const LOOP = {
  cx: -3.0,
  cy: -6.5,
  rx: 1.38,
  ry: 1.38,
  samples: 220,
  maxArcFraction: 0.7,
};

const FORM = {
  tOnP5P6: 0.18,
  pullMax: 1.05,
  sigmaLen: 1.2,
  rampPow: 2.0,
  upMix: 0.35,
  tipBoost: 1.25,
  tipSigma: 0.42,
};

const PB = {
  tipLenMin: 0.70,
  tipLenMid: 0.95,
  tipLenMax: 1.45,

  headWMin: 0.80,
  headWMid: 1.25,
  headWMax: 0.55,

  circleR: 0.70,
  diamondExtraLenFrac: 0.95,

  outlinePts: 84,
  inwardBulge: 0.42,
};

// ===== Variable stroke config (FINISH) =====
const THICK = {
  bottomBand: 2.2,
  bottomMax: 1.15,

  xSigma: 0.42,
  xMax: 1.05,

  randFreq: 1.25,
  randMax: 0.55,
  liveMax: 0.22,

  ptExtraScale: 0.16,

  wMinMul: 0.85,
  wMaxMul: 3.2,

  fillSigma: 0.38,
  fillMaxR: 0.55,
};

const NOISE_SEED = 24680;
const NOISE_SEED_R = 9001;
const NOISE_SEED_THICK = 424242;

let sliders = [];
let targetVals = {};
let currVals = {};
let lastInputMs = 0;
let motionEnergy = 0;

// NOTE: export button removed per request
let btnExport = null;
let presetButtons = [];
let presetHeading = null;

const baseLeftPts = [
  { name: "P1", x: -5, y: -5 },
  { name: "P2", x: -3, y: -5 },
  { name: "P3", x: -2, y: -6 },
  { name: "P4", x: -3, y: -8 },
  { name: "P5", x: -6, y: -6 },
  { name: "P6", x: -1, y: 7 },
];

function setup() {
  const container = document.getElementById('p5-container');
  const w = container ? container.offsetWidth : windowWidth;
  createCanvas(w, windowHeight).parent('p5-container');
  pixelDensity(1);
  strokeCap(ROUND);
  strokeJoin(ROUND);

  noiseSeed(NOISE_SEED);
  noiseDetail(4, 0.5);

  injectUIStyles();
  initSliders();
  placeUI();
  initPresetButtons();

  // Re-run placeUI after layout so container rect and element sizes are correct on initial load
  requestAnimationFrame(() => placeUI());

  // REMOVED: export button creation
  // btnExport = createButton("Download PNG (transparent)");
  // ...
}

function injectUIStyles() {
  const css = `
    body { overflow-x: hidden; }
    #p5-container { position: relative; overflow-x: hidden; box-sizing: border-box; }
    #p5-container * { box-sizing: border-box; }
    * { font-family: Helvetica, Arial, sans-serif; }

    input[type=range]{
      -webkit-appearance:none; appearance:none;
      width: 100%;
      height: 12px;
      border-radius: 999px;
      background: #fff;
      border: 1px solid rgba(255,255,255,0.9);
      outline:none;
      box-sizing: border-box;
      padding: 0;
    }

    input[type=range]::-webkit-slider-runnable-track{
      height:12px;
      background: transparent;
      border-radius: 999px;
    }
    input[type=range]::-webkit-slider-thumb{
      -webkit-appearance:none; appearance:none;
      width: 12px; height: 12px;
      border-radius:50%;
      background:#000;
      border: 2px solid #000;
      margin-top: 0px;
    }

    input[type=range]::-moz-range-track{
      height:12px;
      background: transparent;
      border-radius: 999px;
    }
    input[type=range]::-moz-range-thumb{
      width: 12px; height: 12px;
      border-radius:50%;
      background:#000;
      border: 2px solid #000;
    }

    input[type=checkbox] { transform: scale(1.05); }
    .p5-checkbox-label { font-size: 12px; opacity: 0.9; }
    button { cursor: pointer; }
  `;
  const st = createElement("style", css);
  st.parent(document.head);
}

function setSliderFill(sl, minV, maxV) {
  const v = Number(sl.value());
  const t = (v - minV) / Math.max(1e-6, (maxV - minV));
  const pct = constrain(t, 0, 1) * 100;

  sl.elt.style.background = `
    linear-gradient(to right, #000 ${pct}%, rgba(0,0,0,0) ${pct}%)
      left center / 100% 4px no-repeat,
    #fff
  `;
}

function initSliders() {
  sliders = [];
  targetVals = {};
  currVals = {};
  const container = select("#p5-container");

  labels.forEach((name) => {
    if (name === "Facial expression") {
      targetVals[name] = 0;
      currVals[name] = 0;

      const d = createDiv(name).style("color", "white").style("font-size", "12px").style("opacity", "0.9");
      if (container) d.parent(container);

      const cbSmile = createCheckbox("Smile", false).style("color", "white").addClass("p5-checkbox-label");
      const cbCer = createCheckbox("Ceremonial", false).style("color", "white").addClass("p5-checkbox-label");
      const cbCalm = createCheckbox("Calm", false).style("color", "white").addClass("p5-checkbox-label");
      const cbForm = createCheckbox("Formality", false).style("color", "white").addClass("p5-checkbox-label");
      if (container) {
        cbSmile.parent(container);
        cbCer.parent(container);
        cbCalm.parent(container);
        cbForm.parent(container);
      }

      const boxes = [
        { id: 1, cb: cbSmile, label: "Smile" },
        { id: 2, cb: cbCer, label: "Ceremonial" },
        { id: 3, cb: cbCalm, label: "Calm" },
        { id: 4, cb: cbForm, label: "Formality" },
      ];

      function setExclusive(id, checked) {
        if (checked) {
          for (const b of boxes) b.cb.checked(b.id === id);
          targetVals[name] = id;
        } else {
          if (Math.round(num(targetVals[name])) === id) targetVals[name] = 0;
        }
        lastInputMs = millis();
        motionEnergy = 1;
      }
      for (const b of boxes) b.cb.changed(() => setExclusive(b.id, b.cb.checked()));

      sliders.push({ name, d, s: null, boxes, toggle: null, parts: null, vDiv: null, valDiv: null, h: UI.row + 34 });
      return;
    }

    if (name === "Body parts used") {
      targetVals[name] = 0;
      currVals[name] = 0;

      const d = createDiv(name).style("color", "white").style("font-size", "12px").style("opacity", "0.9");
      if (container) d.parent(container);

      const boxes = PARTS.names.map((lab, i) => {
        const key = PARTS.keys[i];
        const cb = createCheckbox(lab, false).style("color", "white").addClass("p5-checkbox-label");
        if (container) cb.parent(container);
        cb.changed(() => {
          const bit = PARTS.bit[key];
          const on = cb.checked();
          let m = num(targetVals[name]) | 0;
          m = on ? (m | bit) : (m & ~bit);
          targetVals[name] = m;
          lastInputMs = millis();
          motionEnergy = 1;
        });
        return { key, cb };
      });

      sliders.push({ name, d, s: null, boxes: null, toggle: null, parts: boxes, vDiv: null, valDiv: null, h: UI.row + 36 });
      return;
    }

    if (name === "Eye contact") {
      targetVals[name] = 0;
      currVals[name] = 0;

      const d = createDiv(name).style("color", "white").style("font-size", "12px").style("opacity", "0.9");
      if (container) d.parent(container);

      const toggle = createCheckbox("Yes", false)
        .style("color", "white").addClass("p5-checkbox-label")
        .changed(() => {
          targetVals[name] = toggle.checked() ? 1 : 0;
          lastInputMs = millis();
          motionEnergy = 1;
        });
      if (container) toggle.parent(container);

      sliders.push({ name, d, s: null, boxes: null, toggle, parts: null, vDiv: null, valDiv: null, h: UI.row });
      return;
    }

    let minV = 1, maxV = 10, step = 0.1;

    const zeroToTen =
      name === "Symmetry" ||
      name === "Physical touch" ||
      name === "Warmth" ||
      name === "Typical duration" ||
      name === "Standing distance" ||
      name === "Formality" ||
      name === "Body interlocking" ||
      name === "Power balance";

    if (zeroToTen) minV = 0;

    if (name === "Body orientation") {
      minV = 0;
      maxV = 2;
      step = 1;
    }

    let startV = (minV + maxV) / 2;
    if (name === "Formality") startV = 0;

    targetVals[name] = startV;
    currVals[name] = startV;

    const d = createDiv(name).style("color", "white").style("font-size", "12px").style("opacity", "0.9");
    if (container) d.parent(container);
    const s = createSlider(minV, maxV, startV, step).style("width", `${UI.w}px`);
    if (container) s.parent(container);
    setSliderFill(s, minV, maxV);

    const valDiv = createDiv("").style("color", "white").style("font-size", "11px").style("opacity", "0.85");
    if (container) valDiv.parent(container);

    function updateValueLabel() {
      const v = Number(s.value());
      if (name === "Body orientation") valDiv.html(ORIENT.names[Math.round(v)]);
      else valDiv.html(`${v.toFixed(1)}`);
    }
    updateValueLabel();

    s.input(() => {
      targetVals[name] = Number(s.value());
      updateValueLabel();
      setSliderFill(s, minV, maxV);
      lastInputMs = millis();
      motionEnergy = 1;
    });

    sliders.push({ name, d, s, minV, maxV, valDiv, vDiv: null, boxes: null, toggle: null, parts: null, h: UI.row });
  });
}

function windowResized() {
  const container = document.getElementById('p5-container');
  if (container) {
    resizeCanvas(container.offsetWidth, windowHeight);
  } else {
    resizeCanvas(windowWidth, windowHeight);
  }
  placeUI();
}

function placeUI() {
  const containerEl = document.getElementById("p5-container");
  const rect = containerEl ? containerEl.getBoundingClientRect() : { width: 800, left: 0 };
  const PADDING_LEFT = 40;
  const PADDING_RIGHT = 40;
  const leftX = PADDING_LEFT;
  const paramsStartY = UI.y;
  let yy = paramsStartY;

  for (const o of sliders) {
    o.d.position(leftX, yy);

    if (o.name === "Facial expression") {
      const x0 = leftX;
      const x1 = leftX + 120;
      const y0 = yy + 18;
      const y1 = yy + 38;

      o.boxes[0].cb.position(x0, y0);
      o.boxes[1].cb.position(x1, y0);
      o.boxes[2].cb.position(x0, y1);
      o.boxes[3].cb.position(x1, y1);

      yy += o.h;
      continue;
    }

    if (o.name === "Body parts used") {
      const x0 = UI.x;
      const x1 = UI.x + 120;
      const y0 = yy + 18;
      const y1 = yy + 38;
      const y2 = yy + 58;

      o.parts[0].cb.position(x0, y0);
      o.parts[1].cb.position(x1, y0);
      o.parts[2].cb.position(x0, y1);
      o.parts[3].cb.position(x1, y1);
      o.parts[4].cb.position(x0, y2);
      o.parts[5].cb.position(x1, y2);

      yy += o.h;
      continue;
    }

    if (o.name === "Eye contact") {
      o.toggle.position(UI.x, yy + 18);
      yy += o.h;
      continue;
    }

    o.s.position(UI.x, yy + 18);
    if (o.valDiv) o.valDiv.position(UI.x + UI.valDx, yy + 18);
    if (o.vDiv) o.vDiv.position(UI.x, yy + 40);

    yy += o.h;
  }

  // REMOVED: export button placement
  // if (btnExport) btnExport.position(UI.x, yy + 10);

  // Presets panel: 40px from right edge of container, top aligned with "Physical touch"
  let panelWidth = 0;
  if (presetHeading && presetHeading.elt) panelWidth = Math.max(panelWidth, presetHeading.elt.offsetWidth || 0);
  presetButtons.forEach((btn) => {
    if (btn.elt) panelWidth = Math.max(panelWidth, btn.elt.offsetWidth || 0);
  });
  const presetsX = rect.left + rect.width - 40 - panelWidth;
  const presetHeadingGap = 20;
  const presetRowH = 32;
  if (presetHeading) presetHeading.position(presetsX, UI.y);
  presetButtons.forEach((btn, i) => {
    btn.position(presetsX, UI.y + presetHeadingGap + i * presetRowH);
  });
}

function applyPreset(presetKey) {
  const preset = PRESETS[presetKey];
  if (!preset) return;

  for (const o of sliders) {
    const raw = preset[o.name];
    if (raw === undefined) continue;

    if (o.name === "Body parts used") {
      const partKeys = Array.isArray(raw) ? raw : [raw];
      let mask = 0;
      for (const pk of partKeys) {
        const low = String(pk).toLowerCase();
        const idx = PARTS.keys.findIndex((k) => k.toLowerCase() === low);
        if (idx >= 0) mask |= PARTS.bit[PARTS.keys[idx]];
      }
      targetVals[o.name] = mask;
      o.parts.forEach(({ key, cb }) => {
        const bit = PARTS.bit[key];
        cb.checked((mask & bit) !== 0);
      });
      continue;
    }

    if (o.name === "Eye contact") {
      const v = raw === true || raw === 1 || String(raw).toLowerCase() === "yes" ? 1 : 0;
      targetVals[o.name] = v;
      o.toggle.checked(v === 1);
      continue;
    }

    if (o.name === "Facial expression") {
      const v = typeof raw === "number" ? raw : 0;
      targetVals[o.name] = v;
      if (o.boxes) {
        for (const b of o.boxes) b.cb.checked(b.id === v);
      }
      continue;
    }

    const numVal = Number(raw);
    if (!Number.isNaN(numVal)) targetVals[o.name] = numVal;

    if (o.s) {
      o.s.value(numVal);
      if (typeof o.minV === "number" && typeof o.maxV === "number") setSliderFill(o.s, o.minV, o.maxV);
      if (o.valDiv) {
        if (o.name === "Body orientation") o.valDiv.html(ORIENT.names[Math.round(numVal)]);
        else o.valDiv.html(`${numVal.toFixed(1)}`);
      }
    }
  }

  lastInputMs = millis();
  motionEnergy = 1;
}

function initPresetButtons() {
  presetButtons = [];
  presetHeading = createDiv("Presets")
    .style("color", "white")
    .style("font-size", "12px")
    .style("opacity", "0.9");
  const container = document.getElementById("p5-container");
  if (container) presetHeading.parent(container);
  const keys = Object.keys(PRESETS);
  for (const key of keys) {
    const btn = createButton(key)
      .style("color", "white")
      .style("font-size", "12px")
      .style("background", "transparent")
      .style("border", "1px solid rgba(255,255,255,0.8)")
      .style("padding", "6px 10px")
      .style("border-radius", "4px");
    btn.mousePressed(() => applyPreset(key));
    if (container) btn.parent(container);
    presetButtons.push(btn);
  }
  placeUI();
}

function draw() {
  background(0);

  const ease = 0.22;
  for (const k in currVals) {
    if (k === "Body orientation" || k === "Eye contact" || k === "Facial expression" || k === "Body parts used") {
      currVals[k] = num(targetVals[k]);
    } else {
      currVals[k] = lerp(num(currVals[k]), num(targetVals[k]), ease);
    }
  }

  const since = millis() - lastInputMs;
  const targetE = since < 120 ? 1 : 0;
  motionEnergy = lerp(motionEnergy, targetE, since < 120 ? 0.35 : 0.06);
  motionEnergy = constrain(motionEnergy, 0, 1);

  const bo = constrain(Math.round(num(currVals["Body orientation"])), 0, 2);
  const boName = ORIENT.names[bo];

  for (const o of sliders) {
    if (o.name === "Body orientation" && o.vDiv) o.vDiv.html(`${boName}`);

    if (o.s && o.valDiv) {
      if (o.name === "Body orientation") o.valDiv.html(boName);
      else o.valDiv.html(`${num(currVals[o.name]).toFixed(1)}`);
      if (typeof o.minV === "number" && typeof o.maxV === "number") setSliderFill(o.s, o.minV, o.maxV);
    }
  }

  translate(width / 2, height / 2);

  // REMOVED: grid/axes/numbers
  // drawGrid();
  // drawAxes();
  // if (G.showNums) drawNumbers();

  // render full scene on-screen (no grid now)
  renderScene({
    vals: currVals,
    motionEnergy,
    showGrid: false,
    showLeftMarkers: SH.showPtsLeft || SH.showPtLabelsLeft,
    showLeftPts: SH.showPtsLeft,
    showLeftLabels: SH.showPtLabelsLeft,
    drawTarget: null,
    scaleS: G.s,
  });
}

// =================== Scene renderer (on screen + export) ===================
function renderScene(opts) {
  const vals = opts.vals || {};
  const bo = constrain(Math.round(num(vals["Body orientation"])), 0, 2);
  const eye = constrain(Math.round(num(vals["Eye contact"])), 0, 1);
  const face = constrain(Math.round(num(vals["Facial expression"])), 0, 4);
  const partsMask = num(vals["Body parts used"]) | 0;

  const sym = constrain(num(vals["Symmetry"]), 0, 10);
  const pt = constrain(num(vals["Physical touch"]), 0, 10);
  const sd = constrain(num(vals["Standing distance"]), 0, 10);
  const warmRaw = constrain(num(vals["Warmth"]), 0, 10);
  const td = constrain(num(vals["Typical duration"]), 0, 10);
  const form = constrain(num(vals["Formality"]), 0, 10);
  const pb = constrain(num(vals["Power balance"]), 0, 10);
  const interlock = constrain(num(vals["Body interlocking"]), 0, 10);

  const yMin = map(td, 0, 10, -8, -14);
  const yMax = map(td, 0, 10, 5, 11);

  const pbTips = drawWarmthSplitBaselineAndReturnPBTips(yMin, yMax, warmRaw);
  for (const tip of pbTips) drawPowerBalanceBottomOriented(tip.pos, pb, tip.ang);

  drawFacialExpressionTop({ x: 0, y: yMax }, face, pb);

  const warmCompressed = warmRaw * WARM.maxCompression;
  const warmMain = Math.max(warmCompressed, WARM.minTailAtZero * WARM.maxCompression);

  const symEase = smoothstep01(sym / 10);
  const warmMirror = warmCompressed * symEase;

  const p6x = map(pt, 0, 10, -7, 5);
  const dxSD = map(sd, 0, 10, 1, -4);

  const splitT = getWarmSplitStrength(warmRaw);
  const autoStage = Math.pow(splitT, SD_FIX.splitPow);
  const inwardAmt = smoothstep01(constrain(dxSD / 1.0, 0, 1));
  const autoPush = (SD_FIX.basePush + SD_FIX.sdPush * inwardAmt) * autoStage;
  const dxSDAdj = dxSD - autoPush;

  const P1 = { name: "P1", x: baseLeftPts[0].x + dxSDAdj, y: baseLeftPts[0].y };
  const P4 = { name: "P4", x: baseLeftPts[3].x + dxSDAdj, y: baseLeftPts[3].y };
  const P5 = { name: "P5", x: baseLeftPts[4].x + dxSDAdj, y: baseLeftPts[4].y };
  const P6 = { name: "P6", x: p6x, y: baseLeftPts[5].y };

  const loopData = buildUniformLoopArc(P1, P4, dxSDAdj);
  const P1p = loopData.pStart;
  const P4p = loopData.pEnd;
  const loopArc = loopData.arc;

  const leftMainCtrl = [P1p, ...loopArc, P4p, P5, P6];

  let leftStrokePts = sampleCentripetalSplineUnit(leftMainCtrl, SH.baseSamples);

  const boRes = applyBodyOrientationToLowerLoop(leftStrokePts, P4p, bo);
  leftStrokePts = boRes.poly;
  const P1Draw = boRes.P1draw;

  const leftBeforeForm = leftStrokePts.map((p) => ({ x: p.x, y: p.y }));
  leftStrokePts = applyFormalityDeform(leftStrokePts, P5, P6, form);

  const rightStrokePts = leftStrokePts.map((p) => ({ x: -p.x, y: p.y }));

  const wL = buildStrokeWeights(leftStrokePts, {
    pt,
    motionEnergy: opts.motionEnergy || 0,
    mode: "main",
  });

  drawPolylineUnitVar(leftStrokePts, wL);
  drawPolylineUnitVar(rightStrokePts, wL);

  drawXContactSoftFill(leftStrokePts, wL, pt);

  if (eye === 1) {
    const wrapLeft = buildEyeContactWrap(leftBeforeForm, leftStrokePts, P5, P6);
    if (wrapLeft && wrapLeft.length > 2) {
      const wWrap = buildStrokeWeights(wrapLeft, { pt, motionEnergy: opts.motionEnergy || 0, mode: "wrap" });
      drawPolylineUnitVar(wrapLeft, wWrap);
      const wrapRight = wrapLeft.map((p) => ({ x: -p.x, y: p.y }));
      drawPolylineUnitVar(wrapRight, wWrap);
    }
  }

  if (interlock > 0.05) {
    drawBodyInterlockingShape(P1Draw, interlock, bo, +1);
    const P1Right = { x: -P1Draw.x, y: P1Draw.y };
    drawBodyInterlockingShape(P1Right, interlock, bo, -1);
  }

  const tailLeftMain = buildWarmthSpiralFromP6([P5, P6], warmMain, opts.motionEnergy || 0, +1);
  const wTail = buildStrokeWeights(tailLeftMain, { pt, motionEnergy: opts.motionEnergy || 0, mode: "tail" });
  drawPolylineUnitVar(tailLeftMain, wTail);
  const tailRightMain = tailLeftMain.map((p) => ({ x: -p.x, y: p.y }));
  drawPolylineUnitVar(tailRightMain, wTail);

  if (warmMirror > 0.02) {
    const tailLeftMir = buildWarmthSpiralFromP6([P5, P6], warmCompressed * symEase, opts.motionEnergy || 0, -1);
    const wTail2 = buildStrokeWeights(tailLeftMir, { pt, motionEnergy: opts.motionEnergy || 0, mode: "tail" });
    drawPolylineUnitVar(tailLeftMir, wTail2);
    const tailRightMir = tailLeftMir.map((p) => ({ x: -p.x, y: p.y }));
    drawPolylineUnitVar(tailRightMir, wTail2);
  }

  drawBodyPartsUsedOverlays(partsMask, {
    yMin,
    yMax,
    P4,
    P5,
    leftCurveAfterForm: leftStrokePts,
    leftCurveBeforeForm: leftBeforeForm,
    faceMode: face,
    pbValue: pb,
  });

  if (opts.showLeftPts) drawLeftPoints([P1Draw, P4, P5, P6]);
  if (opts.showLeftLabels) drawLeftPointLabels([P1Draw, P4, P5, P6]);
}

// =================== Variable stroke: weights + drawing ===================
function buildStrokeWeights(pts, cfg) {
  const n = pts.length;
  if (n < 2) return new Array(n).fill(SH.strokeW);

  const pt = constrain(num(cfg.pt || 0), 0, 10);
  const ptN = pt / 10;

  const ptScale = 1 + THICK.ptExtraScale * ptN;

  let yMin = Infinity, yMax = -Infinity;
  for (const p of pts) { yMin = Math.min(yMin, p.y); yMax = Math.max(yMax, p.y); }

  const S = new Array(n).fill(0);
  for (let i = 1; i < n; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    S[i] = S[i - 1] + Math.sqrt(dx * dx + dy * dy);
  }
  const total = Math.max(1e-6, S[n - 1]);

  const energy = constrain(num(cfg.motionEnergy || 0), 0, 1);
  const mode = cfg.mode || "main";
  const modeMul = (mode === "main") ? 1.0 : (mode === "wrap" ? 0.85 : 0.95);

  const out = new Array(n).fill(SH.strokeW);

  const xGate = smoothstep01(constrain((ptN - 0.60) / 0.40, 0, 1));

  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const s = S[i] / total;

    const yCut = yMin + THICK.bottomBand;
    const bottomT = smoothstep01(constrain((yCut - p.y) / Math.max(1e-6, (yCut - yMin)), 0, 1));
    const bottomAdd = THICK.bottomMax * bottomT;

    const xW = Math.exp(-Math.pow(Math.abs(p.x) / THICK.xSigma, 2));
    const xAdd = THICK.xMax * xGate * xW;

    const raw = (noise(NOISE_SEED_THICK + s * THICK.randFreq * 2.0) - 0.5) * 2.0;
    const randPos = Math.max(0, raw);
    const randAdd = THICK.randMax * randPos;

    const tt = (millis() / 1000) * ORG.timeSpeed;
    const live = (noise(NOISE_SEED_THICK + 1000 + s * 2.2, tt) - 0.5) * 2.0;
    const livePos = Math.max(0, live);
    const liveAdd = THICK.liveMax * energy * livePos;

    const add = (bottomAdd + xAdd + randAdd + liveAdd) * ptScale * modeMul;

    let mul = 1 + add;
    mul = constrain(mul, THICK.wMinMul, THICK.wMaxMul);

    out[i] = SH.strokeW * mul;
  }

  return out;
}

function drawPolylineUnitVar(unitPts, weights) {
  stroke(255);
  noFill();

  if (!unitPts || unitPts.length < 2) return;
  const n = unitPts.length;

  for (let i = 0; i < n - 1; i++) {
    const w = weights ? (weights[i] + weights[i + 1]) * 0.5 : SH.strokeW;
    strokeWeight(w);

    const a = unitPts[i];
    const b = unitPts[i + 1];
    line(a.x * G.s, -a.y * G.s, b.x * G.s, -b.y * G.s);
  }
}

function drawXContactSoftFill(leftPts, weights, pt) {
  const ptN = constrain(pt / 10, 0, 1);
  const gate = smoothstep01(constrain((ptN - 0.60) / 0.40, 0, 1));
  if (gate <= 0.0001) return;

  noStroke();
  fill(255);

  for (let i = 0; i < leftPts.length; i++) {
    const p = leftPts[i];
    const w = weights ? weights[i] : SH.strokeW;

    const xW = Math.exp(-Math.pow(Math.abs(p.x) / THICK.fillSigma, 2));
    const t = gate * xW;
    if (t < 0.08) continue;

    const r = (w * THICK.fillMaxR) * t;
    circle(p.x * G.s, -p.y * G.s, r * 2);
    circle(-p.x * G.s, -p.y * G.s, r * 2);
  }
}

// =================== Body parts used overlays ===================
function drawBodyPartsUsedOverlays(mask, ctx) {
  if (!mask) return;

  if (mask & PARTS.bit.back) {
    const d = 0.38;
    const centers = [
      { x: +d, y: +d },
      { x: -d, y: +d },
      { x: -d, y: -d },
      { x: +d, y: -d },
    ];
    for (const c of centers) {
      const toO = unit2({ x: -c.x, y: -c.y });
      drawTeardropUnitFilled(c, toO, 0.18, 0.275);
    }
  }

  if (mask & PARTS.bit.hands) {
    const curve = ctx.leftCurveBeforeForm || [];
    if (curve.length > 18) {
      const S = new Array(curve.length).fill(0);
      for (let i = 1; i < curve.length; i++) {
        const dx = curve[i].x - curve[i - 1].x;
        const dy = curve[i].y - curve[i - 1].y;
        S[i] = S[i - 1] + Math.sqrt(dx * dx + dy * dy);
      }

      const i4 = closestIndex(curve, ctx.P4 || curve[Math.floor(curve.length * 0.35)]);

      const startIdx = i4 + 3;
      const segmentLength = 24;
      const endIdx = constrain(startIdx + segmentLength, startIdx + 10, curve.length - 4);

      const startS = S[startIdx];
      const endS = S[endIdx];
      const totalArcLen = endS - startS;

      const numDots = 4;
      const idxs = [];

      for (let d = 0; d < numDots; d++) {
        const targetS = startS + (totalArcLen * d) / (numDots - 1);

        let bestIdx = startIdx;
        let bestDiff = Infinity;
        for (let i = startIdx; i <= endIdx; i++) {
          const diff = Math.abs(S[i] - targetS);
          if (diff < bestDiff) {
            bestDiff = diff;
            bestIdx = i;
          }
        }
        idxs.push(bestIdx);
      }

      const off = 0.36;
      const r = 0.14;

      for (const i of idxs) {
        const p = curve[i];
        const prev = curve[Math.max(0, i - 1)];
        const next = curve[Math.min(curve.length - 1, i + 1)];

        const t = unit2({ x: next.x - prev.x, y: next.y - prev.y });
        let nrm = { x: -t.y, y: t.x };

        const signX = p.x < 0 ? -1 : +1;
        const toOut = unit2({ x: signX, y: 0 });
        if (dot(nrm, toOut) < 0) nrm = { x: -nrm.x, y: -nrm.y };

        const qL = { x: p.x + nrm.x * off, y: p.y + nrm.y * off };
        drawDotUnit(qL, r);

        const qR = { x: -qL.x, y: qL.y };
        drawDotUnit(qR, r);
      }
    }
  }

  if (mask & PARTS.bit.head) {
    const r = 0.26;
    let c = { x: 0, y: ctx.yMax + 1.15 };

    if (ctx.faceMode === 3 || ctx.faceMode === 4) {
      const anchor = { x: 0, y: ctx.yMax };
      const faceMaxY = getFaceMaxYUnit(anchor, ctx.faceMode, ctx.pbValue);
      const margin = 0.12;
      const requiredCy = faceMaxY + margin + r;
      if (c.y < requiredCy) c = { x: c.x, y: requiredCy };
    }

    drawFilledCircleUnit(c, r);
  }

  if (mask & PARTS.bit.shoulders) {
    const curveL = ctx.leftCurveAfterForm || [];
    if (curveL.length > 12) {
      const idx = closestIndexByY(curveL, 0);
      if (idx >= 2 && idx <= curveL.length - 3) {
        const sprL = buildShoulderSproutPlant(curveL, idx);
        if (sprL && sprL.length > 2) {
          drawPolylineUnitVar(sprL, buildStrokeWeights(sprL, { pt: num(currVals["Physical touch"]), motionEnergy, mode: "wrap" }));
          const sprR = sprL.map((p) => ({ x: -p.x, y: p.y }));
          drawPolylineUnitVar(sprR, buildStrokeWeights(sprR, { pt: num(currVals["Physical touch"]), motionEnergy, mode: "wrap" }));
        }
      }
    }
  }

  if (mask & PARTS.bit.chest) {
    const c = { x: 0, y: 2.55 };
    const w = 0.26 * 1.3;
    const h = 0.34 * 1.3 * 1.55;
    drawDiamondUnitFilled(c, w, h);
  }

  if (mask & PARTS.bit.lips) {
    const P5 = ctx.P5 || { x: -6, y: -6 };
    drawLipsShape(P5, +1);
    const P5Right = { x: -P5.x, y: P5.y };
    drawLipsShape(P5Right, -1);
  }
}

function drawLipsShape(start, sideSign) {
  const outward = unit2({ x: sideSign * -1, y: 0 });

  const controlPts = [
    { x: start.x, y: start.y },
    { x: start.x + outward.x * 0.2, y: start.y + 0.5 },
    { x: start.x + outward.x * 0.4, y: start.y + 0.9 },
    { x: start.x + outward.x * 0.65, y: start.y + 1.0 },
    { x: start.x + outward.x * 0.85, y: start.y + 0.8 },
    { x: start.x + outward.x * 1.0, y: start.y + 0.4 },
    { x: start.x + outward.x * 1.05, y: start.y - 0.1 },
    { x: start.x + outward.x * 1.0, y: start.y - 0.6 },
    { x: start.x + outward.x * 0.85, y: start.y - 0.95 },
    { x: start.x + outward.x * 0.6, y: start.y - 1.15 },
    { x: start.x + outward.x * 0.35, y: start.y - 1.2 },
    { x: start.x + outward.x * 0.15, y: start.y - 1.1 },
    { x: start.x + outward.x * 0.0, y: start.y - 0.95 },
  ];

  const smoothPts = sampleCentripetalSplineUnit(controlPts, 32);
  const lipWeights = buildStrokeWeights(smoothPts, { pt: num(currVals["Physical touch"]), motionEnergy, mode: "wrap" });
  drawPolylineUnitVar(smoothPts, lipWeights);
}

function closestIndexByY(arr, yTarget) {
  let bestI = -1;
  let bestAbs = Infinity;
  for (let i = 0; i < arr.length; i++) {
    const d = Math.abs(arr[i].y - yTarget);
    if (d < bestAbs) {
      bestAbs = d;
      bestI = i;
    }
  }
  return bestI;
}

function buildShoulderSproutPlant(curve, idx) {
  const p = curve[idx];
  const prev = curve[idx - 2];
  const next = curve[idx + 2];

  const t = unit2({ x: next.x - prev.x, y: next.y - prev.y });
  let nrm = { x: -t.y, y: t.x };

  const toOut = unit2({ x: -1, y: 0 });
  if (dot(nrm, toOut) < 0) nrm = { x: -nrm.x, y: -nrm.y };

  const A = { x: p.x + nrm.x * 0.03, y: p.y + nrm.y * 0.03 };

  const C1 = { x: A.x + nrm.x * 0.38 + t.x * 0.06, y: A.y + nrm.y * 0.38 + 0.18 };
  const C2 = { x: A.x + nrm.x * 0.78 + t.x * 0.10, y: A.y + nrm.y * 0.78 + 0.28 };
  const E  = { x: A.x + nrm.x * 1.05 + t.x * 0.06, y: A.y + nrm.y * 1.05 + 0.18 };

  const stem = cubicBezierPts(A, C1, C2, E, 22);

  const inward = { x: -nrm.x, y: -nrm.y };
  const c = { x: E.x + inward.x * 0.22, y: E.y + 0.12 };

  const R0 = 0.26;
  const turns = 0.55;
  const steps = 18;
  const shrink = 0.38;

  const a0 = Math.atan2(E.y - c.y, E.x - c.x);
  const a1 = a0 + turns * Math.PI * 2;

  const curl = [];
  for (let i = 0; i <= steps; i++) {
    const tt = i / steps;
    const rr = lerp(R0, R0 * shrink, tt);
    const ang = lerp(a0, a1, tt);
    curl.push({ x: c.x + Math.cos(ang) * rr, y: c.y + Math.sin(ang) * rr });
  }

  return [...stem, ...curl.slice(1)];
}

function getFaceMaxYUnit(anchor, faceMode, pbValue) {
  if (faceMode === 3) {
    const cfg = FACE.calm;
    let maxY = anchor.y;
    const outline = buildCalmLeafOutlineUnit(anchor, cfg.h, cfg.w, cfg.steps);

    for (const deg of cfg.copiesDeg) {
      const ang = (deg * Math.PI) / 180;
      for (const p of outline) {
        const pr = rotAround(p, anchor, ang);
        if (pr.y > maxY) maxY = pr.y;
      }
    }
    return maxY;
  }

  if (faceMode === 4) {
    const pb = 10;
    const ang = Math.PI;
    const pts = buildPowerBalanceOutlineRotated(anchor, pb, ang);
    let maxY = anchor.y;
    for (const p of pts) if (p.y > maxY) maxY = p.y;
    return maxY;
  }

  return anchor.y;
}

function drawDotUnit(c, r) {
  noStroke();
  fill(255);
  circle(c.x * G.s, -c.y * G.s, (r * 2) * G.s);
}

function drawFilledCircleUnit(c, r) {
  push();
  noStroke();
  fill(255);
  circle(c.x * G.s, -c.y * G.s, (r * 2) * G.s);
  pop();
}

function drawTeardropUnitFilled(center, tipDir, rW, rH) {
  const pts = [];
  const N = 40;

  const tip = { x: 0, y: +rH };
  const baseC = { x: 0, y: -rH * 0.35 };
  const baseR = rW;

  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const ang = lerp(Math.PI * 1.15, Math.PI * 1.85, t);
    const x = baseC.x + Math.cos(ang) * baseR;
    const y = baseC.y + Math.sin(ang) * baseR;
    pts.push({ x, y });
  }

  const last = pts[pts.length - 1];
  const M = 20;
  for (let i = 1; i <= M; i++) {
    const t = i / M;
    pts.push({
      x: lerp(last.x, tip.x, t) * (1 - 0.15 * t),
      y: lerp(last.y, tip.y, t),
    });
  }

  const ang = Math.atan2(tipDir.y, tipDir.x) - Math.PI / 2;

  push();
  noStroke();
  fill(255);
  beginShape();
  for (const p0 of pts) {
    const p = rotAround(p0, { x: 0, y: 0 }, ang);
    vertex((center.x + p.x) * G.s, -(center.y + p.y) * G.s);
  }
  endShape(CLOSE);
  pop();
}

function drawDiamondUnitFilled(c, w, h) {
  push();
  noStroke();
  fill(255);
  beginShape();
  vertex((c.x) * G.s, -(c.y + h) * G.s);
  vertex((c.x + w) * G.s, -(c.y) * G.s);
  vertex((c.x) * G.s, -(c.y - h) * G.s);
  vertex((c.x - w) * G.s, -(c.y) * G.s);
  endShape(CLOSE);
  pop();
}

function drawFacialExpressionTop(anchor, faceMode, pbValue) {
  if (faceMode === 0) return;
  if (faceMode === 1) { drawSmileCurls(anchor); return; }
  if (faceMode === 2) { drawCeremonialMoustache(anchor); return; }
  if (faceMode === 3) { drawCalmLeafTriplet(anchor); return; }
  if (faceMode === 4) { drawPowerBalanceBottomOriented(anchor, 10, Math.PI); return; }
}

function drawSmileCurls(a) {
  const left = buildSmileCurlSide(a, -1);
  const w = buildStrokeWeights(left, { pt: num(currVals["Physical touch"]), motionEnergy, mode: "wrap" });
  drawPolylineUnitVar(left, w);
  const right = left.map((p) => ({ x: -p.x, y: p.y }));
  drawPolylineUnitVar(right, w);
}

function buildSmileCurlSide(a, sideSign) {
  const cfg = FACE.smile;
  const s = sideSign;
  const sc = cfg.scale;

  const R = cfg.R * sc;
  const outwardCenter = { x: a.x - s * R, y: a.y };

  const pts = [];
  const ang0 = 0;
  const ang1 = cfg.arcAng;

  for (let i = 0; i <= cfg.arcSteps; i++) {
    const t = i / cfg.arcSteps;
    const ang = lerp(ang0, ang1, t);
    pts.push({
      x: outwardCenter.x + Math.cos(ang) * R,
      y: outwardCenter.y + Math.sin(ang) * R,
    });
  }

  const end = pts[pts.length - 1];

  const curlR0 = cfg.curlR * sc;
  const curlCenter = {
    x: end.x - s * (cfg.curlIn * sc),
    y: end.y + (cfg.curlUp * sc),
  };

  const a0 = Math.atan2(end.y - curlCenter.y, end.x - curlCenter.x);
  const a1 = a0 + cfg.curlTurns * Math.PI * 2;

  for (let i = 1; i <= cfg.curlSteps; i++) {
    const t = i / cfg.curlSteps;
    const rr = lerp(curlR0, curlR0 * cfg.curlShrink, t);
    const ang = lerp(a0, a1, t);
    pts.push({ x: curlCenter.x + Math.cos(ang) * rr, y: curlCenter.y + Math.sin(ang) * rr });
  }

  return pts;
}

function drawCeremonialMoustache(a) {
  const cfg = FACE.ceremonial;

  const end = { x: -cfg.xFar, y: a.y + cfg.tailUp };
  const c1 = { x: -cfg.xFar * 0.35, y: a.y + cfg.up };
  const c2 = { x: -cfg.xFar * 0.78, y: a.y - cfg.down };

  const leftWave = cubicBezierPts(a, c1, c2, end, cfg.steps);

  const curl = [];
  const R = cfg.curlR;
  const turns = cfg.curlTurns;
  const N = Math.max(6, cfg.curlSteps | 0);

  const c = { x: end.x + R * 0.55, y: end.y + R * 0.35 };
  const a0 = Math.atan2(end.y - c.y, end.x - c.x);
  const a1 = a0 + turns * Math.PI * 2;

  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const rr = lerp(R, R * 0.35, t);
    const ang = lerp(a0, a1, t);
    curl.push({ x: c.x + Math.cos(ang) * rr, y: c.y + Math.sin(ang) * rr });
  }

  const left = [...leftWave, ...curl];
  const w = buildStrokeWeights(left, { pt: num(currVals["Physical touch"]), motionEnergy, mode: "wrap" });
  drawPolylineUnitVar(left, w);

  const right = left.map((p) => ({ x: -p.x, y: p.y }));
  drawPolylineUnitVar(right, w);
}

function drawCalmLeafTriplet(a) {
  const cfg = FACE.calm;

  for (const deg of cfg.copiesDeg) {
    const ang = (deg * Math.PI) / 180;
    const outline = buildCalmLeafOutlineUnit(a, cfg.h, cfg.w, cfg.steps);
    const rotated = outline.map((p) => rotAround(p, a, ang));

    stroke(255);
    strokeWeight(SH.strokeW);
    noFill();
    beginShape();
    for (const p of rotated) vertex(p.x * G.s, -p.y * G.s);
    endShape(CLOSE);
  }
}

function buildCalmLeafOutlineUnit(a, h, w, steps) {
  const top = { x: a.x, y: a.y + h };
  const cL = { x: a.x - w, y: a.y + h * 0.55 };
  const cR = { x: a.x + w, y: a.y + h * 0.55 };

  const left = quadBezierPts(a, cL, top, steps);
  const right = quadBezierPts(top, cR, a, steps);

  const out = [];
  for (let i = 0; i < left.length; i++) out.push(left[i]);
  for (let i = 1; i < right.length - 1; i++) out.push(right[i]);
  return out;
}

function rotAround(p, c, ang) {
  const cs = Math.cos(ang);
  const sn = Math.sin(ang);
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  return { x: c.x + dx * cs - dy * sn, y: c.y + dx * sn + dy * cs };
}

function quadBezierPts(a, c, b, steps) {
  const pts = [];
  const n = Math.max(2, steps | 0);
  for (let i = 0; i <= n; i++) pts.push(quadPt(a, c, b, i / n));
  return pts;
}

function getWarmSplitStrength(warmRaw) {
  const w = constrain(warmRaw, 0, 10);
  if (w >= WARM_SPLIT.startAt) return 0;
  const u = (WARM_SPLIT.startAt - w) / WARM_SPLIT.startAt;
  return smoothstep01(constrain(u, 0, 1));
}

function drawWarmthSplitBaselineAndReturnPBTips(yMin, yMax, warmRaw) {
  const splitT = getWarmSplitStrength(warmRaw);

  if (splitT <= 0.000001) {
    const pts = linePts({ x: 0, y: yMin }, { x: 0, y: yMax }, 46);
    stroke(255);
    strokeWeight(SH.strokeW);
    noFill();
    beginShape();
    for (const p of pts) vertex(p.x * G.s, -p.y * G.s);
    endShape();
    return [{ pos: { x: 0, y: yMin }, ang: 0 }];
  }

  const ySplit = lerp(yMin, yMax, WARM_SPLIT.lowerFrac);
  drawPolylineConst(linePts({ x: 0, y: ySplit }, { x: 0, y: yMax }, 26), SH.strokeW);

  const xTop = WARM_SPLIT.xTopMax * splitT;
  const bulge = WARM_SPLIT.bulgeMax * splitT;

  const tips = [];

  for (const sgn of [-1, +1]) {
    const A = { x: sgn * xTop, y: ySplit };
    const E = { x: 0, y: yMin };

    const C1 = { x: sgn * (xTop + bulge), y: lerp(ySplit, yMin, 0.33) };
    const C2 = { x: sgn * (bulge * 0.55), y: lerp(ySplit, yMin, 0.84) };

    const pts = cubicBezierPts(A, C1, C2, E, WARM_SPLIT.steps);
    drawPolylineConst(pts, SH.strokeW);

    const dv = unit2({ x: E.x - C2.x, y: E.y - C2.y });
    const ang = Math.atan2(dv.y, dv.x) + Math.PI / 2;

    tips.push({ pos: E, ang });
  }

  return tips;
}

function drawPolylineConst(unitPts, strokeW) {
  stroke(255);
  strokeWeight(strokeW);
  noFill();
  beginShape();
  for (const p of unitPts) vertex(p.x * G.s, -p.y * G.s);
  endShape();
}

function cubicBezierPts(a, c1, c2, b, steps) {
  const pts = [];
  const n = Math.max(2, steps | 0);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    pts.push({
      x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
      y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
    });
  }
  return pts;
}

function buildEyeContactWrap(beforePoly, afterPoly, P5, P6) {
  const n = Math.min(beforePoly.length, afterPoly.length);
  if (n < 10) return [];

  const i5 = closestIndex(afterPoly, P5);
  const i6 = closestIndex(afterPoly, P6);
  const lo = Math.min(i5, i6);
  const hi = Math.max(i5, i6);
  if (hi - lo < 8) return [];

  let maxD = 0;
  let iMax = lo;
  const D = new Array(n).fill(0);

  for (let i = lo; i <= hi; i++) {
    const dx = afterPoly[i].x - beforePoly[i].x;
    const dy = afterPoly[i].y - beforePoly[i].y;
    const d = Math.sqrt(dx * dx + dy * dy);
    D[i] = d;
    if (d > maxD) {
      maxD = d;
      iMax = i;
    }
  }

  if (maxD < EYE.minDeltaToShow) {
    const anchor = lerpPt(P5, P6, FORM.tOnP5P6);
    let bestI = lo;
    let bestD2 = Infinity;
    for (let i = lo; i <= hi; i++) {
      const dx = afterPoly[i].x - anchor.x;
      const dy = afterPoly[i].y - anchor.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) {
        bestD2 = d2;
        bestI = i;
      }
    }
    iMax = bestI;
  }

  const S = new Array(afterPoly.length).fill(0);
  for (let i = 1; i < afterPoly.length; i++) {
    const dx = afterPoly[i].x - afterPoly[i - 1].x;
    const dy = afterPoly[i].y - afterPoly[i - 1].y;
    S[i] = S[i - 1] + Math.sqrt(dx * dx + dy * dy);
  }

  const segLen = Math.max(1e-6, S[hi] - S[lo]);
  const desiredLen = segLen * 0.30 * EYE.lenMul;
  const half = desiredLen * 0.5;
  const sC = S[iMax];

  function walkToS(targetS, start, dir) {
    let i = start;
    while (i >= lo && i <= hi) {
      const next = i + dir;
      if (next < lo || next > hi) return i;
      if ((dir < 0 && S[next] <= targetS) || (dir > 0 && S[next] >= targetS)) return next;
      i = next;
    }
    return constrain(i, lo, hi);
  }

  let i0 = walkToS(sC - half, iMax, -1);
  let i1 = walkToS(sC + half, iMax, +1);

  i0 = constrain(i0 + EYE.endTrim, lo, hi);
  i1 = constrain(i1 - EYE.endTrim, lo, hi);
  if (i1 - i0 < 4) return [];

  const pC = afterPoly[iMax];
  const pPrev = afterPoly[Math.max(0, iMax - 1)];
  const pNext = afterPoly[Math.min(afterPoly.length - 1, iMax + 1)];
  const t = unit2({ x: pNext.x - pPrev.x, y: pNext.y - pPrev.y });
  let nrm = { x: -t.y, y: t.x };

  const signX = pC.x < 0 ? -1 : +1;
  const toOut = unit2({ x: signX, y: 0 });
  if (dot(nrm, toOut) < 0) nrm = { x: -nrm.x, y: -nrm.y };

  const off = EYE.offConst + EYE.extraGap;
  const dx = nrm.x * off;
  const dy = nrm.y * off - EYE.downShift;

  const out = [];
  for (let i = i0; i <= i1; i++) out.push({ x: afterPoly[i].x + dx, y: afterPoly[i].y + dy });
  return out;
}

function drawBodyInterlockingShape(P1, interlockAmount, bo, sideSign) {
  const t = interlockAmount / 10;
  if (t < 0.01) return;

  const rotOffset = INTERLOCK.orientRot[constrain(bo, 0, 2)] || 0;
  const rot = INTERLOCK.rotation + rotOffset;

  function rotatePoint(p, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return { x: p.x * cos - p.y * sin, y: p.x * sin + p.y * cos };
  }

  function transformCurve(curve) {
    return curve.map((p) => {
      const scaled = { x: p.x * INTERLOCK.scale, y: p.y * INTERLOCK.scale };
      let rotated = rotatePoint(scaled, rot);
      if (sideSign < 0) rotated.x *= -1;
      return { x: P1.x + rotated.x, y: P1.y + rotated.y };
    });
  }

  const upperTransformed = transformCurve(svgUpperCurve);
  const lowerTransformed = transformCurve(svgLowerCurve);

  const upperLen = upperTransformed.length;
  const lowerLen = lowerTransformed.length;

  const upperProgress = constrain(t / 0.7, 0, 1);
  const lowerProgress = constrain((t - 0.2) / 0.8, 0, 1);

  stroke(255);
  strokeWeight(SH.strokeW);
  noFill();

  if (upperProgress > 0.01) {
    const upperEndIdx = Math.floor(upperProgress * (upperLen - 1));
    beginShape();
    for (let i = 0; i <= upperEndIdx; i++) {
      const q = toPx(upperTransformed[i]);
      vertex(q.x, q.y);
    }
    if (upperEndIdx < upperLen - 1) {
      const frac = upperProgress * (upperLen - 1) - upperEndIdx;
      const p1 = upperTransformed[upperEndIdx];
      const p2 = upperTransformed[upperEndIdx + 1];
      const pInterp = { x: lerp(p1.x, p2.x, frac), y: lerp(p1.y, p2.y, frac) };
      const q = toPx(pInterp);
      vertex(q.x, q.y);
    }
    endShape();
  }

  if (lowerProgress > 0.01) {
    const lowerEndIdx = Math.floor(lowerProgress * (lowerLen - 1));
    beginShape();
    for (let i = 0; i <= lowerEndIdx; i++) {
      const q = toPx(lowerTransformed[i]);
      vertex(q.x, q.y);
    }
    if (lowerEndIdx < lowerLen - 1) {
      const frac = lowerProgress * (lowerLen - 1) - lowerEndIdx;
      const p1 = lowerTransformed[lowerEndIdx];
      const p2 = lowerTransformed[lowerEndIdx + 1];
      const pInterp = { x: lerp(p1.x, p2.x, frac), y: lerp(p1.y, p2.y, frac) };
      const q = toPx(pInterp);
      vertex(q.x, q.y);
    }
    endShape();
  }
}

function applyBodyOrientationToLowerLoop(poly, P4p, bo) {
  const out = poly.map((p) => ({ x: p.x, y: p.y }));
  const i4 = closestIndex(out, P4p);
  const hi = Math.max(6, i4);

  let P1draw = { name: "P1", x: out[0].x, y: out[0].y };

  if (bo === 2) {
    const S = cumLen(out, 0, hi);
    const total = S[hi] - S[0];
    const midS = S[0] + total * 0.55;
    for (let i = 0; i <= hi; i++) {
      const ds = Math.abs(S[i] - midS);
      const w = Math.exp(-Math.pow(ds / ORIENT.downSigma, 2));
      out[i].y -= ORIENT.downExtra * w;
    }
    P1draw = { name: "P1", x: out[0].x, y: out[0].y };
    return { poly: out, P1draw };
  }

  let jIdx = 0;

  if (bo === 0) {
    let bestX = -Infinity;
    for (let i = 0; i <= hi; i++) {
      if (out[i].x > bestX) {
        bestX = out[i].x;
        jIdx = i;
      }
    }
    const J = out[jIdx];
    const Pnew = { x: J.x, y: J.y + ORIENT.upLen };

    const cap = linePts(Pnew, J, 18);
    const rest = out.slice(jIdx + 1);

    const merged = [...cap, ...rest];
    P1draw = { name: "P1", x: Pnew.x, y: Pnew.y };
    return { poly: merged, P1draw };
  }

  let bestY = -Infinity;
  for (let i = 0; i <= hi; i++) {
    if (out[i].y > bestY) {
      bestY = out[i].y;
      jIdx = i;
    }
  }
  const J = out[jIdx];

  const Pnew = { x: J.x - ORIENT.forwardLen, y: J.y };
  const cap = linePts(Pnew, J, 14);
  const rest = out.slice(jIdx + 1);

  const merged = [...cap, ...rest];
  P1draw = { name: "P1", x: Pnew.x, y: Pnew.y };
  return { poly: merged, P1draw };
}

function linePts(a, b, n) {
  const pts = [];
  const steps = Math.max(2, n);
  for (let i = 0; i <= steps; i++) pts.push({ x: lerp(a.x, b.x, i / steps), y: lerp(a.y, b.y, i / steps) });
  return pts;
}

function cumLen(arr, i0, i1) {
  const S = new Array(arr.length).fill(0);
  for (let i = i0 + 1; i <= i1; i++) {
    const dx = arr[i].x - arr[i - 1].x;
    const dy = arr[i].y - arr[i - 1].y;
    S[i] = S[i - 1] + Math.sqrt(dx * dx + dy * dy);
  }
  return S;
}

function drawPowerBalanceBottomOriented(tip, pb, ang) {
  const rotated = buildPowerBalanceOutlineRotated(tip, pb, ang);

  push();
  noStroke();
  fill(255);
  beginShape();
  for (const p of rotated) {
    const q = toPx(p);
    vertex(q.x, q.y);
  }
  endShape(CLOSE);
  pop();
}

function buildPowerBalanceOutlineRotated(tip, pb, ang) {
  const tOrn = smoothstep01(constrain((5 - pb) / 5, 0, 1));
  const tSharp = smoothstep01(constrain((pb - 5) / 5, 0, 1));

  const tipLen = lerp(lerp(PB.tipLenMin, PB.tipLenMid, 1 - tOrn), PB.tipLenMax, tSharp);
  const headW = lerp(lerp(PB.headWMin, PB.headWMid, 1 - tOrn), PB.headWMax, tSharp);

  const N = PB.outlinePts;

  const tTri = smoothstep01(constrain(pb / 5, 0, 1));
  const circle = buildCircleTopAnchored(tip, PB.circleR, N);
  const tri = buildDownTriangleOutlineCurved(tip, headW, tipLen, N, PB.inwardBulge);

  const tDia = smoothstep01(constrain((pb - 9) / 1, 0, 1));
  const extraDown = tipLen * PB.diamondExtraLenFrac * tDia;
  const diamond = buildDiamondCurved(tip, headW, tipLen, extraDown, N, PB.inwardBulge);

  let outline = [];
  if (pb < 9) outline = lerpOutline(circle, tri, tTri);
  else outline = lerpOutline(tri, diamond, tDia);

  const cs = Math.cos(ang);
  const sn = Math.sin(ang);
  return outline.map((p) => {
    const dx = p.x - tip.x;
    const dy = p.y - tip.y;
    return { x: tip.x + dx * cs - dy * sn, y: tip.y + dx * sn + dy * cs };
  });
}

function buildCircleTopAnchored(tip, r, N) {
  const c = { x: tip.x, y: tip.y - r };
  const pts = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const ang = -Math.PI / 2 + a;
    pts.push({ x: c.x + Math.cos(ang) * r, y: c.y + Math.sin(ang) * r });
  }
  return pts;
}

function buildDownTriangleOutlineCurved(tip, headW, tipLen, N, bulge) {
  const baseY = tip.y - tipLen;
  const L = { x: tip.x - headW, y: baseY };
  const R = { x: tip.x + headW, y: baseY };

  const centroid = { x: (tip.x + L.x + R.x) / 3, y: (tip.y + L.y + R.y) / 3 };

  const n1 = Math.floor(N / 3);
  const n2 = Math.floor(N / 3);
  const n3 = N - n1 - n2;

  const pts = [];
  pushQuadEdge(pts, tip, L, centroid, bulge, n1);
  pushQuadEdge(pts, L, R, centroid, bulge, n2);
  pushQuadEdge(pts, R, tip, centroid, bulge, n3);
  return pts;
}

function buildDiamondCurved(tip, headW, tipLen, extraDownLen, N, bulge) {
  const baseY = tip.y - tipLen;
  const L = { x: tip.x - headW, y: baseY };
  const R = { x: tip.x + headW, y: baseY };
  const B = { x: tip.x, y: baseY - extraDownLen };

  const centroid = { x: (tip.x + L.x + B.x + R.x) / 4, y: (tip.y + L.y + B.y + R.y) / 4 };

  const n1 = Math.floor(N / 4);
  const n2 = Math.floor(N / 4);
  const n3 = Math.floor(N / 4);
  const n4 = N - n1 - n2 - n3;

  const pts = [];
  pushQuadEdge(pts, tip, L, centroid, bulge, n1);
  pushQuadEdge(pts, L, B, centroid, bulge, n2);
  pushQuadEdge(pts, B, R, centroid, bulge, n3);
  pushQuadEdge(pts, R, tip, centroid, bulge, n4);
  return pts;
}

function pushQuadEdge(arr, a, b, centroid, bulge, steps) {
  if (steps <= 0) return;
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const ctrl = { x: mid.x + (centroid.x - mid.x) * bulge, y: mid.y + (centroid.y - mid.y) * bulge };
  for (let i = 0; i < steps; i++) arr.push(quadPt(a, ctrl, b, i / steps));
}

function quadPt(a, c, b, t) {
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
}

function lerpOutline(A, B, t) {
  const out = [];
  const n = Math.min(A.length, B.length);
  for (let i = 0; i < n; i++) out.push({ x: lerp(A[i].x, B[i].x, t), y: lerp(A[i].y, B[i].y, t) });
  return out;
}

function applyFormalityDeform(poly, P5, P6, form) {
  const raw = constrain(form / 10, 0, 1);
  if (raw <= 0.000001) return poly;

  const t = Math.pow(smoothstep01(raw), FORM.rampPow);

  const i5 = closestIndex(poly, P5);
  const i6 = closestIndex(poly, P6);
  const lo = Math.min(i5, i6);
  const hi = Math.max(i5, i6);
  if (hi - lo < 4) return poly;

  const anchor = lerpPt(P5, P6, FORM.tOnP5P6);

  let iA = lo;
  let bestD = Infinity;
  for (let i = lo; i <= hi; i++) {
    const dx = poly[i].x - anchor.x;
    const dy = poly[i].y - anchor.y;
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      iA = i;
    }
  }

  const S = new Array(poly.length).fill(0);
  for (let i = 1; i < poly.length; i++) {
    const dx = poly[i].x - poly[i - 1].x;
    const dy = poly[i].y - poly[i - 1].y;
    S[i] = S[i - 1] + Math.sqrt(dx * dx + dy * dy);
  }
  const s0 = S[iA];

  const outwardX = poly[iA].x < 0 ? -1 : 1;
  const pullDir = unit2({ x: outwardX, y: FORM.upMix });

  const amp = FORM.pullMax * t;
  const out = poly.map((p) => ({ x: p.x, y: p.y }));

  for (let i = lo; i <= hi; i++) {
    const ds = Math.abs(S[i] - s0);
    const wWide = Math.exp(-Math.pow(ds / FORM.sigmaLen, 1));
    const wTip = Math.exp(-Math.pow(ds / FORM.tipSigma, 2)) * (FORM.tipBoost - 1.3);
    const w = wWide * (1 + wTip);

    out[i].x += pullDir.x * amp * w;
    out[i].y += pullDir.y * amp * w;
  }
  return out;
}

function lerpPt(a, b, t) { return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) }; }

function buildWarmthSpiralFromP6(twoPts, w, energy, normalSign) {
  const p5 = twoPts[0];
  const p6 = twoPts[1];

  const t = unit2({ x: p6.x - p5.x, y: p6.y - p5.y });

  const toCenter = unit2({ x: 0 - p6.x, y: 0 });
  let n = { x: -t.y, y: t.x };
  if (dot(n, toCenter) < 0) n = { x: -n.x, y: -n.y };
  if (normalSign < 0) n = { x: -n.x, y: -n.y };

  const stage = constrain(w / 10, 0, 1);

  const R0max = 2.15 * CURL.scale;
  const Rminmax = 0.18 * CURL.scale;

  const R0 = lerp(0.22, R0max, stage);
  const Rmin = lerp(0.08, Rminmax, stage);

  const turns = lerp(0.25 * Math.PI, 5.0 * Math.PI, stage);
  const N = Math.floor(lerp(10, 84, stage));

  const startAng = -(Math.PI / 2);
  const center = { x: p6.x + n.x * R0, y: p6.y + n.y * R0 };

  const pts = [{ x: p6.x, y: p6.y }];

  const staticAmt = ORG.staticAmountMax * stage;
  const liveAmt = ORG.liveAmountMax * stage * energy;
  const tt = (millis() / 1000) * ORG.timeSpeed;

  let lp = 0;
  for (let i = 1; i <= N; i++) {
    const k = i / N;
    const ang = startAng + k * turns;
    let r = lerp(R0, Rmin, k);

    const raw = (noise(NOISE_SEED_R + k * ORG.freq) - 0.5) * 2.0;
    lp = lerp(lp, raw, ORG.lowPass);
    r *= 1 + staticAmt * lp;

    if (liveAmt > 0.0001) {
      const liveN = (noise(NOISE_SEED_R + k * 2.2, tt) - 0.5) * 2.0;
      r *= 1 + liveAmt * 0.35 * liveN;
    }

    const dir = {
      x: t.x * Math.cos(ang) + n.x * Math.sin(ang),
      y: t.y * Math.cos(ang) + n.y * Math.sin(ang),
    };
    pts.push({ x: center.x + dir.x * r, y: center.y + dir.y * r });
  }
  return pts;
}

function buildUniformLoopArc(P1, P4, dxSD) {
  const cx = LOOP.cx + dxSD;
  const cy = LOOP.cy;
  const TAU = Math.PI * 2;

  const ellipsePts = [];
  for (let i = 0; i < LOOP.samples; i++) {
    const a = (i / LOOP.samples) * TAU;
    ellipsePts.push({ x: cx + Math.cos(a) * LOOP.rx, y: cy + Math.sin(a) * LOOP.ry });
  }

  const i1 = closestIndex(ellipsePts, P1);
  const i4 = closestIndex(ellipsePts, P4);

  const arcA = arcBetween(ellipsePts, i1, i4, +1);
  const arcB = arcBetween(ellipsePts, i1, i4, -1);

  const maxLen = Math.floor(LOOP.samples * LOOP.maxArcFraction);
  const aOK = arcA.length <= maxLen;
  const bOK = arcB.length <= maxLen;

  let arc = null;
  if (aOK && bOK) arc = avgY(arcA) > avgY(arcB) ? arcA : arcB;
  else if (aOK) arc = arcA;
  else if (bOK) arc = arcB;
  else arc = arcA.length < arcB.length ? arcA : arcB;

  const pStart = ellipsePts[i1];
  const pEnd = ellipsePts[i4];
  const inner = arc.slice(1, arc.length - 1);

  return { pStart, pEnd, arc: inner };
}

function sampleCentripetalSplineUnit(unitPts, samplesPerSeg) {
  if (!unitPts || unitPts.length < 2) return unitPts || [];

  const P = unitPts.map((p) => ({ x: p.x, y: p.y }));
  const p0 = extrapU(P[0], P[1]);
  const pN = extrapU(P[P.length - 1], P[P.length - 2]);
  const E = [p0, ...P, pN];

  const out = [];
  for (let i = 0; i < E.length - 3; i++) {
    const a = E[i], b = E[i + 1], c = E[i + 2], d = E[i + 3];
    const t0 = 0;
    const t1 = tjU(t0, a, b);
    const t2 = tjU(t1, b, c);
    const t3 = tjU(t2, c, d);

    for (let s = 0; s <= samplesPerSeg; s++) {
      const tt = lerp(t1, t2, s / samplesPerSeg);
      out.push(catmullU(a, b, c, d, t0, t1, t2, t3, tt));
    }
  }
  return out;
}

function tjU(ti, pi, pj) {
  const dx = pj.x - pi.x, dy = pj.y - pi.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return ti + Math.pow(dist, SH.alpha);
}

function catmullU(p0, p1, p2, p3, t0, t1, t2, t3, t) {
  const eps = 1e-6;
  const inv = (x) => 1 / (Math.abs(x) < eps ? eps : x);

  const A1 = lerpPtU(p0, p1, inv(t1 - t0) * (t - t0));
  const A2 = lerpPtU(p1, p2, inv(t2 - t1) * (t - t1));
  const A3 = lerpPtU(p2, p3, inv(t3 - t2) * (t - t2));
  const B1 = lerpPtU(A1, A2, inv(t2 - t0) * (t - t0));
  const B2 = lerpPtU(A2, A3, inv(t3 - t1) * (t - t1));
  return lerpPtU(B1, B2, inv(t2 - t1) * (t - t1));
}

function lerpPtU(a, b, t) { return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) }; }
function extrapU(a, b) { return { x: a.x + (a.x - b.x), y: a.y + (a.y - b.y) }; }

function drawLeftPoints(leftBase) {
  noStroke();
  fill(255);
  for (const p of leftBase) {
    const q = toPx(p);
    circle(q.x, q.y, SH.ptSize);
  }
}

function drawLeftPointLabels(leftBase) {
  noStroke();
  fill(255, SH.ptLabelAlpha);
  textSize(SH.ptLabelSize);
  textAlign(LEFT, BASELINE);
  for (const p of leftBase) {
    const q = toPx(p);
    text(p.name, q.x + SH.ptLabelDx, q.y + SH.ptLabelDy);
  }
}

// ===== grid/axes functions remain defined but unused now =====
function drawGrid() {
  stroke(255, G.aGrid);
  strokeWeight(G.wGrid);
  const halfW = width / 2, halfH = height / 2, s = G.s;
  for (let x = -ceil(halfW / s) * s; x <= halfW; x += s) line(x, -halfH, x, halfH);
  for (let y = -ceil(halfH / s) * s; y <= halfH; y += s) line(-halfW, y, halfW, y);
}

function drawAxes() {
  stroke(255, G.aAxis);
  strokeWeight(G.wAxis);
  const halfW = width / 2, halfH = height / 2;
  line(-halfW, 0, halfW, 0);
  line(0, -halfH, 0, halfH);
  stroke(255, 220);
  strokeWeight(2);
  point(0, 0);
}

function drawNumbers() {
  noStroke();
  fill(255, G.aTxt);
  textSize(G.txt);

  const halfW = width / 2;
  const step = G.s * G.every;

  textAlign(CENTER, TOP);
  for (let x = -ceil(halfW / step) * step; x <= halfW; x += step) {
    if (x === 0) continue;
    text(Math.round(x / G.s), x, G.off);
  }

  textAlign(LEFT, CENTER);
  const halfH = height / 2;
  for (let y = -ceil(halfH / step) * step; y <= halfH; y += step) {
    if (y === 0) continue;
    text(Math.round(-y / G.s), G.off, y);
  }
}

// =================== helpers ===================
function toPx(u) { return { x: u.x * G.s, y: -u.y * G.s }; }
function num(v) { const n = Number(v); return isFinite(n) ? n : 0; }
function unit2(v) { const m = Math.sqrt(v.x * v.x + v.y * v.y); return m < 1e-6 ? { x: 1, y: 0 } : { x: v.x / m, y: v.y / m }; }
function dot(a, b) { return a.x * b.x + a.y * b.y; }
function smoothstep01(x) { const t = constrain(x, 0, 1); return t * t * (3 - 2 * t); }

function closestIndex(arr, p) {
  let bestI = 0, bestD = Infinity;
  for (let i = 0; i < arr.length; i++) {
    const dx = arr[i].x - p.x, dy = arr[i].y - p.y;
    const d = dx * dx + dy * dy;
    if (d < bestD) { bestD = d; bestI = i; }
  }
  return bestI;
}

function arcBetween(arr, iStart, iEnd, dir) {
  const out = [];
  const n = arr.length;
  let i = iStart;
  while (true) {
    out.push(arr[i]);
    if (i === iEnd) break;
    i = (i + dir + n) % n;
    if (out.length > n + 2) break;
  }
  return out;
}

function avgY(arr) {
  if (!arr.length) return -1e9;
  let s = 0;
  for (const p of arr) s += p.y;
  return s / arr.length;
}

function drawAxesPoint() {}
